import {
  type CourseInfo,
  type CourseStatus,
  type EvalContext,
  isPrerequisiteMet,
  type PrereqNode,
} from '@/lib/prerequisite';
import {
  type AccreditationInfo,
  type CourseRaw,
  getCourseCredits,
  getCourseStateForProgram,
} from '@/types/course';

export type Accreditation = '2018' | '2023';
export type SeasonFilter = 'summer' | 'winter' | null;

export type SimulatorCourse = {
  credits: number;
  level: number;
  name: string;
  prereqNode: PrereqNode;
  prerequisite: string | undefined;
  programState: string | undefined;
  raw: CourseRaw;
  rawPrereqNode: PrereqNode;
  semester: number;
};

export const STORAGE_KEY_PREFIX = 'enrollment-';
export const STORAGE_KEY_ACC = `${STORAGE_KEY_PREFIX}accreditation`;
export const STORAGE_KEY_HPC = `${STORAGE_KEY_PREFIX}hpc`;
export const STORAGE_KEY_PROGRAM = `${STORAGE_KEY_PREFIX}program`;
export const HPC_CREDITS = 6;
export const LEVEL_CREDIT_LIMITS: Record<number, number> = { 1: 6, 2: 36 };
export const REQUIRED_MARKER =
  '\u0437\u0430\u0434\u043E\u043B\u0436\u0438\u0442\u0435\u043B\u0435\u043D';

export const loadStatuses = (
  accreditation: Accreditation,
): Record<string, CourseStatus> => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${accreditation}`);
    return raw ? (JSON.parse(raw) as Record<string, CourseStatus>) : {};
  } catch {
    return {};
  }
};

export const saveStatuses = (
  accreditation: Accreditation,
  statuses: Record<string, CourseStatus>,
): void => {
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${accreditation}`,
    JSON.stringify(statuses),
  );
};

export const buildSimulatorCourse = (config: {
  acc: Accreditation;
  info: AccreditationInfo;
  prog: string;
  raw: CourseRaw;
}): SimulatorCourse | undefined => {
  const { acc, info, prog, raw } = config;
  const name = info.name ?? raw.name;
  if (!info.semester) return undefined;
  const semester = Number.parseInt(info.semester);
  const level = info.level ? Number.parseInt(info.level) : 0;
  const programState = getCourseStateForProgram(raw, acc, prog);

  return {
    credits: getCourseCredits(raw, acc),
    level,
    name,
    prereqNode: { type: 'none' },
    prerequisite: info.prerequisite,
    programState,
    raw,
    rawPrereqNode: { type: 'none' },
    semester,
  };
};

export const pruneElectivePrereqs = (
  node: PrereqNode,
  electives: Set<string>,
): PrereqNode => {
  switch (node.type) {
    case 'and':
    case 'or': {
      const children = node.children
        .map((c) => pruneElectivePrereqs(c, electives))
        .filter((c) => c.type !== 'none');
      if (children.length === 0) return { type: 'none' };
      if (children.length === 1) return children[0] ?? { type: 'none' };
      return { children, type: node.type };
    }
    case 'course':
      return electives.has(node.name) ? { type: 'none' } : node;
    default:
      return node;
  }
};

