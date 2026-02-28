import { createMemo } from 'solid-js';

import { type CourseInfo, parsePrerequisite } from '@/lib/prerequisite';
import {
  type Accreditation,
  buildSimulatorCourse,
  pruneElectivePrereqs,
  REQUIRED_MARKER,
  type SimulatorCourse,
} from '@/lib/simulator';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

export const useSimulatorCourses = (
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

  const electiveCourses = createMemo(() => {
    const set = new Set<string>();
    for (const c of parsedCourses()) {
      if (c.programState && !c.programState.includes(REQUIRED_MARKER)) {
        set.add(c.name);
      }
    }
    return set;
  });

  return { courseInfoMap, electiveCourses, parsedCourses };
};
