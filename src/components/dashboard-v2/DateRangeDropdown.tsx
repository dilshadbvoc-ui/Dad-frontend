import { useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CustomDateRangeCalendar } from "./CustomDateRangeCalendar";

export type DateRangePeriod = "today" | "yesterday" | "thisMonth" | "week" | "last30" | "custom";

export interface DateRangeValue {
  period: DateRangePeriod;
  startDate?: string;
  endDate?: string;
  /** Display-only override, e.g. "Last Month" for a preset internally sent as period:"custom" */
  label?: string;
}

const toDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type PresetKey = "today" | "yesterday" | "week" | "thisMonth" | "lastMonth" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "7 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom Range" },
];

/** The dashboard's default filter: the current calendar month up to today. */
export function getDefaultDateRange(): DateRangeValue {
  return resolvePreset("thisMonth")!;
}

function resolvePreset(key: PresetKey): DateRangeValue | null {
  const now = new Date();

  switch (key) {
    case "today":
      return { period: "today", startDate: toDateStr(now), endDate: toDateStr(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { period: "yesterday", startDate: toDateStr(y), endDate: toDateStr(y) };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { period: "week", startDate: toDateStr(start), endDate: toDateStr(now) };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { period: "thisMonth", startDate: toDateStr(start), endDate: toDateStr(now) };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { period: "custom", startDate: toDateStr(start), endDate: toDateStr(end), label: "Last Month" };
    }
    case "custom":
      return null;
  }
}

export function getDateRangeLabel(value: DateRangeValue): string {
  if (value.label) return value.label;
  const preset = PRESETS.find((p) => {
    const resolved = resolvePreset(p.key);
    return resolved && resolved.period === value.period && p.key !== "custom";
  });
  if (preset) return preset.label;
  if (value.period === "custom" && value.startDate && value.endDate) {
    return `${value.startDate} → ${value.endDate}`;
  }
  return "7 Days";
}

export function DateRangeDropdown({
  value,
  onChange,
  variant = "default",
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  variant?: "default" | "accent";
}) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.period === "custom" && !value.label);

  const handleSelect = (key: PresetKey) => {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const resolved = resolvePreset(key);
    if (resolved) onChange(resolved);
    setOpen(false);
  };

  const handleCustomUpdate = (start: string, end: string) => {
    onChange({ period: "custom", startDate: start, endDate: end });
    setShowCustom(false);
    setOpen(false);
  };

  const isSelected = (key: PresetKey) => {
    if (key === "custom") return value.period === "custom" && !value.label;
    if (key === "lastMonth") return value.label === "Last Month";
    const resolved = resolvePreset(key);
    return !!resolved && resolved.period === value.period && !value.label;
  };

  const isAccent = variant === "accent";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium",
            isAccent
              ? "border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10 hover:text-[hsl(var(--chart-5))] focus:outline-none focus:ring-0 focus:ring-offset-0"
              : "rounded-xl border-input bg-background"
          )}
        >
          <Calendar className={cn("h-3.5 w-3.5", isAccent ? "text-[hsl(var(--chart-5))]" : "text-muted-foreground")} />
          <span className="truncate max-w-[160px]">{getDateRangeLabel(value)}</span>
          <ChevronDown className={cn("h-3.5 w-3.5", isAccent ? "text-[hsl(var(--chart-5))]" : "text-muted-foreground")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(showCustom ? "w-auto p-3" : "w-64 p-2", isAccent ? "rounded-[10px]" : "rounded-xl")}
      >
        <div className="space-y-0.5">
          {PRESETS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                isAccent ? "rounded-[10px]" : "rounded-lg",
                isSelected(opt.key)
                  ? isAccent
                    ? "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] font-medium"
                    : "bg-muted/60 font-medium"
                  : isAccent
                  ? "hover:bg-[hsl(var(--chart-5))]/10 hover:text-[hsl(var(--chart-5))]"
                  : "hover:bg-muted/60"
              )}
            >
              {opt.label}
              {isSelected(opt.key) && <Check className="h-3.5 w-3.5 text-[hsl(var(--chart-5))]" />}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="mt-2 pt-2 border-t border-border">
            <CustomDateRangeCalendar
              startDate={value.period === "custom" ? value.startDate : undefined}
              endDate={value.period === "custom" ? value.endDate : undefined}
              onUpdate={handleCustomUpdate}
              onCancel={() => setShowCustom(false)}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
