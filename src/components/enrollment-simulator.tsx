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

import { Badge } from '@/components/ui/badge';
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
  parsePrerequisite,
} from '@/lib/prerequisite';
import {
  type Accreditation,
  buildSimulatorCourse,
  computeEnabledMap,
  computeOverLimitInfo,
  computeReasonMap,
  HPC_CREDITS,
  LEVEL_CREDIT_LIMITS,
  loadStatuses,
  pruneElectivePrereqs,
  REQUIRED_MARKER,
  saveStatuses,
  type SeasonFilter,
  type SimulatorCourse,
  STORAGE_KEY_ACC,
  STORAGE_KEY_HPC,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';
import {
  type CourseRaw,
  getAccreditationInfo,
  STUDY_PROGRAM_LABELS,
  STUDY_PROGRAMS_2018,
  STUDY_PROGRAMS_2023,
} from '@/types/course';

type CheckboxProps = {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

type CourseRowProps = {
  atLimit: boolean;
  course: SimulatorCourse;
  enabled: boolean;
  listened: boolean;
  onToggleListened: () => void;
  onTogglePassed: () => void;
  overLimit: boolean;
  passed: boolean;
  reason: string;
};

type EnrollmentSimulatorProps = {
  courses: CourseRaw[];
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
            : props.atLimit
              ? 'bg-orange-500/10 border-l-orange-400'
              : 'border-l-transparent'
    }`}
    style={{ height: '41px' }}
  >
    <TableCell class="text-muted-foreground text-center text-xs">
      {props.course.semester}
    </TableCell>
    <TableCell class="font-medium">
      <span
        class="group/tip inline-flex cursor-help items-center gap-1 leading-none"
        title={props.reason}
      >
        {props.course.name}
        <Show when={props.course.programState}>
          {(state) => {
            const req = () => state().includes(REQUIRED_MARKER);
            return (
              <Badge
                class={`ml-1 px-1.5 py-0 text-[10px] leading-4 font-normal ${req() ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'}`}
                variant="outline"
              >
                {req() ? 'Задолжителен' : 'Изборен'}
              </Badge>
            );
          }}
        </Show>
        <svg
          class="text-muted-foreground/50 group-hover/tip:text-muted-foreground h-3.5 w-3.5 shrink-0 translate-y-px transition-colors"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </span>
    </TableCell>
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
  onSetSeason: (s: SeasonFilter) => void;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onSwitchProgram: (p: string) => void;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
};

