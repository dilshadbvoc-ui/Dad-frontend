import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '@/services/analyticsService';
import { getBranches } from '@/services/settingsService';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, RefreshCw, Printer, Building } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAdmin as checkIsAdmin } from "@/lib/utils";

export default function DailyReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const isAdmin = checkIsAdmin(user);

  // Fetch Branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!isAdmin
  });

  const { data: reportData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dailyReport', selectedBranchId],
    queryFn: () => getDailyReport(selectedBranchId === "all" ? undefined : selectedBranchId),
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
  });

  const tableData = reportData?.table || [];
  const summary = reportData?.summary || null;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.loading('Preparing Report...', { id: 'pdf-export' });
      
      const dataUrl = await toPng(reportRef.current, { backgroundColor: '#fff', cacheBust: true });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Daily_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
      
      toast.success('Report saved successfully', { id: 'pdf-export' });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to generate PDF', { id: 'pdf-export' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <PageLoader text="Loading daily report..." />;
  if (error) return <div className="p-8 text-center text-destructive font-medium">Error loading report data. Please try again.</div>;

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Daily Performance Report</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live metrics for {today}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && branches && branches.length > 0 && (
            <div className="w-[200px]">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="bg-background border-primary/20 h-10 px-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary/60" />
                    <SelectValue placeholder="All Branches" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            disabled={isFetching}
            className="gap-2 border-primary/20 hover:bg-primary/5 h-10 px-4"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            size="sm"
            className="gap-2 border-primary/20 hover:bg-primary/5 h-10 px-4"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-4"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-none shadow-2xl shadow-purple-500/5 overflow-hidden rounded-xl bg-background" ref={reportRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#6B3BA8] hover:bg-[#6B3BA8] transition-none border-none">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-white font-bold py-6 px-6 text-sm uppercase tracking-wider border-r border-white/10 first:rounded-tl-xl">User Name</TableHead>
                <TableHead className="text-white font-bold py-6 px-6 text-sm uppercase tracking-wider border-r border-white/10 text-center">Branch</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Calls</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Connected</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Unconnected Calls</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Converted</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider last:rounded-tr-xl">Total Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length > 0 ? (
                tableData.map((row: any, idx: number) => (
                  <TableRow 
                    key={row.id} 
                    className={`
                      border-b border-border/50 transition-colors
                      ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}
                      hover:bg-purple-500/5
                    `}
                  >
                    <TableCell className="py-5 px-6 font-bold text-foreground text-sm uppercase">
                      {row.userName}
                    </TableCell>
                    <TableCell className="text-center py-5">
                      <span className="text-[10px] font-bold uppercase tracking-tighter bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                        {row.branch || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-5 font-medium text-muted-foreground tabular-nums">
                      {row.totalCalls}
                    </TableCell>
                    <TableCell className="text-center py-5">
                      <span className={`
                        inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                        ${row.totalConnected > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {row.totalConnected}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-5 font-medium text-muted-foreground tabular-nums">
                      {row.totalUnconnected}
                    </TableCell>
                    <TableCell className="text-center py-5">
                      <span className={`
                        inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                        ${row.totalConverted > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {row.totalConverted}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-5">
                      <span className={`
                        inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                        ${row.totalLost > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {row.totalLost}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-lg font-medium opacity-50">No activity recorded for today yet.</p>
                      <p className="text-sm opacity-30">Data will appear here as users make calls and update leads.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Cards Section (New) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <SummaryCard title="Total Phone Calls" value={summary.totalCalls} subValue={formatDuration(summary.totalDuration)} color="bg-blue-500" />
          <SummaryCard title="Incoming Calls" value={summary.incoming} subValue={formatDuration(summary.incomingDuration)} color="bg-emerald-500" />
          <SummaryCard title="Outgoing Calls" value={summary.outgoing} subValue={formatDuration(summary.outgoingDuration)} color="bg-indigo-500" />
          <SummaryCard title="Missed Calls" value={summary.missed} color="bg-rose-500" />
          <SummaryCard title="Rejected Calls" value={summary.rejected} color="bg-orange-500" />
          <SummaryCard title="Never Attended Calls" value={summary.neverAttended} color="bg-slate-500" />
          <SummaryCard title="Not Pickup by Client" value={summary.notPickedUp} color="bg-amber-500" />
          <SummaryCard title="Unique Calls" value={summary.unique} color="bg-purple-500" />
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .Card { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, subValue, color }: { title: string; value: number; subValue?: string; color: string }) {
  return (
    <Card className="border-none shadow-lg shadow-black/5 overflow-hidden rounded-2xl bg-background group hover:scale-[1.02] transition-all">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-2 h-10 rounded-full ${color}`} />
          {subValue && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              {subValue}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            {title}
          </p>
          <p className="text-3xl font-black text-foreground tabular-nums group-hover:text-primary transition-colors">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
