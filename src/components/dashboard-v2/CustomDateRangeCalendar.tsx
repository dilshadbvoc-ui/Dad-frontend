import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
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
import { Button } from "@/components/ui/button";

interface CustomDateRangeCalendarProps {
  startDate?: string;
  endDate?: string;
  onUpdate: (start: string, end: string) => void;
  onCancel: () => void;
}

// A trimmed-down version of the dual-calendar range picker used on the Leads page
// (components/shared/DateRangePicker.tsx), stripped of its own preset sidebar since
// Today/Yesterday/This Month/etc. are already offered as separate options one level up
// in DateRangeDropdown — this component only handles the "Custom Range" day-picking part.
export function CustomDateRangeCalendar({ startDate, endDate, onUpdate, onCancel }: CustomDateRangeCalendarProps) {
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = useState<Date>(() =>
    startOfMonth(startDate ? new Date(startDate) : new Date())
  );

  const rightMonth = addMonths(leftMonth, 1);

  const handleDayClick = (day: Date) => {
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
    } else if (selectedStart) {
      onUpdate(format(selectedStart, "yyyy-MM-dd"), format(selectedStart, "yyyy-MM-dd"));
    }
  };

  const renderCalendar = (monthDate: Date) => {
    const startDay = startOfWeek(startOfMonth(monthDate));
    const endDay = endOfWeek(endOfMonth(monthDate));
    const days = eachDayOfInterval({ start: startDay, end: endDay });
    const monthYearStr = format(monthDate, "MMMM yyyy");
    const [monthName, yearStr] = monthYearStr.split(" ");

    return (
      <div className="flex-1 px-2">
        <div className="text-center font-bold text-sm text-foreground mb-3 flex items-center justify-center gap-1">
          <span className="capitalize">{monthName}</span>
          <span>{yearStr}</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-semibold text-muted-foreground py-1">
              {d}
            </div>
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
                  h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all relative
                  ${!isCurrentMonth ? "opacity-0 cursor-default" : "text-foreground hover:bg-[hsl(var(--chart-5))]/10"}
                  ${isSelectedStart || isSelectedEnd ? "!bg-[hsl(var(--chart-5))] !text-white z-10 shadow-md" : ""}
                  ${isInRange && isCurrentMonth ? "bg-[hsl(var(--chart-5))]/10 !text-[hsl(var(--chart-5))] rounded-none w-full" : ""}
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
    <div className="w-[280px] sm:w-[500px]">
      <div className="flex items-center justify-between mb-3 px-1 relative">
        <button
          type="button"
          onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
          className="p-1 rounded-full border border-border hover:bg-muted transition-all"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
          className="p-1 rounded-full border border-border hover:bg-muted transition-all"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-4 divide-x divide-border">
        {renderCalendar(leftMonth)}
        <div className="hidden sm:block flex-1 pl-4">{renderCalendar(rightMonth)}</div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-1.5">
        <div className="border border-border rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground">
          {selectedStart ? format(selectedStart, "d MMM yyyy") : "-"}
        </div>
        <span className="text-muted-foreground text-xs">-</span>
        <div className="border border-border rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground">
          {selectedEnd ? format(selectedEnd, "d MMM yyyy") : "-"}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8 px-3 rounded-lg text-xs">
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!selectedStart}
          onClick={handleUpdate}
          className="h-8 px-4 rounded-lg text-xs !bg-[hsl(var(--chart-5))] hover:!bg-[hsl(var(--chart-5))]/90 !text-white"
        >
          Update
        </Button>
      </div>
    </div>
  );
}
