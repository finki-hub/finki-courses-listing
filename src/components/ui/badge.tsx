import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
    },
  },
);

export type BadgeProps = ComponentProps<'div'> &
  VariantProps<typeof badgeVariants>;

export const Badge = (props: BadgeProps) => {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  return (
    <div
      class={cn(badgeVariants({ variant: local.variant }), local.class)}
      {...rest}
    />
  );
};
