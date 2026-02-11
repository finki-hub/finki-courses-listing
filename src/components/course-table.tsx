import { createMemo, createSignal, For, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';

type CourseTableProps = {
  courses: CourseRaw[];
};

export const CourseTable = (props: CourseTableProps) => {
  const [selectedCourse, setSelectedCourse] = createSignal<CourseRaw | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');

  const filteredCourses = createMemo(() => {
    const term = search().toLowerCase();
    if (!term) return props.courses;
    return props.courses.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.professors.toLowerCase().includes(term) ||
        (c.assistants?.toLowerCase().includes(term) ?? false),
    );
  });

  const handleRowClick = (course: CourseRaw) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  return (
    <div class="space-y-4">
      <input
        class="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onInput={(e) => setSearch(e.currentTarget.value)}
        placeholder="Пребарувај предмети..."
        type="text"
        value={search()}
      />

      <div class="text-muted-foreground text-sm">
        {filteredCourses().length} предмети
      </div>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[300px]">Предмет</TableHead>
              <TableHead>Акредитација</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              fallback={
                <TableRow>
                  <TableCell
                    class="h-24 text-center"
                    colSpan={2}
                  >
                    Нема резултати.
                  </TableCell>
                </TableRow>
              }
              when={filteredCourses().length > 0}
            >
              <For each={filteredCourses()}>
                {(course) => {
                  const acc2023 = () => getAccreditationInfo(course, '2023');
                  const acc2018 = () => getAccreditationInfo(course, '2018');
                  const accLabel = () => {
                    const labels: string[] = [];
                    if (acc2023()) labels.push('2023');
                    if (acc2018()) labels.push('2018');
                    return labels.join(', ');
                  };

                  return (
                    <TableRow
                      class="cursor-pointer"
                      onClick={() => {
                        handleRowClick(course);
                      }}
                    >
                      <TableCell class="font-medium">{course.name}</TableCell>
                      <TableCell>{accLabel()}</TableCell>
                    </TableRow>
                  );
                }}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>

      <CourseDetailDialog
        course={selectedCourse()}
        onOpenChange={setDialogOpen}
        open={dialogOpen()}
      />
    </div>
  );
};
