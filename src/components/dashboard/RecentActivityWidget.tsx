import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Activity } from "lucide-react"

export function RecentActivityWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            try {
                const res = await api.get('/audit-logs', { params: { limit: 10 } });
                // Log removed
                return res.data;
            } catch (error) {
                console.error('Error fetching recent activity:', error);
                return { logs: [] };
            }
        }
    });

    // Ensure logs is always an array and filter out invalid entries
    const logs = (Array.isArray(data?.logs) ? data.logs : []).filter((log: unknown) => log && typeof log === 'object');



    return (
        <Card className="col-span-3 rounded-3xl bg-card shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="h-[350px] pr-4">
                        <div className="space-y-4">
                            {logs.map((log: { id: string, actor?: { profileImage?: string, firstName?: string, lastName?: string }, action: string, entity: string, createdAt: string }) => (
                                <div key={log.id} className="flex items-start gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                                    <Avatar className="h-9 w-9 mt-0.5">
                                        <AvatarImage src={log.actor?.profileImage} />
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {log.actor?.firstName?.[0]}{log.actor?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="text-foreground">{log.actor?.firstName} {log.actor?.lastName}</span>
                                            <span className="text-muted-foreground font-normal"> {getHumanReadableAction(log.action)} </span>
                                            <span className="text-foreground font-medium">{log.entity}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-8">No recent activity</p>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

function getHumanReadableAction(action: string) {
    switch (action) {
        case 'LOGIN': return 'logged in to'
        case 'CREATE': return 'created new'
        case 'UPDATE': return 'updated'
        case 'DELETE': return 'deleted'
        default: return action.toLowerCase()
    }
}
