import { createSignal, onMount } from 'solid-js';

const STORAGE_KEY = 'kb-theme';

const getInitialTheme = (): 'dark' | 'light' => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const ThemeToggle = () => {
  const [theme, setTheme] = createSignal<'dark' | 'light'>('light');

  onMount(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset['kbTheme'] = initial;
  });

  const toggle = () => {
    const next = theme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset['kbTheme'] = next;
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      aria-label="Промени тема"
      class="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
      onClick={toggle}
      type="button"
    >
      <svg
        class="hidden h-5 w-5 dark:block"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="4"
        />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        class="block h-5 w-5 dark:hidden"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
};