export const computeEnabledMap = (config: {
  courseInfoMap: Map<string, CourseInfo>;
  courses: SimulatorCourse[];
  statuses: Record<string, CourseStatus>;
}): Record<string, boolean> => {
  const { courseInfoMap: infoMap, courses, statuses: s } = config;
  const enabled: Record<string, boolean> = {};

  for (const c of courses) enabled[c.name] = true;

  for (let iter = 0; iter < 20; iter++) {
    let changed = false;
    let credits = 0;
    for (const c of courses) {
      if (s[c.name]?.passed && enabled[c.name]) credits += c.credits;
    }
    for (const c of courses) {
      if (c.programState === 'нема') {
        if (!enabled[c.name]) {
          enabled[c.name] = true;
          changed = true;
        }
        continue;
      }
      const met = isPrerequisiteMet(c.prereqNode, {
        courseInfoMap: infoMap,
        courseSemester: c.semester,
        statuses: s,
        totalCredits: credits,
      });
      if (met !== enabled[c.name]) {
        enabled[c.name] = met;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return enabled;
};

const describePrereqNode = (
  node: PrereqNode,
  ctx: EvalContext,
  electives: Set<string>,
): string[] => {
  switch (node.type) {
    case 'and':
      return node.children.flatMap((c) =>
        describePrereqNode(c, ctx, electives),
      );
    case 'course': {
      if (electives.has(node.name)) {
        return [`  \u2796 ${node.name} (изборен \u2014 не е предуслов)`];
      }
      const st = ctx.statuses[node.name];
      const info = ctx.courseInfoMap.get(node.name);
      const diff = info ? ctx.courseSemester - info.semester : 2;
      const needed = diff === 1 ? 'слушан' : 'положен';
      const met = diff === 1 ? (st?.listened ?? false) : (st?.passed ?? false);
      return [
        met
          ? `  \u2705 ${node.name} (${needed})`
          : `  \u274C ${node.name} (потребно: ${needed})`,
      ];
    }
    case 'credits': {
      const met = ctx.totalCredits >= node.amount;
      return [
        met
          ? `  \u2705 ${String(node.amount)} кредити`
          : `  \u274C ${String(node.amount)} кредити (имате ${String(ctx.totalCredits)})`,
      ];
    }
    case 'or': {
      const descs = node.children.map((c) =>
        describePrereqNode(c, ctx, electives),
      );
      const metIdx = descs.findIndex((d) =>
        d.every((line) => line.includes('\u2705')),
      );
      return metIdx === -1 ? descs.flat() : (descs[metIdx] ?? []);
    }
    default:
      return [];
  }
};

export const computeReasonMap = (config: {
  courseInfoMap: Map<string, CourseInfo>;
  courses: SimulatorCourse[];
  electiveCourses: Set<string>;
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  overLimitSet: Set<string>;
  statuses: Record<string, CourseStatus>;
  totalCredits: number;
}): Record<string, string> => {
  const reasons: Record<string, string> = {};

  for (const c of config.courses) {
    const parts: string[] = [];
    const st = config.statuses[c.name];
    const isRequired = c.programState?.includes(REQUIRED_MARKER) ?? false;
    const enabled = config.enabledMap[c.name] ?? true;

    // ── Status ──
    if (st?.passed) parts.push('\u2705 Статус: Положен');
    else if (st?.listened) parts.push('\uD83D\uDCD6 Статус: Слушан');
    else parts.push('\u2B1C Статус: Не е слушан');

    // ── Enrollment eligibility ──
    if (enabled) {
      parts.push('\u2705 Може да се запише');
    } else {
      parts.push('\u274C Не може да се запише (предусловите не се исполнети)');
    }

    // ── Credit level limits ──
    if (config.overLimitSet.has(c.name)) {
      const limit = LEVEL_CREDIT_LIMITS[c.level] ?? 0;
      parts.push(
        `\u274C Надминат L${String(c.level)} лимит (макс. ${String(limit)} кредити)`,
      );
    } else if (!st?.passed && !isRequired && config.fullLevels.has(c.level)) {
      const limit = LEVEL_CREDIT_LIMITS[c.level] ?? 0;
      parts.push(
        `\u26A0\uFE0F L${String(c.level)} лимит пополнет (${String(limit)} кредити)`,
      );
    }

    // ── Program info ──
    if (isRequired) {
      parts.push(`\u2139\uFE0F Задолжителен предмет`);
    } else if (
      c.programState &&
      c.programState !== '\u043D\u0435\u043C\u0430'
    ) {
      parts.push('\u2139\uFE0F Изборен предмет');
    }

    // ── Prerequisites ──
    if (c.programState === '\u043D\u0435\u043C\u0430') {
      parts.push('\u2139\uFE0F Факултетска листа \u2013 нема предуслов');
    } else if (
      c.prereqNode.type === 'none' &&
      c.rawPrereqNode.type === 'none'
    ) {
      parts.push('\u2705 Нема предуслов');
    } else {
      let credits = 0;
      for (const cc of config.courses) {
        if (
          config.statuses[cc.name]?.passed &&
          (config.enabledMap[cc.name] ?? false)
        ) {
          credits += cc.credits;
        }
      }
      const ctx: EvalContext = {
        courseInfoMap: config.courseInfoMap,
        courseSemester: c.semester,
        statuses: config.statuses,
        totalCredits: credits,
      };
      if (credits >= 180) {
        parts.push('\u2705 \u2265180 кредити \u2013 предуслови не важат');
      } else {
        parts.push(
          '\uD83D\uDCCB Предуслов:',
          ...describePrereqNode(c.rawPrereqNode, ctx, config.electiveCourses),
        );
      }
    }

    reasons[c.name] = parts.join('\n');
  }

  return reasons;
};

type RasterizeOptions = {
  height: number;
  pixelRatio: number;
  svgDataUrl: string;
  width: number;
};

const rasterizeInWorker = ({
  height,
  pixelRatio,
  svgDataUrl,
  width,
}: RasterizeOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('screenshot-worker.ts', import.meta.url),
      { type: 'module' },
    );

    const encoded = new TextEncoder().encode(svgDataUrl);
    const { buffer } = encoded;

    worker.addEventListener(
      'message',
      (e: MessageEvent<{ blob?: Blob; error?: string }>) => {
        worker.terminate();
        if (e.data.error) reject(new Error(e.data.error));
        else if (e.data.blob) resolve(e.data.blob);
        else reject(new Error('No blob returned'));
      },
    );

    worker.addEventListener('error', (e) => {
      worker.terminate();
      reject(new Error(e.message));
    });

    worker.postMessage({ buffer, height, pixelRatio, width }, [buffer]);
  });

const rasterizeOnMainThread = ({
  height,
  pixelRatio,
  svgDataUrl,
  width,
}: RasterizeOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob returned null'));
      }, 'image/png');
    });
    img.addEventListener('error', () => {
      reject(new Error('Image load failed'));
    });
    img.src = svgDataUrl;
  });

