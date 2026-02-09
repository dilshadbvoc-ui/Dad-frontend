import { useQuery } from '@tanstack/react-query';
import { getLeadSourceAnalytics } from '@/services/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureArray } from "@/hooks/useArrayData";

const COLORS = ['#34d399', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];

export function LeadSourcesWidget() {
    const { data: leadSourcesRaw, isLoading } = useQuery({
        queryKey: ['leadSources'],
        queryFn: getLeadSourceAnalytics
    });

    const leadSources = ensureArray<{ source: string; count: number }>(leadSourcesRaw);

    return (
        <Card className="col-span-3 min-w-0 overflow-hidden shadow-sm border-0 rounded-[2rem]">
            <CardHeader>
                <CardTitle className="text-xl text-foreground">Lead Sources</CardTitle>
                <CardDescription className="text-muted-foreground">Acquisition channel distribution.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full min-w-0 relative overflow-hidden">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <Skeleton className="h-[300px] w-[300px] rounded-full" />
                        </div>
                    ) : leadSources.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={leadSources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {leadSources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No lead source data available
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
