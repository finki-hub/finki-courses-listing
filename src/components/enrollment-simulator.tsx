/* eslint-disable no-alert */
import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  type Setter,
  Show,
} from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type CourseInfo,
  type CourseStatus,
  isPrerequisiteMet,
  parsePrerequisite,
  type PrereqNode,
} from '@/lib/prerequisite';
import {
  type CourseRaw,
  getAccreditationInfo,
  getCourseCredits,
  getCourseStateForProgram,
  STUDY_PROGRAM_LABELS,
  STUDY_PROGRAMS_2018,
  STUDY_PROGRAMS_2023,
} from '@/types/course';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Accreditation = '2018' | '2023';

type EnrollmentSimulatorProps = {
  courses: CourseRaw[];
};

type SimulatorCourse = {
  credits: number;
  level: number;
  name: string;
  prereqNode: PrereqNode;
  prerequisite: string | undefined;
  programState: string | undefined;
  raw: CourseRaw;
  semester: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'enrollment-';
const STORAGE_KEY_ACC = 'enrollment-accreditation';
const STORAGE_KEY_HPC = 'enrollment-hpc';
const STORAGE_KEY_PROGRAM = 'enrollment-program';

const HPC_CREDITS = 6;

const loadStatuses = (
  accreditation: Accreditation,
): Record<string, CourseStatus> => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${accreditation}`);
    return raw ? (JSON.parse(raw) as Record<string, CourseStatus>) : {};
  } catch {
    return {};
  }
};

const saveStatuses = (
  accreditation: Accreditation,
  statuses: Record<string, CourseStatus>,
): void => {
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${accreditation}`,
    JSON.stringify(statuses),
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CheckboxProps = {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

type CourseRowProps = {
  course: SimulatorCourse;
  enabled: boolean;
  listened: boolean;
  onToggleListened: () => void;
  onTogglePassed: () => void;
  overLimit: boolean;
  passed: boolean;
};

const Checkbox = (props: CheckboxProps) => (
  <button
    aria-checked={props.checked}
    class={`ring-offset-background focus-visible:ring-ring inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      props.checked
        ? 'bg-primary text-primary-foreground border-primary'
        : 'border-foreground/40 bg-background'
    } ${
      props.disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer hover:border-foreground'
    }`}
    disabled={props.disabled}
    onClick={() => {
      props.onToggle();
    }}
    role="checkbox"
    type="button"
  >
    <Show when={props.checked}>
      <svg
        class="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        viewBox="0 0 24 24"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </Show>
  </button>
);

const CourseRow = (props: CourseRowProps) => (
  <TableRow
    class={`box-border border-l-[3px] ${props.enabled ? '' : 'opacity-40'} ${
      props.overLimit
        ? 'bg-red-500/10 border-l-red-500'
        : props.passed
          ? 'bg-green-500/10 border-l-green-500'
          : props.listened
            ? 'bg-blue-500/10 border-l-blue-500'
            : 'border-l-transparent'
    }`}
    style={{ height: '41px' }}
  >
    <TableCell class="text-muted-foreground text-center text-xs">
      {props.course.semester}
    </TableCell>
    <TableCell class="font-medium">{props.course.name}</TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.listened}
        disabled={!props.enabled}
        onToggle={() => {
          props.onToggleListened();
        }}
      />
    </TableCell>
    <TableCell class="text-center">
      <Checkbox
        checked={props.passed}
        disabled={!props.enabled}
        onToggle={() => {
          props.onTogglePassed();
        }}
      />
    </TableCell>
    <TableCell class="text-muted-foreground hidden max-w-[200px] truncate text-sm md:table-cell">
      <Show
        fallback="–"
        when={props.course.prerequisite}
      >
        <span title={props.course.prerequisite}>
          {props.course.prerequisite}
        </span>
      </Show>
    </TableCell>
  </TableRow>
);

type SimulatorToolbarProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  onReset: () => void;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onSwitchProgram: (p: string) => void;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  program: string;
  showOnlyEnabled: boolean;
  totalCredits: number;
};

