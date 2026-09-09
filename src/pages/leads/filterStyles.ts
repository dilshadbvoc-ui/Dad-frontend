// Shared card-style look for lead-list filter bars (icon + label-above-value), matching
// the app's rounded-[10px] / brand-green convention. Used by both the main Leads page
// and the dedicated Unattended/No Activity lead-list pages.
export const FILTER_CARD_CLASS = "flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 py-2";
export const FILTER_ICON_CLASS = "h-4 w-4 text-[hsl(var(--chart-5))] shrink-0";
export const FILTER_LABEL_CLASS = "block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 leading-none mb-1";
export const FILTER_TRIGGER_CLASS = "h-auto w-full p-0 border-0 shadow-none bg-transparent focus:ring-0 focus:ring-offset-0 gap-1 font-bold text-sm justify-between [&>span]:line-clamp-1 [&>span]:text-left";
