import { createSignal, Match, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCourses } from '@/data/use-courses';

type Page = 'listing' | 'simulator';

const App = () => {
  const [courses] = useCourses();
  const [page, setPage] = createSignal<Page>('listing');

  return (
    <div class="container mx-auto py-8">
      <div class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">ФИНКИ ПРЕДМЕТИ</h1>
          <p class="text-muted-foreground mt-1">
            Преглед на сите предмети, смерови и акредитации
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a
            class="text-muted-foreground hover:text-foreground inline-flex items-center rounded-md p-2 transition-colors"
            href="https://github.com/finki-hub/finki-courses-listing"
            rel="noopener noreferrer"
            target="_blank"
            title="GitHub"
          >
            <svg
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      <nav class="mb-6 flex gap-1 border-b">
        <button
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            page() === 'listing'
              ? 'border-primary text-primary -mb-px border-b-2'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setPage('listing')}
          type="button"
        >
          Предмети
        </button>
        <button
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            page() === 'simulator'
              ? 'border-primary text-primary -mb-px border-b-2'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setPage('simulator')}
          type="button"
        >
          Запишување
        </button>
      </nav>

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
          {(data) => (
            <Switch>
              <Match when={page() === 'listing'}>
                <CourseTable courses={data()} />
              </Match>
              <Match when={page() === 'simulator'}>
                <EnrollmentSimulator courses={data()} />
              </Match>
            </Switch>
          )}
        </Match>
      </Switch>
    </div>
  );
};

export default App;
