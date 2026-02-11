import { createMemo, createSignal, For, Show } from 'solid-js';

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
  ALL_TAGS,
  type CourseRaw,
  getAccreditationInfo,
  getCourseTags,
  TAG_TRANSLATIONS,
} from '@/types/course';

import { CourseDetailDialog } from './course-detail-dialog';

type CourseTableProps = {
  courses: CourseRaw[];
};
type SortColumn = 'accreditation' | 'name' | 'tags';

type SortDirection = 'asc' | 'desc';

const getAccLabel = (course: CourseRaw): string => {
  const labels: string[] = [];
  if (getAccreditationInfo(course, '2023')) labels.push('2023');
  if (getAccreditationInfo(course, '2018')) labels.push('2018');
  return labels.join(', ');
};

export const CourseTable = (props: CourseTableProps) => {
  const [selectedCourse, setSelectedCourse] = createSignal<CourseRaw | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');
  const [sortColumn, setSortColumn] = createSignal<SortColumn>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [selectedTags, setSelectedTags] = createSignal<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    const current = new Set(selectedTags());
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    setSelectedTags(current);
  };

  const toggleSort = (column: SortColumn) => {
    if (sortColumn() === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (column: SortColumn) =>
    sortColumn() === column ? (sortDirection() === 'asc' ? ' ▲' : ' ▼') : '';

  const filteredCourses = createMemo(() => {
    const term = search().toLowerCase();
    const tags = selectedTags();
    let filtered = term
      ? props.courses.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.professors.toLowerCase().includes(term) ||
            (c.assistants?.toLowerCase().includes(term) ?? false),
        )
      : [...props.courses];

    if (tags.size > 0) {
      filtered = filtered.filter((c) => {
        const courseTags = getCourseTags(c);
        return [...tags].some((t) => courseTags.includes(t));
      });
    }

    const col = sortColumn();
    const dir = sortDirection() === 'asc' ? 1 : -1;

    return filtered.sort((a, b) => {
      let valA: string;
      let valB: string;
      if (col === 'tags') {
        valA = getCourseTags(a).join(',');
        valB = getCourseTags(b).join(',');
      } else {
        valA = col === 'name' ? a.name : getAccLabel(a);
        valB = col === 'name' ? b.name : getAccLabel(b);
      }
      return valA.localeCompare(valB) * dir;
    });
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

      <div class="flex flex-wrap items-center gap-3">
        <span class="text-muted-foreground text-sm">Тагови:</span>
        <For each={ALL_TAGS}>
          {(tag) => (
            <label class="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                checked={selectedTags().has(tag)}
                class="accent-primary h-4 w-4 rounded"
                onChange={() => {
                  toggleTag(tag);
                }}
                type="checkbox"
              />
              {TAG_TRANSLATIONS[tag] ?? tag}
            </label>
          )}
        </For>
      </div>

      <div class="text-muted-foreground text-sm">
        {filteredCourses().length} предмети
      </div>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                class="w-[300px] cursor-pointer select-none"
                onClick={() => {
                  toggleSort('name');
                }}
              >
                Предмет{sortIndicator('name')}
              </TableHead>
              <TableHead
                class="cursor-pointer select-none"
                onClick={() => {
                  toggleSort('accreditation');
                }}
              >
                Акредитација{sortIndicator('accreditation')}
              </TableHead>
              <TableHead
                class="cursor-pointer select-none"
                onClick={() => {
                  toggleSort('tags');
                }}
              >
                Тагови{sortIndicator('tags')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              fallback={
                <TableRow>
                  <TableCell
                    class="h-24 text-center"
                    colSpan={3}
                  >
                    Нема резултати.
                  </TableCell>
                </TableRow>
              }
              when={filteredCourses().length > 0}
            >
              <For each={filteredCourses()}>
                {(course) => (
                  <TableRow
                    class="cursor-pointer"
                    onClick={() => {
                      handleRowClick(course);
                    }}
                  >
                    <TableCell class="font-medium">{course.name}</TableCell>
                    <TableCell>{getAccLabel(course)}</TableCell>
                    <TableCell>
                      <div class="flex flex-wrap gap-1">
                        <For each={getCourseTags(course)}>
                          {(tag) => (
                            <Badge variant="secondary">
                              {TAG_TRANSLATIONS[tag] ?? tag}
                            </Badge>
                          )}
                        </For>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
