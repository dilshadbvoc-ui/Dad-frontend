import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeadDistributionReport } from '@/services/analyticsService';
import { getBranches } from '@/services/settingsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Building, Filter, ArrowLeft, Loader2, Calendar, User as UserIcon, List } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAdmin as checkIsAdmin } from "@/lib/utils";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function LeadDistributionPage() {
    const navigate = useNavigate();
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    
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

    const { data: reportData, isLoading, refetch } = useQuery({
        queryKey: ['leadDistribution', selectedBranchId, startDate, endDate],
        queryFn: () => getLeadDistributionReport({
            branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
            startDate,
            endDate
        }),
    });

    const summaryByUser = reportData?.summary?.byUser || [];
    const summaryByDate = reportData?.summary?.byDate || [];

    if (isLoading) return <PageLoader text="Loading distribution report..." />;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Distribution Report</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                        <div className="flex items-center px-3 py-1.5 gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0"
                            />
                        </div>
                        <div className="text-muted-foreground">to</div>
                        <div className="flex items-center px-3 py-1.5 gap-2">
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0"
                            />
                        </div>
                    </div>

                    {isAdmin && branches && branches.length > 0 && (
                        <div className="w-[200px]">
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger className="bg-background h-10 px-4">
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
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User-wise Distribution</CardTitle>
                        <CardDescription>Total leads distributed to each user in the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-center">Leads Distributed</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryByUser.length > 0 ? (
                                    summaryByUser.map((row: any) => (
                                        <TableRow key={row.userId}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                {row.userName}
                                            </TableCell>
                                            <TableCell>{row.branch}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="px-3 py-1 text-sm font-bold">
                                                    {row.count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <List className="h-4 w-4" />
                                                            View Details
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Leads distributed to {row.userName}</DialogTitle>
                                                        </DialogHeader>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Lead Name</TableHead>
                                                                    <TableHead>Phone/Email</TableHead>
                                                                    <TableHead>Source</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead>Distributed At</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {row.leads.map((lead: any) => (
                                                                    <TableRow key={lead.id}>
                                                                        <TableCell className="font-medium">{lead.firstName} {lead.lastName}</TableCell>
                                                                        <TableCell className="text-xs">
                                                                            <div>{lead.phone}</div>
                                                                            <div className="text-muted-foreground">{lead.email}</div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="secondary" className="text-[10px]">{lead.status}</Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-xs">
                                                                            {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                            No lead distributions found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Date-wise Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Breakdown</CardTitle>
                        <CardDescription>Total distributions per day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryByDate.length > 0 ? (
                                    summaryByDate.map((row: any) => (
                                        <TableRow key={row.date}>
                                            <TableCell className="font-medium">{format(new Date(row.date), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="text-right font-bold">{row.count}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground italic">
                                            No data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
