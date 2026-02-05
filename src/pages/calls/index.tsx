import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Search,
    Download,
    Trash2,
    Loader2,
    Clock,
    Mic,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCalls, getCallStats, deleteCallRecording, type Call, type CallFilters } from '@/services/callService';
import { CallRecordingPlayer } from '@/components/CallRecordingPlayer';
import { api } from '@/services/api';

export default function CallsPage() {
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<CallFilters>({
        page: 1,
        limit: 15,
        direction: 'all',
        status: 'all'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

    const { data: callsData, isLoading } = useQuery({
        queryKey: ['calls', filters, searchQuery],
        queryFn: () => getCalls({ ...filters, search: searchQuery || undefined })
    });

    const { data: stats } = useQuery({
        queryKey: ['callStats', period],
        queryFn: () => getCallStats(period)
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCallRecording,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calls'] });
            toast.success('Recording deleted');
        },
        onError: () => {
            toast.error('Failed to delete recording');
        }
    });

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleFilterChange = (key: keyof CallFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleDownload = async (recordingUrl: string) => {
        try {
            const filename = recordingUrl.split('/').pop();
            const response = await api.get(`/calls/recording/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'recording.webm';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download recording');
        }
    };

    const getDirectionIcon = (direction: string) => {
        return direction === 'inbound'
            ? <PhoneIncoming className="h-4 w-4 text-green-500" />
            : <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>;
            case 'missed':
                return <Badge variant="destructive">Missed</Badge>;
            case 'busy':
                return <Badge variant="secondary">Busy</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'initiated':
                return <Badge variant="outline">In Progress</Badge>;
            default:
                return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
        }
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '-';
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getContactName = (call: Call) => {
        if (call.lead) {
            return `${call.lead.firstName} ${call.lead.lastName}`;
        }
        if (call.contact) {
            return `${call.contact.firstName} ${call.contact.lastName}`;
        }
        return 'Unknown';
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Call Logs
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    View and manage all call recordings
                                </p>
                            </div>
                            <Link to="/settings/call-recording">
                                <Button variant="outline" size="sm">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Recording Settings
                                </Button>
                            </Link>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Total Calls
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                        {stats?.totalCalls ?? '-'}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        This {period}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Avg Duration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                                        {formatDuration(stats?.avgDuration)}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        minutes
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <PhoneMissed className="h-4 w-4" />
                                        Missed Calls
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                                        {stats?.missedCalls ?? '-'}
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        {stats?.totalCalls ? ((stats.missedCalls / stats.totalCalls) * 100).toFixed(0) : 0}% of total
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                        <Mic className="h-4 w-4" />
                                        Recordings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                        {stats?.callsWithRecording ?? '-'}
                                    </p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        calls with recordings
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Period Selector */}
                        <div className="flex gap-2">
                            {(['today', 'week', 'month'] as const).map((p) => (
                                <Button
                                    key={p}
                                    variant={period === p ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPeriod(p)}
                                >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Button>
                            ))}
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or phone..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                    <Select
                                        value={filters.direction}
                                        onValueChange={(v) => handleFilterChange('direction', v)}
                                    >
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Direction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Directions</SelectItem>
                                            <SelectItem value="inbound">Inbound</SelectItem>
                                            <SelectItem value="outbound">Outbound</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(v) => handleFilterChange('status', v)}
                                    >
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="missed">Missed</SelectItem>
                                            <SelectItem value="busy">Busy</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Call Log Table */}
                        <Card>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[180px]">Date & Time</TableHead>
                                                    <TableHead className="w-[60px]">Dir</TableHead>
                                                    <TableHead>Contact</TableHead>
                                                    <TableHead>Phone</TableHead>
                                                    <TableHead className="w-[80px]">Duration</TableHead>
                                                    <TableHead className="w-[100px]">Status</TableHead>
                                                    <TableHead>Recording</TableHead>
                                                    <TableHead className="w-[100px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {callsData?.calls.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                            No calls found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    callsData?.calls.map((call) => (
                                                        <TableRow key={call.id}>
                                                            <TableCell className="font-medium">
                                                                {format(new Date(call.date), 'MMM d, yyyy h:mm a')}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getDirectionIcon(call.direction)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">{getContactName(call)}</p>
                                                                    {call.createdBy && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            by {call.createdBy.firstName} {call.createdBy.lastName}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">
                                                                {call.phoneNumber || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDuration(call.duration)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(call.callStatus)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {call.recordingUrl ? (
                                                                    <CallRecordingPlayer
                                                                        recordingUrl={call.recordingUrl}
                                                                        duration={call.recordingDuration}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">No recording</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    {call.recordingUrl && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                onClick={() => handleDownload(call.recordingUrl!)}
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                                onClick={() => {
                                                                                    if (confirm('Delete this recording?')) {
                                                                                        deleteMutation.mutate(call.id);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        {callsData && callsData.pagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing {((callsData.pagination.page - 1) * callsData.pagination.limit) + 1} to{' '}
                                                    {Math.min(callsData.pagination.page * callsData.pagination.limit, callsData.pagination.total)} of{' '}
                                                    {callsData.pagination.total} calls
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={callsData.pagination.page === 1}
                                                        onClick={() => handlePageChange(callsData.pagination.page - 1)}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={callsData.pagination.page >= callsData.pagination.totalPages}
                                                        onClick={() => handlePageChange(callsData.pagination.page + 1)}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
