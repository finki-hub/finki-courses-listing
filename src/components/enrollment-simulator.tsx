/* eslint-disable no-alert */
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
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
  raw: CourseRaw;
  semester: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'enrollment-';

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
  onReset: () => void;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onToggleFilter: () => void;
  showOnlyEnabled: boolean;
  totalCredits: number;
};

const SimulatorToolbar = (props: SimulatorToolbarProps) => (
  <div class="flex flex-wrap items-center gap-4">
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

    <div class="text-sm">
      Вкупно кредити: <span class="font-bold">{props.totalCredits}</span>
      <Show when={props.totalCredits >= 180}>
        <span class="text-green-600 ml-2 font-medium">
          (≥ 180 — сите предмети се отклучени)
        </span>
      </Show>
    </div>

    <button
      class="text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
      onClick={() => {
        props.onReset();
      }}
      type="button"
    >
      Ресетирај
    </button>

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
  </div>
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
) => {
  const simulatorCourses = createMemo<SimulatorCourse[]>(() => {
    const acc = getAccreditation();
    const courses: SimulatorCourse[] = [];

    for (const raw of getCourses()) {
      const info = getAccreditationInfo(raw, acc);
      if (!info) continue;

      const name = info.name ?? raw.name;
      if (!info.semester) continue;
      const semester = Number.parseInt(info.semester);

      const level = info.level ? Number.parseInt(info.level) : 0;

      courses.push({
        credits: getCourseCredits(raw, acc),
        level,
        name,
        prereqNode: { type: 'none' },
        prerequisite: info.prerequisite,
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
// Component
// ---------------------------------------------------------------------------

export const EnrollmentSimulator = (props: EnrollmentSimulatorProps) => {
  const [accreditation, setAccreditation] = createSignal<Accreditation>('2023');
  const [statuses, setStatuses] = createSignal<Record<string, CourseStatus>>(
    loadStatuses('2023'),
  );

  const [showOnlyEnabled, setShowOnlyEnabled] = createSignal(false);

  const { courseInfoMap, parsedCourses } = useSimulatorCourses(
    () => props.courses,
    accreditation,
  );

  const totalCredits = createMemo(() => {
    const s = statuses();
    let sum = 0;
    for (const c of parsedCourses()) {
      if (s[c.name]?.passed) sum += c.credits;
    }
    return sum;
  });

  const LEVEL_CREDIT_LIMITS: Record<number, number> = { 1: 6, 2: 36 };

  const overLimitSet = createMemo<Set<string>>(() => {
    const s = statuses();
    const creditsPerLevel: Record<number, number> = {};
    const coursesByLevel: Record<number, SimulatorCourse[]> = {};

    for (const c of parsedCourses()) {
      if (!s[c.name]?.passed) continue;
      creditsPerLevel[c.level] = (creditsPerLevel[c.level] ?? 0) + c.credits;
      (coursesByLevel[c.level] ??= []).push(c);
    }

    const result = new Set<string>();
    for (const [level, limit] of Object.entries(LEVEL_CREDIT_LIMITS)) {
      const lvl = Number(level);
      if ((creditsPerLevel[lvl] ?? 0) > limit) {
        for (const c of coursesByLevel[lvl] ?? []) {
          result.add(c.name);
        }
      }
    }
    return result;
  });

  const enabledMap = createMemo(() =>
    computeEnabledMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      statuses: statuses(),
    }),
  );

  // ---- cascade unchecks when prerequisites become unmet ----

  createEffect(
    on([enabledMap, statuses], ([enabled, s]) => {
      let needsUpdate = false;
      const next = { ...s };

      for (const c of parsedCourses()) {
        if (
          !enabled[c.name] &&
          (next[c.name]?.listened || next[c.name]?.passed)
        ) {
          next[c.name] = { listened: false, passed: false };
          needsUpdate = true;
        }
      }

      if (needsUpdate) setStatuses(next);
    }),
  );

  // ---- persist to localStorage ----

  createEffect(
    on(statuses, (s) => {
      saveStatuses(accreditation(), s);
    }),
  );

  // ---- handlers ----

  const switchAccreditation = (acc: Accreditation) => {
    setAccreditation(acc);
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
  };

  return (
    <div class="space-y-4">
      <SimulatorToolbar
        accreditation={accreditation()}
        onReset={resetStatuses}
        onSwitchAccreditation={switchAccreditation}
        onToggleFilter={() => {
          setShowOnlyEnabled((v) => !v);
        }}
        showOnlyEnabled={showOnlyEnabled()}
        totalCredits={totalCredits()}
      />

      {/* table */}
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-16 text-center">Сем.</TableHead>
              <TableHead>Предмет</TableHead>
              <TableHead class="w-24 text-center">Слушано</TableHead>
              <TableHead class="w-24 text-center">Положено</TableHead>
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
