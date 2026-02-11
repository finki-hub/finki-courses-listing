import { For, type Setter, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ACADEMIC_YEARS,
  type AccreditationInfo,
  type CourseRaw,
  getAccreditationInfo,
  getEnrollmentForYear,
} from '@/types/course';

const AccreditationCard = (props: {
  info: AccreditationInfo;
  year: '2018' | '2023';
}) => (
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-base">Акредитација {props.year}</CardTitle>
    </CardHeader>
    <CardContent>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Show when={props.info.code}>
          <dt class="text-muted-foreground">Код</dt>
          <dd class="font-mono text-xs">{props.info.code}</dd>
        </Show>
        <Show when={props.info.name}>
          <dt class="text-muted-foreground">Име</dt>
          <dd>{props.info.name}</dd>
        </Show>
        <Show when={props.info.level}>
          <dt class="text-muted-foreground">Ниво</dt>
          <dd>{props.info.level}</dd>
        </Show>
        <Show when={props.info.semester}>
          <dt class="text-muted-foreground">Семестар</dt>
          <dd>{props.info.semester}</dd>
        </Show>
        <Show when={props.info.channel}>
          <dt class="text-muted-foreground">Канал</dt>
          <dd>{props.info.channel}</dd>
        </Show>
        <Show when={props.info.prerequisite}>
          <dt class="text-muted-foreground col-span-2">Предуслов</dt>
          <dd class="col-span-2 text-xs">{props.info.prerequisite}</dd>
        </Show>
      </dl>
    </CardContent>
  </Card>
);

type CourseDetailDialogProps = {
  course: CourseRaw | null;
  onOpenChange: Setter<boolean>;
  open: boolean;
};

export const CourseDetailDialog = (props: CourseDetailDialogProps) => (
  <Dialog
    onOpenChange={props.onOpenChange}
    open={props.open}
  >
    <DialogPortal>
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <Show when={props.course}>
          {(course) => {
            const acc2023 = () => getAccreditationInfo(course(), '2023');
            const acc2018 = () => getAccreditationInfo(course(), '2018');

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{course().name}</DialogTitle>
                  <DialogDescription>
                    Детални информации за предметот
                  </DialogDescription>
                </DialogHeader>

                <div class="space-y-4">
                  {/* Professors & Assistants */}
                  <div class="flex flex-wrap gap-4">
                    <div class="flex-1">
                      <h4 class="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                        Професори
                      </h4>
                      <div class="flex flex-wrap gap-1">
                        <For
                          each={course().professors.split('\n').filter(Boolean)}
                        >
                          {(prof) => <Badge variant="secondary">{prof}</Badge>}
                        </For>
                      </div>
                    </div>
                    <Show when={course().assistants}>
                      <div class="flex-1">
                        <h4 class="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                          Асистенти
                        </h4>
                        <div class="flex flex-wrap gap-1">
                          <For
                            each={course()
                              .assistants?.split('\n')
                              .filter(Boolean)}
                          >
                            {(asst) => <Badge variant="outline">{asst}</Badge>}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>

                  {/* Accreditation info */}
                  <div class="grid gap-4 sm:grid-cols-2">
                    <Show when={acc2023()}>
                      {(info) => (
                        <AccreditationCard
                          info={info()}
                          year="2023"
                        />
                      )}
                    </Show>
                    <Show when={acc2018()}>
                      {(info) => (
                        <AccreditationCard
                          info={info()}
                          year="2018"
                        />
                      )}
                    </Show>
                  </div>

                  {/* Enrollment history */}
                  <div>
                    <h4 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                      Историја на запишување
                    </h4>
                    <div class="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Академска година</TableHead>
                            <TableHead class="text-right">Запишани</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <For each={ACADEMIC_YEARS}>
                            {(year) => {
                              const enrollment = () =>
                                getEnrollmentForYear(course(), year);
                              return (
                                <TableRow>
                                  <TableCell>{year}</TableCell>
                                  <TableCell class="text-right">
                                    <Show
                                      fallback={
                                        <span class="text-muted-foreground">
                                          —
                                        </span>
                                      }
                                      when={enrollment() > 0}
                                    >
                                      <span
                                        class={
                                          enrollment() >= 200
                                            ? 'font-semibold text-orange-600'
                                            : ''
                                        }
                                      >
                                        {enrollment()}
                                      </span>
                                    </Show>
                                  </TableCell>
                                </TableRow>
                              );
                            }}
                          </For>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </Show>
      </DialogContent>
    </DialogPortal>
  </Dialog>
);
