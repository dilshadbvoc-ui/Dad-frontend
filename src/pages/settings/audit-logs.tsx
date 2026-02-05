import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from "lucide-react";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>('all');

    // Fetch logs
    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', page, actionFilter],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (actionFilter !== 'all') params.action = actionFilter;

            const res = await api.get('/audit-logs', { params });
            return res.data;
        }
    });

    const logs = data?.logs || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track system activity and data changes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="LOGIN">Login</SelectItem>
                            <SelectItem value="CREATE">Create</SelectItem>
                            <SelectItem value="UPDATE">Update</SelectItem>
                            <SelectItem value="DELETE">Delete</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Actor</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>IP Address</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No logs found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log: { id: string, createdAt: string, actor?: { firstName: string, lastName: string }, action: string, entity: string, entityId?: string, details: Record<string, unknown>, ipAddress?: string }) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                                                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.entity} <span className="text-xs text-muted-foreground">({log.entityId?.substring(0, 8)}...)</span>
                                                    </TableCell>
                                                    <TableCell className="max-w-[300px] truncate text-xs font-mono">
                                                        {JSON.stringify(log.details)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {log.ipAddress || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {pagination?.pages || 1}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= (pagination?.pages || 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
