import { useQuery } from "@tanstack/react-query";
import { getCheckIns, type CheckIn } from "@/services/checkInService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Navigation } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FieldForceReportsPage() {
    const { data: checkIns, isLoading, isError } = useQuery<CheckIn[]>({
        queryKey: ['check-ins-report'],
        queryFn: () => getCheckIns(), // Fetch all check-ins (no filters) for overview
    });

    if (isLoading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
            <Skeleton className="h-96 w-full" />
        </div>;
    }

    if (isError) {
        return <div className="p-8 text-destructive">Failed to load field force data.</div>;
    }

    const totalCheckIns = checkIns?.length || 0;
    // Count unique users who checked in
    const activeAgents = new Set(checkIns?.map(c => c.userId)).size;

    // Recent check-ins
    const recentActivity = [...(checkIns || [])].slice(0, 15);

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Field Force Activity</h1>
                <p className="text-muted-foreground mt-2">Track agent visits, check-ins, and field operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Check-Ins</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCheckIns}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeAgents}</div>
                    </CardContent>
                </Card>
                {/* Placeholder for future metrics like Distance Traveled or Avg Visits/Day */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest field operations and visits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location/Entity</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentActivity.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No recent activity found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentActivity.map((checkIn) => (
                                    <TableRow key={checkIn.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{checkIn.user?.firstName?.[0]}{checkIn.user?.lastName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{checkIn.user?.firstName} {checkIn.user?.lastName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{checkIn.type.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {checkIn.lead && <span className="text-xs text-muted-foreground">Lead: {checkIn.lead.firstName} {checkIn.lead.lastName}</span>}
                                                {checkIn.contact && <span className="text-xs text-muted-foreground">Contact: {checkIn.contact.firstName} {checkIn.contact.lastName}</span>}
                                                {checkIn.account && <span className="text-xs text-muted-foreground">Account: {checkIn.account.name}</span>}
                                                <span className="text-sm">{checkIn.address || 'Unknown Location'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(checkIn.createdAt), 'MMM d, h:mm a')}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={checkIn.notes}>
                                            {checkIn.notes || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
