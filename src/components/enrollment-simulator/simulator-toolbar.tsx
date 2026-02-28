import { For } from 'solid-js';

import {
  type Accreditation,
  HPC_CREDITS,
  type SeasonFilter,
} from '@/lib/simulator';
import {
  STUDY_PROGRAM_LABELS,
  STUDY_PROGRAMS_2018,
  STUDY_PROGRAMS_2023,
} from '@/types/course';

import { ScreenshotButton } from './screenshot-button';

type SimulatorToolbarProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  onReset: () => void;
  onScreenshot: () => Promise<boolean>;
  onSetSeason: (s: SeasonFilter) => void;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onSwitchProgram: (p: string) => void;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
};

export const SimulatorToolbar = (props: SimulatorToolbarProps) => {
  const programs = () =>
    props.accreditation === '2023' ? STUDY_PROGRAMS_2023 : STUDY_PROGRAMS_2018;

  return (
    <div class="space-y-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div
          class="inline-flex rounded-md border"
          role="group"
        >
          <button
            class={`rounded-l-md px-4 py-2 text-sm font-medium transition-colors ${
              props.accreditation === '2023'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSwitchAccreditation('2023');
            }}
            type="button"
          >
            Акредитација 2023
          </button>
          <button
            class={`rounded-r-md px-4 py-2 text-sm font-medium transition-colors ${
              props.accreditation === '2018'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSwitchAccreditation('2018');
            }}
            type="button"
          >
            Акредитација 2018
          </button>
        </div>

        <div class="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <div
            class="inline-flex rounded-md border"
            role="group"
          >
            <For each={[...programs()]}>
              {(p, i) => (
                <button
                  class={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                    i() === 0 ? 'rounded-l-md' : ''
                  } ${i() === programs().length - 1 ? 'rounded-r-md' : ''} ${
                    props.program === p
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    props.onSwitchProgram(p);
                  }}
                  type="button"
                >
                  {STUDY_PROGRAM_LABELS[p] ?? p}
                </button>
              )}
            </For>
          </div>
        </div>

        <div
          class="inline-flex rounded-md border"
          role="group"
        >
          <button
            class={`rounded-l-md px-3 py-2 text-sm font-medium transition-colors ${
              props.seasonFilter === 'winter'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSetSeason(
                props.seasonFilter === 'winter' ? null : 'winter',
              );
            }}
            type="button"
          >
            Зимски
          </button>
          <button
            class={`rounded-r-md px-3 py-2 text-sm font-medium transition-colors ${
              props.seasonFilter === 'summer'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              props.onSetSeason(
                props.seasonFilter === 'summer' ? null : 'summer',
              );
            }}
            type="button"
          >
            Летен
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 sm:gap-4">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <div class="bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1">
            <span class="text-muted-foreground">Кредити</span>
            <span class="font-bold">{props.totalCredits}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-400">
            <span class="opacity-80">Слушани</span>
            <span class="font-bold">{props.totalCourses.enrolled}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-green-700 dark:text-green-400">
            <span class="opacity-80">Положени</span>
            <span class="font-bold">{props.totalCourses.passed}</span>
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            checked={props.hpcCompleted}
            class="accent-primary h-4 w-4"
            onChange={() => {
              props.onToggleHpc();
            }}
            type="checkbox"
          />
          HPC (+{HPC_CREDITS} кредити)
        </label>

        <div class="sm:ml-auto" />

        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            checked={props.showOnlyEnabled}
            class="accent-primary h-4 w-4"
            onChange={() => {
              props.onToggleFilter();
            }}
            type="checkbox"
          />
          Само достапни
        </label>

        <button
          class="text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
          onClick={() => {
            props.onReset();
          }}
          type="button"
        >
          Ресетирај
        </button>

        <ScreenshotButton onCapture={props.onScreenshot} />
      </div>
    </div>
  );
};
