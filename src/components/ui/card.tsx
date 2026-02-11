import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export type CardProps = ComponentProps<'div'>;

export const Card = (props: CardProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'bg-card text-card-foreground rounded-xl border shadow',
        props.class,
      )}
      {...rest}
    />
  );
};

export type CardHeaderProps = ComponentProps<'div'>;

export const CardHeader = (props: CardHeaderProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('flex flex-col gap-1.5 p-6', props.class)}
      {...rest}
    />
  );
};

export type CardTitleProps = ComponentProps<'h3'>;

export const CardTitle = (props: CardTitleProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <h3
      class={cn('leading-none font-semibold tracking-tight', props.class)}
      {...rest}
    />
  );
};

export type CardDescriptionProps = ComponentProps<'p'>;

export const CardDescription = (props: CardDescriptionProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <p
      class={cn('text-muted-foreground text-sm', props.class)}
      {...rest}
    />
  );
};

export type CardContentProps = ComponentProps<'div'>;

export const CardContent = (props: CardContentProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('p-6 pt-0', props.class)}
      {...rest}
    />
  );
};

export type CardFooterProps = ComponentProps<'div'>;

export const CardFooter = (props: CardFooterProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('flex items-center p-6 pt-0', props.class)}
      {...rest}
    />
  );
};
