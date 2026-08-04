import { Card } from "@/components/ui/Card";

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-charcoal-muted">{label}</span>
      <span className="text-xl font-bold text-charcoal">{value}</span>
      {sub && <span className="text-xs text-charcoal-muted">{sub}</span>}
    </Card>
  );
}
