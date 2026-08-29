import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Phone, PhoneCall, ArrowRight } from "lucide-react";
import { getCallStats } from "@/services/callService";
import type { DateRangeValue } from "./DateRangeDropdown";
import { SemiCircleGauge } from "./SemiCircleGauge";
import { Skeleton } from "@/components/ui/skeleton";

export function CallOverviewCard({ range }: { range: DateRangeValue }) {
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
    <div className="w-fit">
      <div className="flex items-center justify-between gap-6 mb-6">
        <h3 className="text-lg sm:text-xl font-medium font-poppins text-card-foreground flex items-center gap-2">
          <Phone  strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />
          Call Overview
        </h3>
        <Link
          to="/reports/call-analytics"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--chart-5))] shrink-0"
        >
          View Report
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full max-w-[320px] mx-auto rounded-2xl" />
      ) : (
        <>
          <div className="flex justify-center">
            <SemiCircleGauge percent={pct} label="Connected" />
          </div>

          <div className="border-t border-border my-8" />

          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-none bg-[hsl(var(--chart-5))]/10 flex items-center justify-center shrink-0">
                <PhoneCall strokeWidth={1.5} className="h-6 w-6 text-[hsl(var(--chart-5))]" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-medium font-poppins text-black leading-none">
                  {connected}
                </p>
                <p className="text-[12px] font-poppins text-black mt-1">Connected Calls</p>
              </div>
            </div>

            <div className="w-px self-stretch bg-border" />

            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-none bg-[hsl(var(--chart-5))]/10 flex items-center justify-center shrink-0">
                <Phone strokeWidth={1.5} className="h-6 w-6 text-[hsl(var(--chart-5))]" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-medium font-poppins text-black leading-none">
                  {total}
                </p>
                <p className="text-[12px] font-poppins text-black mt-1">Total Calls</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
