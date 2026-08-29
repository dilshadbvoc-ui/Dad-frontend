// Fixed categorical order reusing the app's existing --chart-1..5 design tokens.
// Ordered so the least-separable adjacent pair (blue/purple) never sits next to
// each other — always pair with a visible legend + direct labels, not color alone.
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
];

export const STATUS_COLORS: Record<string, string> = {
  not_started: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--chart-2))",
  completed: "hsl(var(--chart-1))",
  deferred: "hsl(var(--chart-3))",
};
