import { useQuery } from "@tanstack/react-query";
import { getLeads, type Lead } from "@/services/leadService";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, parseISO, isSameDay } from "date-fns"; // Standard imports, check availability
import { ArrowLeft, Loader2, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Formatting helpers
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
        return dateString;
    }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function LeadReportsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const viewType = searchParams.get('type') || 'all';

    const { data: leadsResponse, isLoading } = useQuery({
        queryKey: ['leads-report', 'all'], // Fetching all for client-side filtering for now
        queryFn: () => getLeads({ limit: 1000 }), // Fetch larger set for reports
    });

    const leads = (leadsResponse as any)?.leads || [];

    // --- Filter Logic ---
    const getFilteredLeads = () => {
        switch (viewType) {
            case 'today':
                return leads.filter((lead: Lead) => isSameDay(new Date(lead.createdAt), new Date()));
            case 'converted':
                return leads.filter((lead: Lead) => lead.status === 'converted');
            case 'lost':
                return leads.filter((lead: Lead) => lead.status === 'lost');
            // 'no-activity' is tricky without backend support, skipping specific filter for row-list, maybe showing all with 'Last Activity' column empty?
            // For now 'no-activity' -> simple placeholder logic: leads not updated in 30 days?
            // Let's stick to standard lists for others.
            default:
                return leads;
        }
    };

    const filteredLeads = getFilteredLeads();

    // --- Aggregation Logic for Charts ---
    const getLeadsByStatus = () => {
        const counts: Record<string, number> = {};
        leads.forEach((l: Lead) => {
            const s = l.status || 'unknown';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const getLeadsBySource = () => {
        const counts: Record<string, number> = {};
        leads.forEach((l: Lead) => {
            const s = l.source || 'unknown';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const getLeadsByOwner = () => {
        const counts: Record<string, number> = {};
        leads.forEach((l: Lead) => {
            const name = l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned';
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    // --- Render Content ---
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        }

        if (viewType === 'status') {
            const data = getLeadsByStatus();
            return (
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
                        <CardContent className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <LeadTable leads={leads} />
                </div>
            );
        }

        if (viewType === 'source') {
            const data = getLeadsBySource();
            return (
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
                        <CardContent className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#82ca9d" name="Leads" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <LeadTable leads={leads} />
                </div>
            );
        }

        if (viewType === 'ownership') {
            const data = getLeadsByOwner();
            return (
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Leads by Ownership</CardTitle></CardHeader>
                        <CardContent className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" name="Leads" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <LeadTable leads={leads} />
                </div>
            );
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        {viewType === 'today' ? "Today's Leads" :
                            viewType === 'converted' ? "Converted Leads" :
                                viewType === 'lost' ? "Lost Leads" :
                                    viewType === 'no-activity' ? "No Activity Leads" : "All Leads"}
                    </CardTitle>
                    <CardDescription>{filteredLeads.length} records found.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadTable leads={filteredLeads} />
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-8 space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Lead Reports</h1>
            </div>
            {renderContent()}
        </div>
    );
}

function LeadTable({ leads }: { leads: Lead[] }) {
    if (leads.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No leads found.</div>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {leads.map((lead) => (
                    <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.firstName} {lead.lastName}</TableCell>
                        <TableCell>{lead.company || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell>{lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '-'}</TableCell>
                        <TableCell>{formatDate(lead.createdAt)}</TableCell>
                        <TableCell className="text-right">{lead.leadScore}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
