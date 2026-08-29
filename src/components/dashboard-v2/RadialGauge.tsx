export function RadialGauge({
  percent,
  size = 160,
  strokeWidth = 14,
  label,
  valueText,
  color = "hsl(var(--primary))",
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueText?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground leading-none">
          {valueText ?? `${Math.round(pct)}%`}
        </span>
        {label && <span className="text-[11px] text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
}
