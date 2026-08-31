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
  not_started: "hsl(var(--chart-4))",
  in_progress: "hsl(var(--chart-5))",
  completed: "hsl(var(--chart-1))",
  deferred: "hsl(var(--chart-2))",
};

// Fixed per-source color identity (never re-assigned by rank/sort order) —
// color follows the entity, not its position in a given render.
export const LEAD_SOURCE_COLORS: Record<string, string> = {
  import: "hsl(var(--chart-5))",
  manual: "hsl(var(--chart-1))",
  meta_leadgen: "hsl(var(--chart-2))",
  website: "hsl(var(--chart-4))",
  paid_ad: "hsl(var(--chart-2))",
  social: "hsl(var(--chart-5))",
  referral: "hsl(var(--chart-1))",
  whatsapp: "hsl(var(--chart-1))",
  cold_call: "hsl(var(--chart-3))",
  api: "hsl(var(--chart-4))",
  Other: "hsl(var(--muted-foreground))",
};

export const PIPELINE_BUCKET_COLORS: Record<string, string> = {
  expected: "hsl(var(--chart-1))",
  closed_won: "hsl(var(--chart-5))",
  closed_lost: "hsl(var(--chart-2))",
};
