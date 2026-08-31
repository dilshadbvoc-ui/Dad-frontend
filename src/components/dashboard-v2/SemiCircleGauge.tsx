export function SemiCircleGauge({
  percent,
  size = 260,
  ticks = 42,
  tickLength = 30,
  strokeWidth = 6,
  label,
  valueText,
  colorVar = "--chart-5",
}: {
  percent: number;
  size?: number;
  ticks?: number;
  tickLength?: number;
  strokeWidth?: number;
  label?: string;
  valueText?: string;
  colorVar?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const filledTicks = Math.round((pct / 100) * ticks);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - strokeWidth;
  const innerR = outerR - tickLength;
  const viewBoxHeight = size / 2 + strokeWidth;

  const minOpacity = 0.25;

  const marks = Array.from({ length: ticks }, (_, i) => {
    const angleDeg = 180 - (180 * i) / (ticks - 1);
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const filled = i < filledTicks;
    const strength = filledTicks > 1 ? i / (filledTicks - 1) : 1;
    const opacity = minOpacity + (1 - minOpacity) * strength;
    return {
      x1: cx + innerR * cos,
      y1: cy - innerR * sin,
      x2: cx + outerR * cos,
      y2: cy - outerR * sin,
      filled,
      opacity,
    };
  });

  return (
    <div className="relative flex flex-col items-center shrink-0" style={{ width: size, height: viewBoxHeight }}>
      <svg width={size} height={viewBoxHeight} viewBox={`0 0 ${size} ${viewBoxHeight}`}>
        {marks.map((m, i) => (
          <line
            key={i}
            x1={m.x1}
            y1={m.y1}
            x2={m.x2}
            y2={m.y2}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={m.filled ? undefined : "stroke-muted"}
            stroke={m.filled ? `hsl(var(${colorVar}) / ${m.opacity})` : undefined}
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
        <span className="text-4xl sm:text-4xl font-medium font-poppins text-black leading-none">
          {valueText ?? `${Math.round(pct)}%`}
        </span>
        {label && <span className="text-base font-poppins text-black mt-1">{label}</span>}
      </div>
    </div>
  );
}
