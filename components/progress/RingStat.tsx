const SIZE = 96;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Reused for both the adherence gauge and the calorie-consistency ring — a simple static SVG
 *  circular progress meter, no charting library needed for a single value out of 100. */
export function RingStat({ pct, label, sublabel, color = "var(--color-orange)" }: { pct: number; label: string; sublabel?: string; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-cream-deep, #f2e6d8)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
          className="fill-charcoal text-lg font-bold"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <p className="text-xs font-medium text-charcoal">{label}</p>
      {sublabel && <p className="text-[11px] text-charcoal-muted">{sublabel}</p>}
    </div>
  );
}
