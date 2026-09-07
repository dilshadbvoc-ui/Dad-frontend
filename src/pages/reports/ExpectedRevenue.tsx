import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { getExpectedRevenueReport, type ExpectedRevenueDeal } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { formatIST, toISTDateString } from "@/lib/dateUtils";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { isAdmin as checkIsAdmin } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

const STATUS_STYLES: Record<ExpectedRevenueDeal["status"], { label: string; className: string }> = {
  current: { label: "This Period", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  carried_forward: { label: "Carried Forward", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  no_date: { label: "No Close Date", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="rounded-[10px]">
      <CardContent className="p-4">
        <p className="text-xs font-poppins text-muted-foreground">{label}</p>
        <p className="text-2xl font-medium font-poppins mt-1">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ExpectedRevenuePage() {
  const { formatCurrency } = useCurrency();
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  });
  const isAdmin = checkIsAdmin(user);

  // Carried over from the Dashboard's branch/date filters (see
  // dashboard-v2/dashboardLinks.ts) so opening this report from the "Exp. Revenue"
  // tile shows the same slice of data instead of resetting to no filter.
  const [searchParams] = useSearchParams();

  const [startDate, setStartDate] = useState<string>(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState<string>(searchParams.get("endDate") || "");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(searchParams.get("branchId"));

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    enabled: !!isAdmin,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["expected-revenue-report", startDate, endDate, selectedBranchId],
    queryFn: () =>
      getExpectedRevenueReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: selectedBranchId || undefined,
      }),
  });

  const deals = report?.deals ?? [];
  const summary = report?.summary;

  const handleExport = () => {
    if (deals.length === 0) return;

    const excelData = deals.map((d) => ({
      Opportunity: d.name,
      Customer: d.customerName,
      Owner: d.ownerName,
      Branch: d.branchName,
      Stage: d.stage?.replace(/_/g, " ") || "",
      "Expected Close Date": d.closeDate ? formatIST(d.closeDate, "yyyy-MM-dd") : "",
      Status: STATUS_STYLES[d.status].label,
      Amount: d.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expected Revenue");
    XLSX.writeFile(workbook, `expected_revenue_${toISTDateString()}.xlsx`);
  };

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Expected Revenue Report"
        description={report ? `Open deals as of ${report.periodLabel}` : "Open deals and their expected close status"}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={deals.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
        </div>

        {isAdmin && branches && branches.length > 0 && (
          <div className="w-[200px]">
            <Select value={selectedBranchId || "all"} onValueChange={(val) => setSelectedBranchId(val === "all" ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: { id: string; name: string }) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Expected Revenue"
          value={formatCurrency(summary?.totalExpectedRevenue || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${deals.length} open deals`}
        />
        <StatCard
          label="This Period"
          value={formatCurrency(summary?.currentPeriodAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.currentPeriodCount || 0} deals`}
        />
        <StatCard
          label="Carried Forward"
          value={formatCurrency(summary?.carriedForwardAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.carriedForwardCount || 0} deals overdue from earlier`}
        />
        <StatCard
          label="Upcoming"
          value={formatCurrency(summary?.upcomingAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.upcomingCount || 0} deals`}
        />
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <CardDescription>{report ? `${deals.length} records found` : "Loading..."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Expected Close Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">Loading...</TableCell>
                </TableRow>
              ) : deals.length > 0 ? (
                deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.customerName}</TableCell>
                    <TableCell>{d.ownerName}</TableCell>
                    <TableCell>{d.branchName}</TableCell>
                    <TableCell className="capitalize">{d.stage?.replace(/_/g, " ")}</TableCell>
                    <TableCell>{d.closeDate ? formatIST(d.closeDate, "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[d.status].className} variant="outline">
                        {STATUS_STYLES[d.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(d.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No open deals found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
