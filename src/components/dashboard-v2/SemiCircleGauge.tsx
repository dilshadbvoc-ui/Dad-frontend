const TICK_COUNT = 36;
const START_ANGLE = 180;
const END_ANGLE = 360;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export function SemiCircleGauge({
  percent,
  size = 160,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const cx = size / 2;
  const cy = size / 2 + 4;
  const outerR = size / 2 - 10;
  const tickLength = size * 0.09;
  const activeTicks = Math.round((pct / 100) * TICK_COUNT);

  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
    const angle = START_ANGLE + (i / TICK_COUNT) * (END_ANGLE - START_ANGLE);
    const outer = polarToCartesian(cx, cy, outerR, angle);
    const inner = polarToCartesian(cx, cy, outerR - tickLength, angle);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, active: i <= activeTicks };
  });

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={size * 0.018}
            strokeLinecap="round"
            className={t.active ? "stroke-primary" : "stroke-muted"}
          />
        ))}
      </svg>
      <div
        className="absolute inset-x-0 flex flex-col items-center justify-end"
        style={{ top: size * 0.22, bottom: 0 }}
      >
        <span className="text-2xl font-extrabold text-foreground leading-none">{Math.round(pct)}%</span>
        {label && <span className="text-[11px] text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
}
