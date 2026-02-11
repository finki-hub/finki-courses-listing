import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export type TableProps = ComponentProps<'table'>;

export const Table = (props: TableProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div class="relative w-full overflow-x-auto">
      <table
        class={cn('w-full caption-bottom text-sm', props.class)}
        {...rest}
      />
    </div>
  );
};

export type TableHeaderProps = ComponentProps<'thead'>;

export const TableHeader = (props: TableHeaderProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <thead
      class={cn('[&_tr]:border-b', props.class)}
      {...rest}
    />
  );
};

export type TableBodyProps = ComponentProps<'tbody'>;

export const TableBody = (props: TableBodyProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <tbody
      class={cn('[&_tr:last-child]:border-0', props.class)}
      {...rest}
    />
  );
};

export type TableFooterProps = ComponentProps<'tfoot'>;

export const TableFooter = (props: TableFooterProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <tfoot
      class={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        props.class,
      )}
      {...rest}
    />
  );
};

export type TableRowProps = ComponentProps<'tr'>;

export const TableRow = (props: TableRowProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <tr
      class={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        props.class,
      )}
      {...rest}
    />
  );
};

export type TableHeadProps = ComponentProps<'th'>;

export const TableHead = (props: TableHeadProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <th
      class={cn(
        'text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )}
      {...rest}
    />
  );
};

export type TableCellProps = ComponentProps<'td'>;

export const TableCell = (props: TableCellProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <td
      class={cn(
        'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )}
      {...rest}
    />
  );
};

export type TableCaptionProps = ComponentProps<'caption'>;

export const TableCaption = (props: TableCaptionProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <caption
      class={cn('text-muted-foreground mt-4 text-sm', props.class)}
      {...rest}
    />
  );
};
