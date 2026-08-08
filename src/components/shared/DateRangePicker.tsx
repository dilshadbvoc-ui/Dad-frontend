import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  isAfter,
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onUpdate: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onUpdate }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Default left calendar month view to startDate or current date
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    if (startDate) {
      return startOfMonth(new Date(startDate));
    }
    return startOfMonth(new Date());
  });

  const rightMonth = addMonths(leftMonth, 1);

  // Sync state when props change or popover opens
  useEffect(() => {
    if (open) {
      setSelectedStart(startDate ? new Date(startDate) : null);
      setSelectedEnd(endDate ? new Date(endDate) : null);
      if (startDate) {
        setLeftMonth(startOfMonth(new Date(startDate)));
      }
    }
  }, [open, startDate, endDate]);

  const presets = [
    { label: "Today", getValue: () => { const t = new Date(); return { start: t, end: t }; } },
    { label: "Yesterday", getValue: () => { const t = new Date(); const y = subDays(t, 1); return { start: y, end: y }; } },
    { label: "Today and yesterday", getValue: () => { const t = new Date(); const y = subDays(t, 1); return { start: y, end: t }; } },
    { label: "Last 7 days", getValue: () => { const t = new Date(); return { start: subDays(t, 6), end: t }; } },
    { label: "Last 14 days", getValue: () => { const t = new Date(); return { start: subDays(t, 13), end: t }; } },
    { label: "Last 28 days", getValue: () => { const t = new Date(); return { start: subDays(t, 27), end: t }; } },
    { label: "Last 30 days", getValue: () => { const t = new Date(); return { start: subDays(t, 29), end: t }; } },
    { label: "This week", getValue: () => { const t = new Date(); return { start: startOfWeek(t), end: t }; } },
    { label: "Last week", getValue: () => { const t = new Date(); const prevWeek = subDays(t, 7); return { start: startOfWeek(prevWeek), end: endOfWeek(prevWeek) }; } },
    { label: "This month", getValue: () => { const t = new Date(); return { start: startOfMonth(t), end: t }; } },
    { label: "Last month", getValue: () => { const t = new Date(); const prevMonth = subMonths(t, 1); return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) }; } },
    { label: "Maximum", getValue: () => { const t = new Date(); return { start: new Date(2020, 0, 1), end: t }; } },
    { label: "Custom", getValue: () => null },
  ];

  const [activePreset, setActivePreset] = useState<string>("Last 30 days");

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    setActivePreset(preset.label);
    const val = preset.getValue();
    if (val) {
      setSelectedStart(val.start);
      setSelectedEnd(val.end);
      setLeftMonth(startOfMonth(val.start));
    } else {
      // Custom
      setSelectedStart(null);
      setSelectedEnd(null);
    }
  };

  const handleDayClick = (day: Date) => {
    setActivePreset("Custom");
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(day);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      if (isBefore(day, selectedStart)) {
        setSelectedStart(day);
        setSelectedEnd(null);
      } else {
        setSelectedEnd(day);
      }
    }
  };

  const handleUpdate = () => {
    if (selectedStart && selectedEnd) {
      onUpdate(format(selectedStart, "yyyy-MM-dd"), format(selectedEnd, "yyyy-MM-dd"));
      setOpen(false);
    } else if (selectedStart) {
      onUpdate(format(selectedStart, "yyyy-MM-dd"), format(selectedStart, "yyyy-MM-dd"));
      setOpen(false);
    } else {
      // Reset filters
      onUpdate("", "");
      setOpen(false);
    }
  };

  const renderCalendar = (monthDate: Date) => {
    const startDay = startOfWeek(startOfMonth(monthDate));
    const endDay = endOfWeek(endOfMonth(monthDate));
    const days = eachDayOfInterval({ start: startDay, end: endDay });

    const monthYearStr = format(monthDate, "MMMM yyyy");
    const [monthName, yearStr] = monthYearStr.split(" ");

    return (
      <div className="flex-1 px-4">
        <div className="text-center font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-1">
          <span className="capitalize">{monthName}</span>
          <span>{yearStr}</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-semibold text-gray-400 py-1">{d}</div>
          ))}
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === monthDate.getMonth();
            const isSelectedStart = selectedStart && isSameDay(day, selectedStart);
            const isSelectedEnd = selectedEnd && isSameDay(day, selectedEnd);

            let isInRange = false;
            if (selectedStart && selectedEnd) {
              isInRange = isAfter(day, selectedStart) && isBefore(day, selectedEnd);
            } else if (selectedStart && hoverDate) {
              isInRange = isAfter(day, selectedStart) && isBefore(day, hoverDate);
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={!isCurrentMonth}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => !selectedEnd && setHoverDate(day)}
                className={`
                                    h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all relative
                                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-700 cursor-default opacity-0" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}
                                    ${isSelectedStart ? "!bg-primary !text-white z-10 shadow-md font-boldScale" : ""}
                                    ${isSelectedEnd ? "!bg-primary !text-white z-10 shadow-md font-boldScale" : ""}
                                    ${isInRange && isCurrentMonth ? "bg-primary/10 !text-primary rounded-none w-full" : ""}
                                `}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-10 justify-start text-left font-normal bg-background border-border/50 rounded-full shadow-sm hover:bg-muted/50 transition-colors ${open ? "border-primary ring-2 ring-primary/20" : ""} ${startDate || endDate ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground"}`}
        >
          <Calendar className="mr-2 h-4 w-4 text-primary" />
          {startDate ? (
            endDate ? (
              <span className="truncate text-xs font-medium">
                {format(new Date(startDate), "MMM d, yyyy")} - {format(new Date(endDate), "MMM d, yyyy")}
              </span>
            ) : (
              <span className="truncate text-xs font-medium">From {format(new Date(startDate), "MMM d, yyyy")}</span>
            )
          ) : (
            <span className="text-xs">Filter by Date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[94vw] max-w-[360px] md:w-[880px] md:max-w-none p-0 rounded-2xl shadow-2xl border border-border/40 overflow-hidden bg-white dark:bg-gray-950" align="start">
        <div className="flex flex-col md:flex-row h-auto md:h-[520px]">
          {/* Left presets panel */}
          <div className="w-full md:w-[200px] border-b md:border-b-0 md:border-r border-border/40 bg-gray-50/50 dark:bg-gray-900/30 p-2 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col gap-1.5 shrink-0 whitespace-nowrap scrollbar-none">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetClick(p)}
                className={`
                                    text-left px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0
                                    ${activePreset === p.label
                                      ? "bg-primary/10 text-primary font-bold"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/40"}
                                `}
              >
                <div className={`h-3.5 w-3.5 md:h-4 md:w-4 rounded-full border flex items-center justify-center ${activePreset === p.label ? "border-primary bg-primary" : "border-gray-300"}`}>
                  {activePreset === p.label && <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-white" />}
                </div>
                {p.label}
              </button>
            ))}
          </div>

          {/* Right Calendars container */}
          <div className="flex-1 flex flex-col p-4 md:p-6 min-w-0">
            {/* Calendars view header/nav */}
            <div className="flex items-center justify-between mb-4 px-2 md:px-4 relative">
              <button
                type="button"
                onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all absolute left-0 z-10 bg-background"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all absolute right-0 z-10 bg-background"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Double calendars side by side (hide second calendar on mobile) */}
            <div className="flex flex-1 gap-6 divide-x divide-border/40">
              {renderCalendar(leftMonth)}
              <div className="hidden md:block md:flex-1 md:pl-6">
                {renderCalendar(rightMonth)}
              </div>
            </div>

            {/* Compare and Inputs Row */}
            <div className="mt-4 md:mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  Compare
                </label>
                <div className="w-[130px] md:w-[140px]">
                  <Select defaultValue="previous_period">
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_period">Previous period</SelectItem>
                      <SelectItem value="previous_year">Previous year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="border border-border/40 rounded-xl px-2.5 py-1 bg-gray-50/50 dark:bg-gray-900/30 text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300">
                  {selectedStart ? format(selectedStart, "d MMM yyyy") : "-"}
                </div>
                <span className="text-gray-400 text-xs">-</span>
                <div className="border border-border/40 rounded-xl px-2.5 py-1 bg-gray-50/50 dark:bg-gray-900/30 text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300">
                  {selectedEnd ? format(selectedEnd, "d MMM yyyy") : "-"}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[10px] text-gray-400 text-center sm:text-left">
                Dates are shown in India Standard Time
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-bold flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdate}
                  className="h-9 px-5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 flex-1 sm:flex-none"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
