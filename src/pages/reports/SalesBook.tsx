import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesBook } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../../components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";

export default function SalesBookPage() {
    const [user] = useState<{ role: string } | null>(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    });

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

    // Fetch Sales Data
    const { data: sales, isLoading } = useQuery({
        queryKey: ['salesBook', startDate, endDate, selectedBranchId],
        queryFn: () => getSalesBook({
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            branchId: selectedBranchId || undefined
        })
    });

    // CSV Export
    const handleExport = () => {
        if (!sales || sales.length === 0) return;

        const headers = ["Opportunity", "Customer", "Amount", "Close Date", "Owner"];
        const csvContent = [
            headers.join(","),
            ...sales.map((s: { opportunityName: string, customerName: string, amount: number, closeDate: string, ownerName: string }) => [
                `"${s.opportunityName}"`,
                `"${s.customerName}"`,
                s.amount,
                format(new Date(s.closeDate), "yyyy-MM-dd"),
                `"${s.ownerName}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_book_${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Sales Book"
                description="Detailed record of all closed sales."
                actions={
                    <Button variant="outline" onClick={handleExport} disabled={!sales || sales.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                }
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

                {/* Branch Selector (Admin Only) */}
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
                                {branches.map((b: { id: string, name: string }) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {sales ? `${sales.length} records found` : "Loading..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Opportunity</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : sales && sales.length > 0 ? (
                                sales.map((sale: { id: string, closeDate: string, opportunityName: string, customerName: string, ownerName: string, amount: number }) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{format(new Date(sale.closeDate), "MMM dd, yyyy")}</TableCell>
                                        <TableCell className="font-medium">{sale.opportunityName}</TableCell>
                                        <TableCell>{sale.customerName}</TableCell>
                                        <TableCell>{sale.ownerName}</TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            ${sale.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No sales found for the selected criteria.
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
