import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const PHYSICAL_BUTTON =
  "shadow-[var(--shadow-button)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[inset_0_1px_0_0_rgb(0_0_0/0.18)] transition-[transform,box-shadow,background-color] duration-75";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium uppercase tracking-wide [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground border border-border hover:bg-primary/90 ${PHYSICAL_BUTTON}`,
        destructive: `bg-destructive text-destructive-foreground border border-border hover:bg-destructive/90 ${PHYSICAL_BUTTON}`,
        outline: `border border-border bg-background hover:bg-accent hover:text-accent-foreground ${PHYSICAL_BUTTON}`,
        secondary: `bg-secondary text-secondary-foreground border border-border hover:bg-secondary/85 ${PHYSICAL_BUTTON}`,
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline normal-case tracking-normal",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 px-6 has-[>svg]:px-4 text-sm",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