const SimulatorToolbar = (props: SimulatorToolbarProps) => {
  const programs = () =>
    props.accreditation === '2023' ? STUDY_PROGRAMS_2023 : STUDY_PROGRAMS_2018;

  return (
    <div class="space-y-3">
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

        <div
          class="inline-flex rounded-md border"
          role="group"
        >
          <button
            class={`rounded-l-md px-3 py-2 text-sm font-medium transition-colors ${
              props.seasonFilter === 'winter'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSetSeason(
                props.seasonFilter === 'winter' ? null : 'winter',
              );
            }}
            type="button"
          >
            Зимски
          </button>
          <button
            class={`rounded-r-md px-3 py-2 text-sm font-medium transition-colors ${
              props.seasonFilter === 'summer'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSetSeason(
                props.seasonFilter === 'summer' ? null : 'summer',
              );
            }}
            type="button"
          >
            Летен
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 sm:gap-4">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <div class="bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1">
            <span class="text-muted-foreground">Кредити</span>
            <span class="font-bold">{props.totalCredits}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-400">
            <span class="opacity-80">Слушани</span>
            <span class="font-bold">{props.totalCourses.enrolled}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-green-700 dark:text-green-400">
            <span class="opacity-80">Положени</span>
            <span class="font-bold">{props.totalCourses.passed}</span>
          </div>
          <Show when={props.totalCredits >= 180}>
            <span class="text-green-600 text-xs font-medium">
              ≥ 180 — сите предмети се отклучени
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
      ⚠ Надминати се макс. дозволените освоени кредити за{' '}
      {props.levels
        .map(
          (lvl) => `L${String(lvl)} (${String(props.levelLimits[lvl] ?? 0)})`,
        )
        .join(', ')}
      . Кредитите не се избројани.
    </div>
  </Show>
);

type SimulatorTableProps = {
  courses: SimulatorCourse[];
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  onToggleListened: (name: string) => void;
  onTogglePassed: (name: string) => void;
  overLimitSet: Set<string>;
  reasonMap: Record<string, string>;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  statuses: Record<string, CourseStatus>;
};

const SimulatorTable = (props: SimulatorTableProps) => (
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
        <For each={props.courses}>
          {(course) => {
            const enabled = () => props.enabledMap[course.name] ?? true;
            return (
              <Show
                when={
                  (!props.showOnlyEnabled || enabled()) &&
                  (props.seasonFilter === null ||
                    (props.seasonFilter === 'winter'
                      ? course.semester % 2 === 1
                      : course.semester % 2 === 0))
                }
              >
                <CourseRow
                  atLimit={
                    !props.statuses[course.name]?.passed &&
                    !(
                      course.programState?.includes(REQUIRED_MARKER) ?? false
                    ) &&
                    props.fullLevels.has(course.level)
                  }
                  course={course}
                  enabled={enabled()}
                  listened={props.statuses[course.name]?.listened ?? false}
                  onToggleListened={() => {
                    props.onToggleListened(course.name);
                  }}
                  onTogglePassed={() => {
                    props.onTogglePassed(course.name);
                  }}
                  overLimit={props.overLimitSet.has(course.name)}
                  passed={props.statuses[course.name]?.passed ?? false}
                  reason={props.reasonMap[course.name] ?? ''}
                />
              </Show>
            );
          }}
        </For>
      </TableBody>
    </Table>
  </div>
);

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
      const course = buildSimulatorCourse({ acc, info, prog, raw });
      if (course) courses.push(course);
    }

    courses.sort(
      (a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'mk'),
    );
    return courses;
  });

  const parsedCourses = createMemo<SimulatorCourse[]>(() => {
    const list = simulatorCourses();
    const names = list.map((c) => c.name);
    const electives = new Set<string>();
    for (const c of list) {
      if (c.programState && !c.programState.includes(REQUIRED_MARKER)) {
        electives.add(c.name);
      }
    }
    return list.map((c) => {
      const rawPrereqNode = parsePrerequisite(c.prerequisite, names);
      return {
        ...c,
        prereqNode: pruneElectivePrereqs(rawPrereqNode, electives),
        rawPrereqNode,
      };
    });
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
  const [seasonFilter, setSeasonFilter] = createSignal<SeasonFilter>(null);
  const [hpcCompleted, setHpcCompleted] = createSignal(
    localStorage.getItem(STORAGE_KEY_HPC) === 'true',
  );

  const { courseInfoMap, parsedCourses } = useSimulatorCourses(
    () => props.courses,
    accreditation,
    program,
  );

  const totalCourses = createMemo(() => {
    const s = statuses();
    let enrolled = 0;
    let passed = 0;
    for (const c of parsedCourses()) {
      const st = s[c.name];
      if (st?.listened) enrolled++;
      if (st?.passed) passed++;
    }
    return { enrolled, passed };
  });

  createEffect(
    on(hpcCompleted, (v) => {
      localStorage.setItem(STORAGE_KEY_HPC, String(v));
    }),
  );

  const overLimitInfo = createMemo(() =>
    computeOverLimitInfo(parsedCourses(), statuses()),
  );

  const totalCredits = createMemo(() => {
    const s = statuses();
    let sum = 0;
    for (const c of parsedCourses()) {
      if (s[c.name]?.passed) sum += c.credits;
    }
    if (hpcCompleted()) sum += HPC_CREDITS;
    return sum - overLimitInfo().excessCredits;
  });

  const overLimitSet = createMemo(() => overLimitInfo().names);
  const overLimitLevels = createMemo(() => overLimitInfo().levels);
  const fullLevels = createMemo(() => overLimitInfo().fullLevels);

  const electiveCourses = createMemo(() => {
    const set = new Set<string>();
    for (const c of parsedCourses()) {
      if (c.programState && !c.programState.includes(REQUIRED_MARKER)) {
        set.add(c.name);
      }
    }
    return set;
  });

  const enabledMap = createMemo(() =>
    computeEnabledMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      statuses: statuses(),
    }),
  );

  const reasonMap = createMemo(() =>
    computeReasonMap({
      courseInfoMap: courseInfoMap(),
      courses: parsedCourses(),
      electiveCourses: electiveCourses(),
      enabledMap: enabledMap(),
      fullLevels: fullLevels(),
      overLimitSet: overLimitSet(),
      statuses: statuses(),
      totalCredits: totalCredits(),
    }),
  );

  useSimulatorEffects({
    accreditation,
    enabledMap,
    parsedCourses,
    program,
    setStatuses,
    statuses,
  });

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
        onSetSeason={setSeasonFilter}
        onSwitchAccreditation={switchAccreditation}
        onSwitchProgram={setProgram}
        onToggleFilter={() => {
          setShowOnlyEnabled((v) => !v);
        }}
        onToggleHpc={() => {
          setHpcCompleted((v) => !v);
        }}
        program={program()}
        seasonFilter={seasonFilter()}
        showOnlyEnabled={showOnlyEnabled()}
        totalCourses={totalCourses()}
        totalCredits={totalCredits()}
      />

      <CreditLimitWarning
        levelLimits={LEVEL_CREDIT_LIMITS}
        levels={overLimitLevels()}
      />

      <SimulatorTable
        courses={parsedCourses()}
        enabledMap={enabledMap()}
        fullLevels={fullLevels()}
        onToggleListened={toggleListened}
        onTogglePassed={togglePassed}
        overLimitSet={overLimitSet()}
        reasonMap={reasonMap()}
        seasonFilter={seasonFilter()}
        showOnlyEnabled={showOnlyEnabled()}
        statuses={statuses()}
      />
    </div>
  );
};
