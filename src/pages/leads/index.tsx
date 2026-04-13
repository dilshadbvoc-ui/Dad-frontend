import React, { useState, useMemo, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { type RowSelectionState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getLeads, type Lead } from "@/services/leadService"
import { getTasks, type Task } from "@/services/taskService"
import { getUsers } from "@/services/userService"
import { getBranches } from "@/services/settingsService"
import { EnvironmentWarning } from "@/components/shared/EnvironmentWarning"
import { LoadingCard } from "@/components/ui/loading-spinner"
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatWhatsAppNumber } from "@/lib/utils"
import { isMobileApp, initiateCall as initiateCallBridge } from "@/utils/mobileBridge"
import { Button } from "@/components/ui/button"
import { Link, useSearchParams } from "react-router-dom"
import {
    Plus,
    Phone,
    MessageCircle,
    CalendarCheck,
    RefreshCw,
    Download,
    ArrowUpDown,
    Users,
    CheckCircle2,
    X,
    Building,
    LayoutGrid,
    Search
} from "lucide-react"
import { BulkAssignDialog } from "./BulkAssignDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select"

// --- Sidebar Item Component (removed - now using dropdown) ---


import { format, isSameDay, isPast, isFuture, isToday } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { LeadTableRow } from "./LeadTableRow"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"

// --- Helper Components & Logic ---

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Task Table Component (Simple version for Follow Ups view)
function TaskTable({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) return <div className="text-center py-8 text-muted-foreground">No tasks found.</div>;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) => {
                    let statusClassName = "capitalize ";
                    switch (task.status) {
                        case 'completed': statusClassName += "bg-success/10 text-success border-success/20"; break;
                        case 'in_progress': statusClassName += "bg-warning/10 text-warning border-warning/20"; break;
                        case 'deferred': statusClassName += "bg-muted text-muted-foreground border-border"; break;
                        case 'not_started': default: statusClassName += "bg-blue-500/10 text-blue-500 border-blue-500/20"; break;
                    }

                    return (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.subject}</TableCell>
                            <TableCell>
                                {task.relatedTo ? `${task.onModel}: ${task.relatedTo.firstName || task.relatedTo.name || ''} ${task.relatedTo.lastName || ''}`.trim() : '-'}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusClassName}>
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}</TableCell>
                            <TableCell>{task.assignedTo?.firstName || 'Unknown'} {task.assignedTo?.lastName || ''}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

