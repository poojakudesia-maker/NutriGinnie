import type { WeightLog } from "@prisma/client";

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 10;

export function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) {
    return <p className="text-xs text-charcoal-muted">Log a couple of weigh-ins to see your trend here.</p>;
  }

  const weights = logs.map((l) => l.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = logs.map((log, i) => {
    const x = PADDING + (i / (logs.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((log.weightKg - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const first = logs[0];
  const last = logs[logs.length - 1];
  const delta = last.weightKg - first.weightKg;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Weight trend chart">
        <path d={path} fill="none" stroke="var(--color-orange, #f4703a)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--color-orange, #f4703a)" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-charcoal-muted">
        <span>{first.weightKg}kg</span>
        <span className={delta <= 0 ? "font-medium text-sage" : "font-medium text-orange-dark"}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}kg since first log
        </span>
        <span>{last.weightKg}kg</span>
      </div>
    </div>
  );
}
