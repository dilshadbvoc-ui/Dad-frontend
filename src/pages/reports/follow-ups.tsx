import { useQuery } from "@tanstack/react-query";
import { getTasks, type Task } from "@/services/taskService";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isPast, isFuture, parseISO, isSameDay } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

// Helper
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
        return dateString;
    }
};

export default function FollowUpReportsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const viewType = searchParams.get('type') || 'all';

    const { data: tasksResponse, isLoading } = useQuery({
        queryKey: ['tasks-report', 'all'],
        queryFn: () => getTasks({ status: 'all' }), // Ensure we get all tasks
    });

    const tasks = (tasksResponse as any)?.tasks || [];

    // --- Filter Logic ---
    const getFilteredTasks = () => {
        // We are interested in "Follow Ups", which are generally Tasks.
        // If we need to distinguish "Interaction Follow-ups" vs "Task Follow-ups", 
        // usually in this system they are Tasks.

        switch (viewType) {
            case 'overdue':
                return tasks.filter((t: Task) =>
                    t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed'
                );
            case 'today':
                return tasks.filter((t: Task) =>
                    t.dueDate && isSameDay(new Date(t.dueDate), new Date())
                );
            case 'upcoming':
                return tasks.filter((t: Task) =>
                    t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
                );
            case 'all':
            default:
                return tasks;
        }
    };

    const filteredTasks = getFilteredTasks();

    return (
        <div className="p-8 space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Follow Up Reports</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {viewType === 'overdue' ? "Overdue Follow Ups" :
                            viewType === 'today' ? "Today's Follow Ups" :
                                viewType === 'upcoming' ? "Upcoming Follow Ups" : "All Follow Ups"}
                    </CardTitle>
                    <CardDescription>{filteredTasks.length} records found.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <FollowUpTable tasks={filteredTasks} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function FollowUpTable({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No follow ups found.</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.subject}</TableCell>
                        <TableCell>
                            {task.relatedTo ? (
                                <span className="text-sm">
                                    {task.onModel}: {task.relatedTo.firstName || task.relatedTo.name} {task.relatedTo.lastName || ''}
                                </span>
                            ) : '-'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>{task.status}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
