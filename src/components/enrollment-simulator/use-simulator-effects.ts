import { type Accessor, createEffect, on, type Setter } from 'solid-js';

import { type CourseStatus } from '@/lib/prerequisite';
import {
  type Accreditation,
  saveStatuses,
  type SimulatorCourse,
  STORAGE_KEY_ACC,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';

type SimulatorEffectsParams = {
  accreditation: Accessor<Accreditation>;
  enabledMap: Accessor<Record<string, boolean>>;
  parsedCourses: Accessor<SimulatorCourse[]>;
  program: Accessor<string>;
  setStatuses: Setter<Record<string, CourseStatus>>;
  statuses: Accessor<Record<string, CourseStatus>>;
};

export const useSimulatorEffects = (params: SimulatorEffectsParams): void => {
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