const SimulatorToolbar = (props: SimulatorToolbarProps) => {
  const programs = () =>
    props.accreditation === '2023' ? STUDY_PROGRAMS_2023 : STUDY_PROGRAMS_2018;

  return (
    <div class="space-y-3">
      {/* Row 1: selection controls */}
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div
          class="inline-flex rounded-md border"
          role="group"
        >
          <button
            class={`rounded-l-md px-4 py-2 text-sm font-medium transition-colors ${
              props.accreditation === '2023'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSwitchAccreditation('2023');
            }}
            type="button"
          >
            Акредитација 2023
          </button>
          <button
            class={`rounded-r-md px-4 py-2 text-sm font-medium transition-colors ${
              props.accreditation === '2018'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSwitchAccreditation('2018');
            }}
            type="button"
          >
            Акредитација 2018
          </button>
        </div>

        <div class="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <div
            class="inline-flex rounded-md border"
            role="group"
          >
            <For each={[...programs()]}>
              {(p, i) => (
                <button
                  class={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                    i() === 0 ? 'rounded-l-md' : ''
                  } ${i() === programs().length - 1 ? 'rounded-r-md' : ''} ${
                    props.program === p
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    props.onSwitchProgram(p);
                  }}
                  type="button"
                >
                  {STUDY_PROGRAM_LABELS[p] ?? p}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Row 2: stats + actions */}
      <div class="flex flex-wrap items-center gap-3 sm:gap-4">
        <div class="text-sm">
          Вкупно кредити: <span class="font-bold">{props.totalCredits}</span>
          <Show when={props.totalCredits >= 180}>
            <span class="text-green-600 ml-2 font-medium">
              (≥ 180 — сите предмети се отклучени)
            </span>
          </Show>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            checked={props.hpcCompleted}
            class="accent-primary h-4 w-4"
            onChange={() => {
              props.onToggleHpc();
            }}
            type="checkbox"
          />
          HPC (+{HPC_CREDITS} кредити)
        </label>

        <div class="sm:ml-auto" />

        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            checked={props.showOnlyEnabled}
            class="accent-primary h-4 w-4"
            onChange={() => {
              props.onToggleFilter();
            }}
            type="checkbox"
          />
          Само достапни
        </label>

        <button
          class="text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
          onClick={() => {
            props.onReset();
          }}
          type="button"
        >
          Ресетирај
        </button>
      </div>
    </div>
  );
};

type CreditLimitWarningProps = {
  levelLimits: Record<number, number>;
  levels: number[];
};

const CreditLimitWarning = (props: CreditLimitWarningProps) => (
  <Show when={props.levels.length > 0}>
    <div class="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
      ⚠ Надминати се максимално дозволените запишани кредити за{' '}
      {props.levels
        .map(
          (lvl) =>
            `L${String(lvl)} (макс. ${String(props.levelLimits[lvl] ?? 0)})`,
        )
        .join(', ')}
    </div>
  </Show>
);

// ---------------------------------------------------------------------------
// Prerequisite fixpoint
// ---------------------------------------------------------------------------

