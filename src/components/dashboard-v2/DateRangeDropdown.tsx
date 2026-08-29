import { useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangePeriod = "today" | "yesterday" | "thisMonth" | "week" | "last30" | "custom";

export interface DateRangeValue {
  period: DateRangePeriod;
  startDate?: string;
  endDate?: string;
}

const OPTIONS: { value: DateRangePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisMonth", label: "This Month" },
  { value: "week", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function getDateRangeLabel(value: DateRangeValue): string {
  if (value.period === "custom" && value.startDate && value.endDate) {
    return `${value.startDate} → ${value.endDate}`;
  }
  return OPTIONS.find((o) => o.value === value.period)?.label || "Last 7 Days";
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
  const [showCustom, setShowCustom] = useState(value.period === "custom");
  const [customStart, setCustomStart] = useState(value.startDate || "");
  const [customEnd, setCustomEnd] = useState(value.endDate || "");

  const handleSelect = (period: DateRangePeriod) => {
    if (period === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange({ period });
    setOpen(false);
  };

  const handleUpdate = () => {
    if (!customStart || !customEnd) return;
    onChange({ period: "custom", startDate: customStart, endDate: customEnd });
    setOpen(false);
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
          <span className="truncate max-w-[140px]">{getDateRangeLabel(value)}</span>
          <ChevronDown className={cn("h-3.5 w-3.5", isAccent ? "text-[hsl(var(--chart-5))]" : "text-muted-foreground")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn("w-64 p-2", isAccent ? "rounded-[10px]" : "rounded-xl")}>
        <div className="space-y-0.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                isAccent ? "rounded-[10px]" : "rounded-lg",
                value.period === opt.value
                  ? isAccent
                    ? "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] font-medium"
                    : "bg-muted/60 font-medium"
                  : isAccent
                  ? "hover:bg-[hsl(var(--chart-5))]/10 hover:text-[hsl(var(--chart-5))]"
                  : "hover:bg-muted/60"
              )}
            >
              {opt.label}
              {value.period === opt.value && <Check className="h-3.5 w-3.5 text-[hsl(var(--chart-5))]" />}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="w-full h-8 rounded-lg text-xs"
              disabled={!customStart || !customEnd}
              onClick={handleUpdate}
            >
              Update
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
