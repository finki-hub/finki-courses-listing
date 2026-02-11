import { Match, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { useCourses } from '@/data/use-courses';

const App = () => {
  const [courses] = useCourses();

  return (
    <div class="container mx-auto py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight">
          ФИНКИ — Преглед на предмети
        </h1>
        <p class="text-muted-foreground mt-1">
          Преглед на сите предмети, запишувања и акредитации
        </p>
      </div>

      <Switch>
        <Match when={courses.loading}>
          <div class="flex items-center justify-center py-12">
            <div class="text-muted-foreground text-sm">Се вчитува...</div>
          </div>
        </Match>
        <Match when={courses.error !== undefined}>
          <div class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Грешка при вчитување: {String(courses.error)}
          </div>
        </Match>
        <Match when={courses()}>
          {(data) => <CourseTable courses={data()} />}
        </Match>
      </Switch>
    </div>
  );
};

export default App;
