"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-orange to-orange-dark text-white shadow-[0_8px_20px_-6px_rgba(244,112,58,0.55)] hover:brightness-105 disabled:opacity-50 disabled:shadow-none",
  secondary: "bg-cream-deep text-charcoal hover:bg-warm-border disabled:text-charcoal-muted",
  danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
  ghost: "bg-transparent text-orange-dark hover:bg-orange-light disabled:text-charcoal-muted",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
