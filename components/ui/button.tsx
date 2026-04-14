import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--accent-strong)] px-5 py-3 text-white shadow-[0_18px_36px_rgba(181,149,197,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(181,149,197,0.32)]",
        soft:
          "bg-[color:var(--accent-soft)] px-5 py-3 text-slate-900 hover:bg-[color:var(--surface-muted)]",
        outline:
          "border border-[color:var(--border-strong)] bg-white px-5 py-3 text-slate-700 hover:border-[color:var(--accent)] hover:text-slate-900",
        ghost:
          "px-4 py-3 text-slate-600 hover:bg-[color:var(--surface-muted)] hover:text-slate-900",
        destructive:
          "bg-[#b04c65] px-5 py-3 text-white shadow-[0_18px_36px_rgba(176,76,101,0.2)] hover:bg-[#9d4259]",
      },
      size: {
        default: "",
        sm: "px-4 py-2.5 text-xs",
        lg: "px-6 py-3.5 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
