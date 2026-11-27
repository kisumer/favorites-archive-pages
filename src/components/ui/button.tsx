import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold cursor-pointer select-none transition-[background-color,color,transform,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-[var(--ink-black)] text-white hover:bg-[#2a2a2a]",
        pop: "bg-[var(--yellow-main)] text-[var(--ink-black)] border-none shadow-none pressable hover:brightness-95",
        popPink: "bg-[var(--yellow-soft)] text-[var(--ink-black)] border-none shadow-none pressable hover:brightness-95",
        popInk: "bg-[var(--ink-black)] text-white border-none shadow-none pressable hover:bg-[#2a2a2a]",
        paper: "bg-[var(--bg-card)] text-[var(--ink-black)] border border-[var(--border-soft)] shadow-[0_2px_8px_rgba(0,0,0,0.03)] pressable hover:bg-[var(--bg-input)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--ink-black)] hover:bg-[var(--bg-input)]",
        secondary: "bg-[var(--yellow-soft)] text-[var(--ink-black)] hover:brightness-95",
        ghost: "text-[var(--ink-black)] hover:bg-[var(--bg-input)]",
        ghostDanger: "text-destructive hover:bg-destructive/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
        iconSm: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