// Chart Components
// Chart Components
const StatusPieChart = React.memo(({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <RechartsPie>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
        </RechartsPie>
    </ResponsiveContainer>
));

const VerticalBarChart = React.memo(({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
    </ResponsiveContainer>
));


// --- Mobile Lead Card ---
const LeadCard = ({ lead }: { lead: Lead }) => {
    const phone = formatWhatsAppNumber(lead.phone);

    const handleWhatsApp = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!phone) {
            toast.error('No phone number available for this lead');
            return;
        }

        const callSessionId = crypto.randomUUID();

        try {
            const userInfo = localStorage.getItem('userInfo');
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await fetch(`/api/interactions/leads/${lead.id}/quick-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ type: 'whatsapp', phoneNumber: phone, callSessionId })
            });
        } catch (err) {
            console.warn('Failed to log WhatsApp interaction:', err);
        }
        window.location.href = `https://wa.me/${phone}`;
    };

    const handleCall = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!phone) return;

        const callSessionId = crypto.randomUUID();

        // If in mobile app, try native bridge first
        if (isMobileApp()) {
            initiateCallBridge(phone, callSessionId);
        }

        try {
            const userInfo = localStorage.getItem('userInfo');
            const token = userInfo ? JSON.parse(userInfo).token : null;
            await fetch(`/api/interactions/leads/${lead.id}/quick-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ type: 'call', phoneNumber: phone, callSessionId })
            });
        } catch (err) {
            console.warn('Failed to log Call interaction:', err);
        }

        if (!isMobileApp()) {
            window.location.href = `tel:${phone}`;
        }
    };

    const { getStatusDetails } = useLeadStatuses();
    const { label, color } = getStatusDetails(lead.status);

    return (
        <Card className="shadow-sm border-l-4 overflow-hidden" style={{ borderLeftColor: color }}>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="min-w-0">
                        <h4 className="font-bold text-foreground truncate">{lead.firstName} {lead.lastName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                    <Badge 
                        variant="outline" 
                        className="text-[10px] uppercase font-bold tracking-tighter"
                        style={{ 
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}30`
                        }}
                    >
                        {label}
                    </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        <span>{format(new Date(lead.createdAt), 'MMM d')}</span>
                    </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-success hover:bg-success/10 rounded-full"
                            onClick={handleWhatsApp}
                            title="WhatsApp"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-info hover:bg-info/10 rounded-full"
                            onClick={handleCall}
                            title="Call"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </div>
                    <Link to={`/leads/${lead.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-full">
                            View Details
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};

export default function LeadsPage() {
    const { statuses, getStatusDetails } = useLeadStatuses()
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    // Default view is 'all-leads' if not specified
    const currentView = searchParams.get('view') || 'all-leads';
    const currentSort = searchParams.get('sort') || 'newest';
    const currentOwner = searchParams.get('owner') || 'all';
    const currentBranch = searchParams.get('branch') || 'all';

    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
    const [pageSize, setPageSize] = useState(50);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = typeof userInfo.role === 'object' ? userInfo.role.id : userInfo.role;
    const isAdminOrManager = ['admin', 'manager', 'organisation_admin', 'super_admin'].includes(userRole?.toLowerCase());

    // Manual refresh function
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    // --- Data Fetching ---
    // 1. Leads
    const { data: leadData, isLoading: leadsLoading, isFetching: leadsFetching } = useQuery({
        queryKey: ['leads', 'all', currentOwner, currentBranch],
        queryFn: () => getLeads({ 
            pageSize: 1000,
            assignedTo: currentOwner === 'all' ? undefined : currentOwner,
            branchId: currentBranch === 'all' ? undefined : currentBranch
        }),
    });

    // 2. Tasks (Follow Ups)
    const { data: taskData, isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => getTasks({ status: 'all', limit: 1000 }),
    });

    // 3. Users for Owner Filter
    const { data: userData } = useQuery({
        queryKey: ['users', 'list'],
        queryFn: () => getUsers(),
    });

    // 4. Branches for Branch Filter
    const { data: branchData } = useQuery({
        queryKey: ['branches', 'list'],
        queryFn: () => getBranches(),
    });

    const leads = (leadData?.leads || []).filter((l: Lead) => l && typeof l === 'object');
    const tasks = (taskData?.tasks || []).filter((t: Task) => t && typeof t === 'object');
    const users = userData?.users || (Array.isArray(userData) ? userData : []);
    const branches = branchData || [];

    // Sort function
    const sortLeads = (leadsToSort: Lead[]) => {
        const sorted = [...leadsToSort];
        switch (currentSort) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'name-asc':
                return sorted.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
            case 'name-desc':
                return sorted.sort((a, b) => (b.firstName || '').localeCompare(a.firstName || ''));
            case 'owner-asc':
                return sorted.sort((a, b) => {
                    const nameA = a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName || ''}`.trim() : '';
                    const nameB = b.assignedTo ? `${b.assignedTo.firstName} ${b.assignedTo.lastName || ''}`.trim() : '';
                    return nameA.localeCompare(nameB);
                });
            case 'owner-desc':
                return sorted.sort((a, b) => {
                    const nameA = a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName || ''}`.trim() : '';
                    const nameB = b.assignedTo ? `${b.assignedTo.firstName} ${b.assignedTo.lastName || ''}`.trim() : '';
                    return nameB.localeCompare(nameA);
                });
            default:
                return sorted;
        }
    };


    // --- View Logic ---
    const getDisplayData = () => {
        switch (currentView) {
            // Leads Views
            case 'all-leads':
                return leads; // Apply table filters normally
            case 'today-leads':
                return leads.filter((l: Lead) =>
                    isSameDay(new Date(l.createdAt), new Date()) ||
                    (l.lastEnquiryDate && isSameDay(new Date(l.lastEnquiryDate), new Date()))
                );
            case 'no-activity-leads':
                // Placeholder: simple check if updated recently? Or just return all for now as specific API needed.
                // Let's filter by updated > 30 days ago for "No Activity" mock
                return leads.filter((l: Lead) => isPast(new Date(l.updatedAt)) && new Date(l.updatedAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Dynamic Status Views
            default:
                if (currentView.startsWith('status-')) {
                    const statusId = currentView.replace('status-', '');
                    return leads.filter((l: Lead) => l.status === statusId);
                }
                
                // Task Views
                if (currentView.includes('followup')) {
                    switch (currentView) {
                        case 'all-followups': return tasks;
                        case 'overdue-followups': return tasks.filter((t: Task) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed');
                        case 'today-followups': return tasks.filter((t: Task) => t.dueDate && isSameDay(new Date(t.dueDate), new Date()) && t.status !== 'completed');
                        case 'upcoming-followups': return tasks.filter((t: Task) => t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed');
                    }
                }

                return leads;


        }
    };

    const displayData = useMemo(() => getDisplayData(), [leads, tasks, currentView]);
    const isTaskView = currentView.includes('followup');
    const isChartView = ['leads-by-status', 'leads-by-source', 'leads-by-ownership'].includes(currentView);
    
    const sortedDisplayData = useMemo(() => {
        return isTaskView ? displayData : sortLeads(displayData as Lead[]);
    }, [displayData, isTaskView, currentSort]);

    // Pagination display logic
    const totalFilteredLeads = (sortedDisplayData as Lead[]).length;
    const currentRangeEnd = Math.min(pageSize, totalFilteredLeads);
    const paginationLabel = totalFilteredLeads > 0 
        ? <span className="text-sm font-medium whitespace-nowrap ml-2">
            <span className="font-bold">1 - {currentRangeEnd}</span> of <span className="font-bold">{totalFilteredLeads}</span>
          </span>
        : <span className="text-sm text-muted-foreground ml-2">0 leads</span>;

    // --- Chart Data Helpers ---
    const getChartData = () => {
        const counts: Record<string, number> = {};
        if (currentView === 'leads-by-status') {
            leads.forEach((l: Lead) => { 
                const label = getStatusDetails(l.status).label;
                counts[label] = (counts[label] || 0) + 1; 
            });
        } else if (currentView === 'leads-by-source') {
            leads.forEach((l: Lead) => { counts[l.source] = (counts[l.source] || 0) + 1; });
        } else if (currentView === 'leads-by-ownership') {
            leads.forEach((l: Lead) => {
                const name = l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned';
                counts[name] = (counts[name] || 0) + 1;
            });
        }
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }


    const handleViewChange = (view: string) => {
        setSearchParams({ view, sort: currentSort });
    };

    const handleSortChange = (sort: string) => {
        setSearchParams({ view: currentView, sort, owner: currentOwner });
    };

    const handleOwnerChange = (owner: string) => {
        setSearchParams({ view: currentView, sort: currentSort, owner, branch: currentBranch });
    };

    const handleBranchChange = (branch: string) => {
        setSearchParams({ view: currentView, sort: currentSort, owner: currentOwner, branch });
    };

    // Excel download function
    const handleExcelDownload = () => {
        const dataToExport = sortedDisplayData as Lead[];

        const excelData = dataToExport.map((lead: Lead) => ({
            'First Name': lead.firstName || '',
            'Last Name': lead.lastName || '',
            'Email': lead.email || '',
            'Phone': lead.phone || '',
            'Company': lead.company || '',
            'Status': lead.status || '',
            'Source': lead.source || '',
            'Lead Score': lead.leadScore || 0,
            'Assigned To': lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '',
            'Created At': lead.createdAt ? format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
            'Country': lead.country || '',
            'Re-Enquiry': lead.isReEnquiry ? 'Yes' : 'No'
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(excelData[0] || {}).map(key => ({
            wch: Math.min(Math.max(key.length, 10), maxWidth)
        }));
        worksheet['!cols'] = colWidths;

        const fileName = `leads_${currentView}_${currentSort}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const isLoading = leadsLoading || tasksLoading;

    const isAnalyticsView = currentView === 'leads-analytics';

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">
            {/* Main Content */}
            <div className="flex-1 flex flex-col space-y-6 min-w-0">

                {/* Environment Warning - Optional on mobile */}
                <div className="hidden sm:block">
                    <EnvironmentWarning />
                </div>

                {/* Header Area */}
                <div className="space-y-4 px-2 sm:px-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 hidden sm:flex">
                                <LayoutGrid className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground capitalize tracking-tight flex items-center gap-3">
                                    {currentView.replace(/-/g, ' ')}
                                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                                        {leadData?.total || 0}
                                        <span className="text-[10px] uppercase tracking-widest opacity-70">Total</span>
                                    </div>
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    {isTaskView ? 'Manage follow-ups' : isAnalyticsView ? 'Lead performance' : 'Real-time lead management'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            {!isTaskView && !isChartView && !isAnalyticsView && (
                                <Link to="/leads/new">
                                    <Button className="h-11 px-6 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold rounded-xl">
                                        <Plus className="h-5 w-5 mr-2" />
                                        New Lead
                                    </Button>
                                </Link>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={leadsFetching}
                                className="h-11 w-11 p-0 rounded-xl border-dashed bg-background/50 backdrop-blur-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${leadsFetching ? 'animate-spin text-primary' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50">
                        {/* View Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">View</label>
                            <Select value={currentView} onValueChange={handleViewChange}>
                                <SelectTrigger className="h-10 bg-background border-border/50 rounded-lg shadow-sm">
                                    <SelectValue placeholder="Select View" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-border/50">
                                    <SelectGroup>
                                        <SelectLabel className="text-[10px] uppercase tracking-widest font-black text-primary/50 py-3">Quick Views</SelectLabel>
                                        <SelectItem value="all-leads" className="rounded-lg">All Leads</SelectItem>
                                        <SelectItem value="today-leads" className="rounded-lg">Today's Leads</SelectItem>
                                        <SelectItem value="no-activity-leads" className="rounded-lg">No Activity</SelectItem>
                                        
                                        <SelectLabel className="mt-4 text-[10px] uppercase tracking-widest font-black text-primary/50 py-3 border-t">Pipeline Stages</SelectLabel>
                                        {statuses.map(status => (
                                            <SelectItem key={status.id} value={`status-${status.id}`} className="rounded-lg">
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Owner Filter */}
                        {!isTaskView && !isChartView && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Assigned To</label>
                                <Select value={currentOwner} onValueChange={handleOwnerChange}>
                                    <SelectTrigger className="h-10 bg-background border-border/50 rounded-lg shadow-sm">
                                        <SelectValue placeholder="All Owners" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-border/50">
                                        <SelectItem value="all" className="rounded-lg font-medium italic">General Pool (All)</SelectItem>
                                        <SelectGroup>
                                            <SelectLabel className="text-[10px] uppercase tracking-widest font-black text-primary/50 py-3 border-t">Active Users</SelectLabel>
                                            {users.map((user: any) => (
                                                <SelectItem key={user.id} value={user.id} className="rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {user.firstName[0]}{user.lastName?.[0] || ''}
                                                        </div>
                                                        <span className="truncate">{user.firstName} {user.lastName || ''}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Branch Filter */}
                        {!isTaskView && !isChartView && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Branch</label>
                                <Select value={currentBranch} onValueChange={handleBranchChange}>
                                    <SelectTrigger className="h-10 bg-background border-border/50 rounded-lg shadow-sm">
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-border/50">
                                        <SelectItem value="all" className="rounded-lg font-medium italic">All Locations</SelectItem>
                                        <SelectGroup>
                                            <SelectLabel className="text-[10px] uppercase tracking-widest font-black text-primary/50 py-3 border-t">Branches</SelectLabel>
                                            {branches.map((branch: any) => (
                                                <SelectItem key={branch.id} value={branch.id} className="rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="truncate font-medium">{branch.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Sort Filter */}
                        {!isTaskView && !isChartView && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Sorting</label>
                                <Select value={currentSort} onValueChange={handleSortChange}>
                                    <SelectTrigger className="h-10 bg-background border-border/50 rounded-lg shadow-sm">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-border/50">
                                        <SelectItem value="newest" className="rounded-lg">
                                            <div className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5" />Newest First</div>
                                        </SelectItem>
                                        <SelectItem value="oldest" className="rounded-lg">
                                            <div className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5" />Oldest First</div>
                                        </SelectItem>
                                        <SelectItem value="name-asc" className="rounded-lg">
                                            <div className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5" />Name (A-Z)</div>
                                        </SelectItem>
                                        <SelectItem value="owner-asc" className="rounded-lg">
                                            <div className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5" />Owner (A-Z)</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Actions Filter */}
                        {!isTaskView && !isChartView && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Page Controls</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Select 
                                            value={pageSize === totalFilteredLeads ? 'all' : pageSize.toString()} 
                                            onValueChange={(val) => setPageSize(val === 'all' ? totalFilteredLeads : parseInt(val))}
                                        >
                                            <SelectTrigger className="h-10 bg-background border-border/50 rounded-lg shadow-sm">
                                                <SelectValue placeholder="Size" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-2xl border-border/50">
                                                <SelectItem value="20" className="rounded-lg">20 Per Page</SelectItem>
                                                <SelectItem value="50" className="rounded-lg">50 Per Page</SelectItem>
                                                <SelectItem value="100" className="rounded-lg">100 Per Page</SelectItem>
                                                <SelectItem value="all" className="rounded-lg">Show All</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={handleExcelDownload}
                                        disabled={totalFilteredLeads === 0}
                                        className="h-10 w-10 border-border/50 bg-background shadow-sm hover:text-green-600 rounded-lg"
                                        title="Export to Excel"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0 bg-transparent lg:bg-card lg:rounded-xl lg:border lg:shadow-sm overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full p-6">
                            <LoadingCard text="Loading leads..." />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                            {isChartView ? (
                                <div className="p-2 sm:p-6">
                                    <Card className="border-0 sm:border shadow-sm">
                                        <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg capitalize">{currentView.replace(/-/g, ' ')}</CardTitle></CardHeader>
                                        <CardContent className="p-2 sm:p-6 sm:pt-0">
                                            {currentView === 'leads-by-status' && <StatusPieChart data={getChartData()} />}
                                            {currentView !== 'leads-by-status' && <VerticalBarChart data={getChartData()} />}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : isTaskView ? (
                                <div className="p-2 sm:p-4">
                                    <TaskTable tasks={displayData as Task[]} />
                                </div>
                            ) : (
                                <div className="p-0">
                                    <DataTable
                                        columns={columns}
                                        data={sortedDisplayData as Lead[]}
                                        searchKeys={["firstName", "lastName", "email", "phone", "company"]}
                                        mobileCardRender={(lead) => <LeadCard lead={lead} />}
                                        initialPageSize={50}
                                        pageSize={pageSize}
                                        rowSelection={rowSelection}
                                        onRowSelectionChangeState={setRowSelection}
                                        isVirtual={true}
                                        virtualItemHeight={53}
                                        CustomRowComponent={LeadTableRow as any}
                                        renderSubComponent={({ row }) => {
                                            const leadTasks = tasks.filter((t: Task) => t.leadId === row.original.id);
                                            return (
                                                <div className="p-4 bg-muted/30 rounded-md border border-border/50 shadow-inner my-2 ml-10">
                                                    <h4 className="text-sm font-semibold mb-2 text-foreground/80 flex items-center gap-2">
                                                        <CalendarCheck className="h-4 w-4" /> Follow Ups
                                                    </h4>
                                                    <TaskTable tasks={leadTasks} />
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {isAdminOrManager && Object.keys(rowSelection).length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 min-w-[300px] border border-primary-foreground/20">
                        <div className="flex items-center gap-2 border-r border-primary-foreground/20 pr-4">
                            <span className="bg-white text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                {Object.keys(rowSelection).length}
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">Leads Selected</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-primary-foreground hover:bg-white/10 h-8 px-3 rounded-full gap-2 text-xs"
                                onClick={() => setIsBulkAssignDialogOpen(true)}
                            >
                                <Users className="h-4 w-4" />
                                Assign to User
                            </Button>
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-primary-foreground/70 hover:bg-white/10 h-8 w-8 rounded-full"
                            onClick={() => {
                                setRowSelection({});
                            }}
                            title="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {isAdminOrManager && Object.keys(rowSelection).length > 0 && (
                <BulkAssignDialog
                    open={isBulkAssignDialogOpen}
                    onOpenChange={setIsBulkAssignDialogOpen}
                    selectedLeads={Object.keys(rowSelection)}
                    onSuccess={() => {
                        setRowSelection({});
                        handleRefresh();
                    }}
                />
            )}
        </div>
    )
}
