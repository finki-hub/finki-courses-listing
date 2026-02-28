import { type Accessor, createMemo } from 'solid-js';

import { type CourseInfo, type CourseStatus } from '@/lib/prerequisite';
import {
  computeEnabledMap,
  computeOverLimitInfo,
  computeReasonMap,
  HPC_CREDITS,
  REQUIRED_MARKER,
  type SimulatorCourse,
} from '@/lib/simulator';

type UseSimulatorStateParams = {
  courseInfoMap: Accessor<Map<string, CourseInfo>>;
  electiveCourses: Accessor<Set<string>>;
  hpcCompleted: Accessor<boolean>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  statuses: Accessor<Record<string, CourseStatus>>;
};

export const useSimulatorState = (params: UseSimulatorStateParams) => {
  const {
    courseInfoMap,
    electiveCourses,
    hpcCompleted,
    parsedCourses,
    statuses,
  } = params;

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

  const graduationInfo = createMemo(() => {
    const s = statuses();
    const missing3yr: string[] = [];
    const missing4yr: string[] = [];
    const FOUR_YEAR_MARKER = '(4 г.)';
    for (const c of parsedCourses()) {
      const state = c.programState;
      const isRequired = state?.includes(REQUIRED_MARKER) ?? false;
      if (!isRequired) continue;
      if (s[c.name]?.passed) continue;
      const isFourYearOnly = state?.includes(FOUR_YEAR_MARKER) ?? false;
      if (!isFourYearOnly) {
        missing3yr.push(c.name);
      }
      missing4yr.push(c.name);
    }
    return { missing3yr, missing4yr };
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

  return {
    enabledMap,
    fullLevels,
    graduationInfo,
    overLimitLevels,
    overLimitSet,
    reasonMap,
    totalCourses,
    totalCredits,
  };
};
