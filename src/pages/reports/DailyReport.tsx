import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '@/services/analyticsService';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, RefreshCw, Printer } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export default function DailyReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: reportData = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dailyReport'],
    queryFn: () => getDailyReport(),
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
  });

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
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Calls</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Connected</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Unconnected Calls</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider border-r border-white/10">Total Converted</TableHead>
                <TableHead className="text-white font-bold py-6 text-center text-sm uppercase tracking-wider last:rounded-tr-xl">Total Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((row: any, idx: number) => (
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
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
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
