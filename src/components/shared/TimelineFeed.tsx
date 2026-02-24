import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { format } from 'date-fns';
import {
    Activity,
    PhoneCall,
    Mail,
    Calendar,
    CheckSquare,
    Shield,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TimelineFeedProps {
    type: 'lead' | 'contact' | 'account';
    id: string;
}

export default function TimelineFeed({ type, id }: TimelineFeedProps) {
    const { data: timeline, isLoading } = useQuery({
        queryKey: ['timeline', type, id],
        queryFn: async () => {
            const res = await api.get(`/timeline/${type}/${id}`);
            return res.data;
        }
    });

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!timeline || timeline.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
                <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                No activity history found.
            </div>
        );
    }

    const getIcon = (item: { type: string, subType?: string }) => {
        switch (item.type) {
            case 'interaction':
                return item.subType === 'call' ? <PhoneCall className="h-4 w-4" /> : <Mail className="h-4 w-4" />;
            case 'task':
                return <CheckSquare className="h-4 w-4" />;
            case 'event':
                return <Calendar className="h-4 w-4" />;
            case 'audit':
                return <Shield className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getColor = (item: { type: string }) => {
        switch (item.type) {
            case 'interaction': return 'bg-primary/10 text-primary ring-primary/20';
            case 'task': return 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/20';
            case 'event': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20';
            case 'audit': return 'bg-muted text-muted-foreground ring-border';
            default: return 'bg-muted text-muted-foreground ring-border';
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                    Activity Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6 border-l-2 border-border space-y-8">
                    {timeline.map((item: { id: string, type: string, title: string, description?: string, meta?: { direction?: string }, date: string, actor?: { firstName: string } }) => (
                        <div key={item.id} className="relative">
                            <div className={`absolute -left-[2.15rem] p-2 rounded-full ring-4 ring-background ${getColor(item)}`}>
                                {getIcon(item)}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                                        {item.description || 'No description'}
                                    </p>

                                    {/* Detailed Metadata rendering could go here */}
                                    {item.type === 'interaction' && item.meta?.direction && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground mt-2 inline-block">
                                            {item.meta.direction}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 sm:mt-0 text-xs text-muted-foreground whitespace-nowrap text-right">
                                    <div>{format(new Date(item.date), 'MMM d, h:mm a')}</div>
                                    {item.actor && (
                                        <div className="mt-0.5">by {item.actor.firstName}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
            <path d="M3 3v9h9" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}
