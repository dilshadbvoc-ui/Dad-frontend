
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getLeads, type Lead } from "@/services/leadService"
import { getTasks, type Task } from "@/services/taskService"
import { EnvironmentWarning } from "@/components/shared/EnvironmentWarning"

import { Button } from "@/components/ui/button"
import { Link, useSearchParams } from "react-router-dom"
import {
    Plus,
    Phone,
    CalendarCheck
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

// --- Sidebar Item Component ---
const SidebarItem = ({ view, label, count, currentView, handleViewChange }: { view: string, label: string, count?: number, currentView: string, handleViewChange: (view: string) => void }) => (
    <button
        onClick={() => handleViewChange(view)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === view
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
    >
        <span>{label}</span>
        {count !== undefined && (
            <span className="text-xs bg-background border border-border px-1.5 py-0.5 rounded-md shadow-sm">
                {count}
            </span>
        )}
    </button>
);


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
                {tasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.subject}</TableCell>
                        <TableCell>
                            {task.relatedTo ? `${task.onModel}: ${task.relatedTo.firstName || task.relatedTo.name}` : '-'}
                        </TableCell>
                        <TableCell><Badge variant={task.status === 'completed' ? 'default' : 'outline'}>{task.status}</Badge></TableCell>
                        <TableCell>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell>{task.assignedTo?.firstName} {task.assignedTo?.lastName}</TableCell>
                    </TableRow>
                ))}
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


export default function LeadsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    // Default view is 'all-leads' if not specified
    const currentView = searchParams.get('view') || 'all-leads';




    // --- Data Fetching ---
    // 1. Leads
    const { data: leadData, isLoading: leadsLoading } = useQuery({
        queryKey: ['leads', 'all'], // Fetch all for sorting/filtering client side for report views
        queryFn: () => getLeads({ pageSize: 1000 }),
    });

    // 2. Tasks (Follow Ups)
    const { data: taskData, isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => getTasks({ status: 'all' }),
    });

    const leads = (leadData?.leads || []).filter((l: Lead) => l && typeof l === 'object');
    const tasks = (taskData?.tasks || []).filter((t: Task) => t && typeof t === 'object');


    // --- View Logic ---
    const getDisplayData = () => {
        switch (currentView) {
            // Leads Views
            case 'all-leads':
                return leads; // Apply table filters normally
            case 'today-leads':
                return leads.filter((l: Lead) => isSameDay(new Date(l.createdAt), new Date()));
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
                return tasks.filter((t: Task) => t.dueDate && isSameDay(new Date(t.dueDate), new Date()));
            case 'upcoming-followups':
                return tasks.filter((t: Task) => t.dueDate && isFuture(new Date(t.dueDate)));

            default:
                return leads;
        }
    };

    const displayData = getDisplayData();
    const isTaskView = currentView.includes('followup');
    const isChartView = ['leads-by-status', 'leads-by-source', 'leads-by-ownership'].includes(currentView);

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
        setSearchParams({ view });
    };

    const isLoading = leadsLoading || tasksLoading;





    const isAnalyticsView = currentView === 'leads-analytics';

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-6 overflow-y-auto pr-2 pb-10">
                <div>
                    <div className="flex items-center gap-2 mb-2 px-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">Leads</h3>
                    </div>
                    <div className="space-y-1">
                        <SidebarItem view="all-leads" label="All Leads" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="no-activity-leads" label="No Activity Leads" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="today-leads" label="Today's Leads" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="leads-by-status" label="Leads by Status" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="leads-by-source" label="Leads by Source" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="leads-by-ownership" label="Leads by Ownership" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="converted-leads" label="Converted Leads" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="lost-leads" label="Lost Leads" currentView={currentView} handleViewChange={handleViewChange} />
                    </div>
                </div>



                <div>
                    <div className="flex items-center gap-2 mb-2 px-2">
                        <CalendarCheck className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">Follow Ups</h3>
                    </div>
                    <div className="space-y-1">
                        <SidebarItem view="overdue-followups" label="Overdue Follow Ups" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="today-followups" label="Today's Follow Ups" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="upcoming-followups" label="Upcoming Follow Ups" currentView={currentView} handleViewChange={handleViewChange} />
                        <SidebarItem view="all-followups" label="All Follow Ups" currentView={currentView} handleViewChange={handleViewChange} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col space-y-6">

                {/* Environment Warning */}
                <EnvironmentWarning />

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground capitalize">
                            {currentView.replace(/-/g, ' ')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isTaskView ? 'Manage your follow-up tasks' : isAnalyticsView ? 'Visualize lead performance' : 'Track and manage your leads'}
                        </p>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Select value={currentView} onValueChange={handleViewChange}>
                            <SelectTrigger className="w-[200px]">
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

                        {!isTaskView && !isChartView && !isAnalyticsView && (
                            <Link to="/leads/new">
                                <Button size="sm" className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Lead
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-card rounded-xl border shadow-sm p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <p className="text-sm text-muted-foreground">Loading data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isChartView ? (
                                <div className="p-6">
                                    <Card>
                                        <CardHeader><CardTitle className="capitalize">{currentView.replace(/-/g, ' ')}</CardTitle></CardHeader>
                                        <CardContent>
                                            {currentView === 'leads-by-status' && <StatusPieChart data={getChartData()} />}
                                            {currentView !== 'leads-by-status' && <VerticalBarChart data={getChartData()} />}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : isTaskView ? (
                                <div className="p-4">
                                    <TaskTable tasks={displayData as Task[]} />
                                </div>
                            ) : (
                                <div className="p-0">
                                    {/* Use existing DataTable for leads */}
                                    <DataTable columns={columns} data={displayData as Lead[]} searchKey="email" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
