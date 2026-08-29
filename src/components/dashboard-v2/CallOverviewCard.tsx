import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Phone, PhoneCall, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCallStats } from "@/services/callService";
import { DateRangeDropdown, type DateRangeValue } from "./DateRangeDropdown";
import { SemiCircleGauge } from "./SemiCircleGauge";
import { Skeleton } from "@/components/ui/skeleton";

export function CallOverviewCard() {
  const [range, setRange] = useState<DateRangeValue>({ period: "week" });

  const { data, isLoading } = useQuery({
    queryKey: ["call-overview-stats", range.period, range.startDate, range.endDate],
    queryFn: () =>
      getCallStats(
        range.period,
        undefined,
        range.period === "custom" && range.startDate && range.endDate
          ? { startDate: range.startDate, endDate: range.endDate }
          : undefined
      ),
  });

  const total = data?.totalCalls ?? 0;
  const connected = data?.connectedCalls ?? 0;
  const pct = total > 0 ? (connected / total) * 100 : 0;

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg sm:text-xl font-bold text-card-foreground flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Call Overview
        </CardTitle>
        <DateRangeDropdown value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <SemiCircleGauge percent={pct} label="Connected" />
            <div className="flex flex-col gap-4 flex-1 min-w-[120px]">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none">{connected}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-primary" /> Connected Calls
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-muted-foreground leading-none">{total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Calls</p>
              </div>
            </div>
          </div>
        )}
        <Link
          to="/reports/call-analytics"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-4"
        >
          View Report
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
