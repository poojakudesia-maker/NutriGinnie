import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-warm-border bg-surface p-4 shadow-[0_4px_20px_-4px_rgba(43,38,32,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}
