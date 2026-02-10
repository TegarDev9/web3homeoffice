import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent/30 text-accent",
        secondary: "border-border bg-panel text-text",
        success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
        warn: "border-amber-400/40 bg-amber-500/10 text-amber-300",
        danger: "border-rose-400/40 bg-rose-500/10 text-rose-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