export const captureTableToClipboard = async (
  element: HTMLElement,
): Promise<boolean> => {
  const { toSvg } = await import('html-to-image');

  const pixelRatio = 2;
  const backgroundColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim() ||
    (document.documentElement.classList.contains('dark')
      ? '#09090b'
      : '#ffffff');

  try {
    const svgDataUrl = await toSvg(element, { backgroundColor, pixelRatio });

    const opts: RasterizeOptions = {
      height: element.scrollHeight,
      pixelRatio,
      svgDataUrl,
      width: element.scrollWidth,
    };

    const blob = await rasterizeInWorker(opts).catch(() =>
      rasterizeOnMainThread(opts),
    );

    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
};

export const computeOverLimitInfo = (
  courses: SimulatorCourse[],
  s: Record<string, CourseStatus>,
): {
  excessCredits: number;
  fullLevels: Set<number>;
  levels: number[];
  names: Set<string>;
} => {
  const creditsPerLevel: Record<number, number> = {};
  const coursesByLevel: Record<number, SimulatorCourse[]> = {};

  for (const c of courses) {
    if (!s[c.name]?.passed) continue;
    const isRequired = c.programState?.includes(REQUIRED_MARKER) ?? false;
    if (isRequired) continue;
    creditsPerLevel[c.level] = (creditsPerLevel[c.level] ?? 0) + c.credits;
    (coursesByLevel[c.level] ??= []).push(c);
  }

  const names = new Set<string>();
  const levels: number[] = [];
  const fullLevels = new Set<number>();
  let excessCredits = 0;

  for (const [level, limit] of Object.entries(LEVEL_CREDIT_LIMITS)) {
    const lvl = Number(level);
    const actual = creditsPerLevel[lvl] ?? 0;

    if (actual >= limit) fullLevels.add(lvl);
    if (actual <= limit) continue;

    levels.push(lvl);
    excessCredits += actual - limit;

    const list = (coursesByLevel[lvl] ?? []).slice();
    list.sort(
      (a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'mk'),
    );

    let acc = 0;
    for (const c of list) {
      if (acc + c.credits <= limit) {
        acc += c.credits;
      } else {
        names.add(c.name);
      }
    }
  }

  return { excessCredits, fullLevels, levels, names };
};
