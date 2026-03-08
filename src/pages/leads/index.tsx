
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getLeads, type Lead } from "@/services/leadService"
import { getTasks, type Task } from "@/services/taskService"
import { EnvironmentWarning } from "@/components/shared/EnvironmentWarning"
import { LoadingCard } from "@/components/ui/loading-spinner"
import * as XLSX from 'xlsx'

import { Button } from "@/components/ui/button"
import { Link, useSearchParams } from "react-router-dom"
import {
    Plus,
    Phone,
    CalendarCheck,
    RefreshCw,
    Download,
    ArrowUpDown
} from "lucide-react"
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
const StatusPieChart = ({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <RechartsPie>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
        </RechartsPie>
    </ResponsiveContainer>
);

const VerticalBarChart = ({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
    </ResponsiveContainer>
);


// --- Mobile Lead Card ---
const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card className="shadow-sm border-l-4 border-l-primary overflow-hidden">
        <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <h4 className="font-bold text-foreground truncate">{lead.firstName} {lead.lastName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                    {lead.status}
                </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    <span>Score: {lead.leadScore}</span>
                </div>
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
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '') || ''}`, '_blank');
                        }}
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-info hover:bg-info/10 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${lead.phone?.replace(/\D/g, '') || ''}`;
                        }}
                    >
                        <CalendarCheck className="h-4 w-4" />
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

export default function LeadsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    // Default view is 'all-leads' if not specified
    const currentView = searchParams.get('view') || 'all-leads';
    const currentSort = searchParams.get('sort') || 'newest';

    // Manual refresh function
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    // --- Data Fetching ---
    // 1. Leads
    const { data: leadData, isLoading: leadsLoading, isFetching: leadsFetching } = useQuery({
        queryKey: ['leads', 'all'], // Fetch all for sorting/filtering client side for report views
        queryFn: () => getLeads({ pageSize: 1000 }),
    });

    // 2. Tasks (Follow Ups)
    const { data: taskData, isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => getTasks({ status: 'all', limit: 1000 }),
    });

    const leads = (leadData?.leads || []).filter((l: Lead) => l && typeof l === 'object');
    const tasks = (taskData?.tasks || []).filter((t: Task) => t && typeof t === 'object');

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
            case 'score-high':
                return sorted.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
            case 'score-low':
                return sorted.sort((a, b) => (a.leadScore || 0) - (b.leadScore || 0));
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
            case 'converted-leads':
                return leads.filter((l: Lead) => l.status === 'converted');
            case 'lost-leads':
                return leads.filter((l: Lead) => l.status === 'lost');
            case 'no-activity-leads':
                // Placeholder: simple check if updated recently? Or just return all for now as specific API needed.
                // Let's filter by updated > 30 days ago for "No Activity" mock
                return leads.filter((l: Lead) => isPast(new Date(l.updatedAt)) && new Date(l.updatedAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Task Views
            case 'all-followups':
                return tasks;
            case 'overdue-followups':
                return tasks.filter((t: Task) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed');
            case 'today-followups':
                return tasks.filter((t: Task) => t.dueDate && isSameDay(new Date(t.dueDate), new Date()) && t.status !== 'completed');
            case 'upcoming-followups':
                return tasks.filter((t: Task) => t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed');

            default:
                return leads;
        }
    };

    const displayData = getDisplayData();
    const isTaskView = currentView.includes('followup');
    const isChartView = ['leads-by-status', 'leads-by-source', 'leads-by-ownership'].includes(currentView);
    const sortedDisplayData = isTaskView ? displayData : sortLeads(displayData as Lead[]);

    // --- Chart Data Helpers ---
    const getChartData = () => {
        const counts: Record<string, number> = {};
        if (currentView === 'leads-by-status') {
            leads.forEach((l: Lead) => { counts[l.status] = (counts[l.status] || 0) + 1; });
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
        setSearchParams({ view: currentView, sort });
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-0">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground capitalize truncate">
                            {currentView.replace(/-/g, ' ')}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                            {isTaskView ? 'Manage follow-ups' : isAnalyticsView ? 'Lead performance' : 'Manage your leads'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 min-w-[180px] sm:min-w-[200px]">
                            <Select value={currentView} onValueChange={handleViewChange}>
                                <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                                    <SelectValue placeholder="Select View" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Leads</SelectLabel>
                                        <SelectItem value="all-leads">All Leads</SelectItem>
                                        <SelectItem value="no-activity-leads">No Activity Leads</SelectItem>
                                        <SelectItem value="today-leads">Today's Leads</SelectItem>
                                        <SelectItem value="converted-leads">Converted Leads</SelectItem>
                                        <SelectItem value="lost-leads">Lost Leads</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>Analysis</SelectLabel>
                                        <SelectItem value="leads-by-status">Leads by Status</SelectItem>
                                        <SelectItem value="leads-by-source">Leads by Source</SelectItem>
                                        <SelectItem value="leads-by-ownership">Leads by Ownership</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>Follow Ups</SelectLabel>
                                        <SelectItem value="overdue-followups">Overdue Follow Ups</SelectItem>
                                        <SelectItem value="today-followups">Today's Follow Ups</SelectItem>
                                        <SelectItem value="upcoming-followups">Upcoming Follow Ups</SelectItem>
                                        <SelectItem value="all-followups">All Follow Ups</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {!isTaskView && !isChartView && (
                            <div className="min-w-[140px] sm:min-w-[160px]">
                                <Select value={currentSort} onValueChange={handleSortChange}>
                                    <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Newest First
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="oldest">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Oldest First
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="name-asc">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Name (A-Z)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="name-desc">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Name (Z-A)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="score-high">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Score (High-Low)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="score-low">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-3 w-3" />
                                                Score (Low-High)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {!isTaskView && !isChartView && (sortedDisplayData as Lead[]).length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleExcelDownload}
                                className="h-9 px-3 gap-2 text-xs"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Excel</span>
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={leadsFetching}
                            className="h-9 px-3 gap-2 text-xs"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${leadsFetching ? 'animate-spin' : ''}`} />
                            <span className="hidden xs:inline">Refresh</span>
                        </Button>

                        {!isTaskView && !isChartView && !isAnalyticsView && (
                            <Link to="/leads/new" className="hidden sm:block">
                                <Button size="sm" className="h-9 px-4 bg-primary text-primary-foreground shadow-lg shadow-primary/25 text-xs">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Lead
                                </Button>
                            </Link>
                        )}

                        {/* Mobile FAB or specific button if needed */}
                        {!isTaskView && !isChartView && !isAnalyticsView && (
                            <Link to="/leads/new" className="sm:hidden flex-shrink-0">
                                <Button size="icon" className="h-9 w-9 bg-primary text-primary-foreground shadow-lg shadow-primary/25 rounded-full">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </Link>
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
                                        initialPageSize={1000}
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
        </div>
    )
}
