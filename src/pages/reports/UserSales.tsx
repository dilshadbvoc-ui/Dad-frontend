import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserWiseSales } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../../components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function UserSalesPage() {
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) setUser(JSON.parse(userInfo));
    }, []);

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    // State
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    // Fetch Branches (for admins)
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches,
        enabled: !!isAdmin
    });

    // Fetch User Sales Data
    const { data: userStats, isLoading } = useQuery({
        queryKey: ['userSales', startDate, endDate, selectedBranchId],
        queryFn: () => getUserWiseSales({
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            branchId: selectedBranchId || undefined
        })
    });

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="User-wise Sales Report"
                description="Performance analysis of sales representatives."
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                {/* Date Range Picker (Native) */}
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-auto"
                    />
                </div>

                {isAdmin && branches && branches.length > 0 && (
                    <div className="w-[200px]">
                        <Select
                            value={selectedBranchId || "all"}
                            onValueChange={(val) => setSelectedBranchId(val === "all" ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Leaderboard Cards (Top 3) */}
            {userStats && userStats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {userStats.slice(0, 3).map((stat: any, index: number) => (
                        <Card key={stat.userId} className={cn("border-t-4", index === 0 ? "border-t-yellow-400" : index === 1 ? "border-t-gray-400" : "border-t-orange-400")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rank #{index + 1}</CardTitle>
                                <Trophy className={cn("h-4 w-4", index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : "text-orange-400")} />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-4 mt-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${stat.name}`} />
                                        <AvatarFallback>{stat.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-2xl font-bold">${stat.totalRevenue.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">{stat.name}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Full Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sales Rep</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead className="text-right">Deals Won</TableHead>
                                <TableHead className="text-right">Avg Deal Size</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : userStats && userStats.length > 0 ? (
                                userStats.map((stat: any) => (
                                    <TableRow key={stat.userId}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{stat.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{stat.name}</span>
                                                    <span className="text-xs text-muted-foreground">{stat.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            ${stat.totalRevenue.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">{stat.dealsCount}</TableCell>
                                        <TableCell className="text-right">${stat.avgDealSize.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No performance data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
