import { Dialog as DialogPrimitive } from '@kobalte/core/dialog';
import {
  type ComponentProps,
  mergeProps,
  Show,
  splitProps,
  type ValidComponent,
} from 'solid-js';

import { cn } from '@/lib/utils';

export const DialogPortal = DialogPrimitive.Portal;

export type DialogProps = ComponentProps<typeof DialogPrimitive>;

export const Dialog = (props: DialogProps) => <DialogPrimitive {...props} />;

export type DialogTriggerProps<T extends ValidComponent = 'button'> =
  ComponentProps<typeof DialogPrimitive.Trigger<T>>;

export const DialogTrigger = <T extends ValidComponent = 'button'>(
  props: DialogTriggerProps<T>,
) => <DialogPrimitive.Trigger {...props} />;

export type DialogCloseButtonProps<T extends ValidComponent = 'button'> =
  ComponentProps<typeof DialogPrimitive.CloseButton<T>>;

export const DialogCloseButton = <T extends ValidComponent = 'button'>(
  props: DialogCloseButtonProps<T>,
) => <DialogPrimitive.CloseButton {...props} />;

export type DialogContentProps<T extends ValidComponent = 'div'> =
  ComponentProps<typeof DialogPrimitive.Content<T>> & {
    showCloseButton?: boolean;
  };

export const DialogContent = <T extends ValidComponent = 'div'>(
  props: DialogContentProps<T>,
) => {
  const merge = mergeProps(
    {
      showCloseButton: true,
    } as DialogContentProps,
    props,
  );
  const [, rest] = splitProps(merge, ['class', 'children', 'showCloseButton']);

  return (
    <>
      <DialogPrimitive.Overlay class="data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        class={cn(
          'bg-background data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          merge.class,
        )}
        {...rest}
      >
        {merge.children}
        <Show when={merge.showCloseButton}>
          <DialogPrimitive.CloseButton
            aria-label="Close"
            class="focus-visible:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-[opacity,box-shadow] duration-200 hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </DialogPrimitive.CloseButton>
        </Show>
      </DialogPrimitive.Content>
    </>
  );
};

export type DialogHeaderProps = ComponentProps<'div'>;

export const DialogHeader = (props: DialogHeaderProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('flex flex-col gap-2 text-center sm:text-left', props.class)}
      {...rest}
    />
  );
};

export type DialogFooterProps = ComponentProps<'div'>;

export const DialogFooter = (props: DialogFooterProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        props.class,
      )}
      {...rest}
    />
  );
};

export type DialogTitleProps<T extends ValidComponent = 'h2'> = ComponentProps<
  typeof DialogPrimitive.Title<T>
>;

export const DialogTitle = <T extends ValidComponent = 'h2'>(
  props: DialogTitleProps<T>,
) => {
  const [local, rest] = splitProps(props as DialogTitleProps, ['class']);

  return (
    <DialogPrimitive.Title
      class={cn('text-lg leading-none font-semibold', local.class)}
      {...rest}
    />
  );
};

export type DialogDescriptionProps<T extends ValidComponent = 'p'> =
  ComponentProps<typeof DialogPrimitive.Description<T>>;

export const DialogDescription = <T extends ValidComponent = 'p'>(
  props: DialogDescriptionProps<T>,
) => {
  const [local, rest] = splitProps(props as DialogDescriptionProps, ['class']);

  return (
    <DialogPrimitive.Description
      class={cn('text-muted-foreground text-sm', local.class)}
      {...rest}
    />
  );
};
