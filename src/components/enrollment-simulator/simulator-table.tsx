import { For, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type CourseStatus } from '@/lib/prerequisite';
import {
  REQUIRED_MARKER,
  type SeasonFilter,
  type SimulatorCourse,
} from '@/lib/simulator';

import { CourseRow } from './course-row';

type SimulatorTableProps = {
  courses: SimulatorCourse[];
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  onToggleListened: (name: string) => void;
  onTogglePassed: (name: string) => void;
  overLimitSet: Set<string>;
  reasonMap: Record<string, string>;
  ref?: (el: HTMLDivElement) => void;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  statuses: Record<string, CourseStatus>;
};

export const SimulatorTable = (props: SimulatorTableProps) => (
  <div
    class="rounded-md border"
    ref={props.ref}
  >
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
