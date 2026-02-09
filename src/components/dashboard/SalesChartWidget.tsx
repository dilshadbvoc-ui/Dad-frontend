import { useQuery } from '@tanstack/react-query';
import { getSalesChartData } from '@/services/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureArray } from "@/hooks/useArrayData";

export function SalesChartWidget() {
    const { data: salesDataRaw, isLoading } = useQuery({
        queryKey: ['salesChart'],
        queryFn: getSalesChartData
    });

    const salesData = ensureArray<{ name: string; total?: number }>(salesDataRaw);

    return (
        <Card className="col-span-4 min-w-0 overflow-hidden shadow-sm border-0 rounded-[2rem]">
            <CardHeader>
                <CardTitle className="text-xl text-foreground">Sales Overview</CardTitle>
                <CardDescription className="text-muted-foreground">Revenue trend over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[350px] w-full min-w-0 relative overflow-hidden">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <Skeleton className="h-[300px] w-full" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: number | undefined) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#818cf8"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