const computeEnabledMap = (config: {
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
      // Courses with "нема" state bypass prerequisites entirely
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

// ---------------------------------------------------------------------------
// Derived course data
// ---------------------------------------------------------------------------

const useSimulatorCourses = (
  getCourses: () => CourseRaw[],
  getAccreditation: () => Accreditation,
  getProgram: () => string,
) => {
  const simulatorCourses = createMemo<SimulatorCourse[]>(() => {
    const acc = getAccreditation();
    const prog = getProgram();
    const courses: SimulatorCourse[] = [];

    for (const raw of getCourses()) {
      const info = getAccreditationInfo(raw, acc);
      if (!info) continue;

      const name = info.name ?? raw.name;
      if (!info.semester) continue;
      const semester = Number.parseInt(info.semester);

      const level = info.level ? Number.parseInt(info.level) : 0;
      const programState = getCourseStateForProgram(raw, acc, prog);

      courses.push({
        credits: getCourseCredits(raw, acc),
        level,
        name,
        prereqNode: { type: 'none' },
        prerequisite: info.prerequisite,
        programState,
        raw,
        semester,
      });
    }

    courses.sort(
      (a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'mk'),
    );
    return courses;
  });

  const parsedCourses = createMemo<SimulatorCourse[]>(() => {
    const list = simulatorCourses();
    const names = list.map((c) => c.name);
    return list.map((c) => ({
      ...c,
      prereqNode: parsePrerequisite(c.prerequisite, names),
    }));
  });

  const courseInfoMap = createMemo<Map<string, CourseInfo>>(() => {
    const map = new Map<string, CourseInfo>();
    for (const c of parsedCourses()) {
      map.set(c.name, {
        credits: c.credits,
        name: c.name,
        semester: c.semester,
      });
    }
    return map;
  });

  return { courseInfoMap, parsedCourses };
};

// ---------------------------------------------------------------------------
// Side-effects hook
// ---------------------------------------------------------------------------

type SimulatorEffectsParams = {
  accreditation: Accessor<Accreditation>;
  enabledMap: Accessor<Record<string, boolean>>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  program: Accessor<string>;
  setStatuses: Setter<Record<string, CourseStatus>>;
  statuses: Accessor<Record<string, CourseStatus>>;
};

const useSimulatorEffects = (params: SimulatorEffectsParams): void => {
  const {
    accreditation,
    enabledMap,
    parsedCourses,
    program,
    setStatuses,
    statuses,
  } = params;

  // Cascade-uncheck courses whose prerequisites became unmet
  createEffect(
    on([enabledMap, statuses], ([enabled, s]) => {
      const updates: Record<string, CourseStatus> = {};
      let changed = false;
      for (const c of parsedCourses()) {
        const st = s[c.name];
        if (!st) continue;
        if ((st.listened || st.passed) && enabled[c.name] === false) {
          updates[c.name] = { listened: false, passed: false };
          changed = true;
        }
      }
      if (changed) {
        setStatuses((prev) => ({ ...prev, ...updates }));
      }
    }),
  );

  createEffect(
    on(statuses, (s) => {
      saveStatuses(accreditation(), s);
    }),
  );

  createEffect(
    on(accreditation, (acc) => {
      localStorage.setItem(STORAGE_KEY_ACC, acc);
    }),
  );

  createEffect(
    on(program, (p) => {
      localStorage.setItem(STORAGE_KEY_PROGRAM, p);
    }),
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EnrollmentSimulator = (props: EnrollmentSimulatorProps) => {
  const savedAcc =
    (localStorage.getItem(STORAGE_KEY_ACC) as Accreditation | null) ?? '2023';
  const defaultPrograms =
    savedAcc === '2018' ? STUDY_PROGRAMS_2018 : STUDY_PROGRAMS_2023;
  const savedProgram =
    localStorage.getItem(STORAGE_KEY_PROGRAM) ?? defaultPrograms[0];

  const [accreditation, setAccreditation] =
    createSignal<Accreditation>(savedAcc);
  const [program, setProgram] = createSignal<string>(savedProgram);
  const [statuses, setStatuses] = createSignal<Record<string, CourseStatus>>(
    loadStatuses(savedAcc),
  );

  const [showOnlyEnabled, setShowOnlyEnabled] = createSignal(false);
  const [hpcCompleted, setHpcCompleted] = createSignal(
    localStorage.getItem(STORAGE_KEY_HPC) === 'true',
  );

  const { courseInfoMap, parsedCourses } = useSimulatorCourses(
    () => props.courses,
    accreditation,
    program,
  );

  const totalCredits = createMemo(() => {
    const s = statuses();
    let sum = 0;
    for (const c of parsedCourses()) {
      if (s[c.name]?.passed) sum += c.credits;
    }
    if (hpcCompleted()) sum += HPC_CREDITS;
    return sum;
  });

  createEffect(
    on(hpcCompleted, (v) => {
      localStorage.setItem(STORAGE_KEY_HPC, String(v));
    }),
  );

  const LEVEL_CREDIT_LIMITS: Record<number, number> = { 1: 6, 2: 36 };

  const overLimitInfo = createMemo(() => {
    const s = statuses();
    const electiveCreditsPerLevel: Record<number, number> = {};
    const electiveCoursesByLevel: Record<number, SimulatorCourse[]> = {};

    for (const c of parsedCourses()) {
      if (!s[c.name]?.passed) continue;
      const isRequired = c.programState?.includes('задолжителен') ?? false;
      if (isRequired) continue;
      electiveCreditsPerLevel[c.level] =
        (electiveCreditsPerLevel[c.level] ?? 0) + c.credits;
      (electiveCoursesByLevel[c.level] ??= []).push(c);
    }

    const names = new Set<string>();
    const levels: number[] = [];
    for (const [level, limit] of Object.entries(LEVEL_CREDIT_LIMITS)) {
      const lvl = Number(level);
      if ((electiveCreditsPerLevel[lvl] ?? 0) > limit) {
        levels.push(lvl);
        for (const c of electiveCoursesByLevel[lvl] ?? []) {
          names.add(c.name);
        }
      }
    }
    return { levels, names };
  });

  const overLimitSet = createMemo(() => overLimitInfo().names);
  const overLimitLevels = createMemo(() => overLimitInfo().levels);

  const enabledMap = createMemo(() =>
    computeEnabledMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      statuses: statuses(),
    }),
  );

  // ---- side effects ----

  useSimulatorEffects({
    accreditation,
    enabledMap,
    parsedCourses,
    program,
    setStatuses,
    statuses,
  });

  // ---- handlers ----

  const switchAccreditation = (acc: Accreditation) => {
    setAccreditation(acc);
    setProgram(
      acc === '2023' ? STUDY_PROGRAMS_2023[0] : STUDY_PROGRAMS_2018[0],
    );
    setStatuses(loadStatuses(acc));
  };

  const toggleListened = (name: string) => {
    setStatuses((prev) => {
      const cur = prev[name] ?? { listened: false, passed: false };
      const listened = !cur.listened;
      return {
        ...prev,
        [name]: { listened, passed: listened ? cur.passed : false },
      };
    });
  };

  const togglePassed = (name: string) => {
    setStatuses((prev) => {
      const cur = prev[name] ?? { listened: false, passed: false };
      const passed = !cur.passed;
      return { ...prev, [name]: { listened: passed || cur.listened, passed } };
    });
  };

  const resetStatuses = () => {
    if (
      !window.confirm(
        'Дали сте сигурни дека сакате да ги ресетирате сите избрани предмети?',
      )
    )
      return;
    setStatuses({});
    setHpcCompleted(false);
  };

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">
        Означете ги предметите кои сте ги слушале или положиле. Предметите за
        кои не се исполнети предусловите се оневозможени.
      </p>

      <SimulatorToolbar
        accreditation={accreditation()}
        hpcCompleted={hpcCompleted()}
        onReset={resetStatuses}
        onSwitchAccreditation={switchAccreditation}
        onSwitchProgram={setProgram}
        onToggleFilter={() => {
          setShowOnlyEnabled((v) => !v);
        }}
        onToggleHpc={() => {
          setHpcCompleted((v) => !v);
        }}
        program={program()}
        showOnlyEnabled={showOnlyEnabled()}
        totalCredits={totalCredits()}
      />

      <CreditLimitWarning
        levelLimits={LEVEL_CREDIT_LIMITS}
        levels={overLimitLevels()}
      />

      {/* table */}
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-16 text-center">Сем.</TableHead>
              <TableHead>Предмет</TableHead>
              <TableHead class="w-24 text-center">Слушан</TableHead>
              <TableHead class="w-24 text-center">Положен</TableHead>
              <TableHead class="hidden md:table-cell">Предуслов</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={parsedCourses()}>
              {(course) => {
                const enabled = () => enabledMap()[course.name] ?? true;
                return (
                  <Show when={!showOnlyEnabled() || enabled()}>
                    <CourseRow
                      course={course}
                      enabled={enabled()}
                      listened={statuses()[course.name]?.listened ?? false}
                      onToggleListened={() => {
                        toggleListened(course.name);
                      }}
                      onTogglePassed={() => {
                        togglePassed(course.name);
                      }}
                      overLimit={overLimitSet().has(course.name)}
                      passed={statuses()[course.name]?.passed ?? false}
                    />
                  </Show>
                );
              }}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
