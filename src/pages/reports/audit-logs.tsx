import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AuditLogsReport() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [entity, setEntity] = useState("all");
    const [action, setAction] = useState("all");
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs-report", startDate, endDate, entity, action],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (entity && entity !== "all") params.append("entity", entity);
            if (action && action !== "all") params.append("action", action);
            params.append("limit", "1000");

            const response = await api.get(`/audit-logs?${params.toString()}`);
            return response.data;
        },
    });

    const downloadCSV = () => {
        if (!logs?.logs || logs.logs.length === 0) {
            toast.error("No data to download");
            return;
        }

        setIsDownloading(true);

        try {
            // CSV Headers
            const headers = ["Date & Time", "User", "Action", "Entity", "Entity ID", "Details"];
            
            // CSV Rows
            const rows = logs.logs.map((log: any) => {
                const date = format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss");
                const user = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System";
                const action = log.action || "";
                const entity = log.entity || "";
                const entityId = log.entityId || "";
                
                // Format details in a readable way
                let details = "";
                if (log.details) {
                    const d = log.details;
                    const parts: string[] = [];
                    
                    if (d.name) parts.push(`Name: ${d.name}`);
                    if (d.company) parts.push(`Company: ${d.company}`);
                    if (d.email) parts.push(`Email: ${d.email}`);
                    if (d.phone) parts.push(`Phone: ${d.phone}`);
                    if (d.status) parts.push(`Status: ${d.status}`);
                    if (d.stage) parts.push(`Stage: ${d.stage}`);
                    if (d.oldStage && d.newStage) parts.push(`Stage: ${d.oldStage} → ${d.newStage}`);
                    if (d.amount) parts.push(`Amount: ${d.amount}`);
                    if (d.title) parts.push(`Title: ${d.title}`);
                    if (d.role) parts.push(`Role: ${d.role}`);
                    if (d.planName) parts.push(`Plan: ${d.planName}`);
                    if (d.customPrice) parts.push(`Custom Price: ${d.customPrice}`);
                    
                    details = parts.length > 0 ? parts.join("; ") : JSON.stringify(d);
                }

                return [date, user, action, entity, entityId, `"${details.replace(/"/g, '""')}"`];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(","),
                ...rows.map((row: string[]) => row.join(","))
            ].join("\n");

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            
            link.setAttribute("href", url);
            link.setAttribute("download", `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`);
            link.style.visibility = "hidden";
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Audit logs downloaded successfully");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download audit logs");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs Report</h1>
                    <p className="text-muted-foreground mt-2">View and download system activity logs</p>
                </div>
                <Button onClick={downloadCSV} disabled={isDownloading || !logs?.logs?.length}>
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? "Downloading..." : "Download CSV"}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="entity">Entity Type</Label>
                            <Select value={entity} onValueChange={setEntity}>
                                <SelectTrigger id="entity">
                                    <SelectValue placeholder="All entities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All entities</SelectItem>
                                    <SelectItem value="Lead">Lead</SelectItem>
                                    <SelectItem value="User">User</SelectItem>
                                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                                    <SelectItem value="Quote">Quote</SelectItem>
                                    <SelectItem value="Task">Task</SelectItem>
                                    <SelectItem value="License">License</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="action">Action</Label>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger id="action">
                                    <SelectValue placeholder="All actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All actions</SelectItem>
                                    <SelectItem value="created">Created</SelectItem>
                                    <SelectItem value="updated">Updated</SelectItem>
                                    <SelectItem value="deleted">Deleted</SelectItem>
                                    <SelectItem value="logged in">Logged In</SelectItem>
                                    <SelectItem value="logged out">Logged Out</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Activity
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {logs?.logs?.length || 0} records
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : !logs?.logs || logs.logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium">Date & Time</th>
                                        <th className="text-left p-3 font-medium">User</th>
                                        <th className="text-left p-3 font-medium">Action</th>
                                        <th className="text-left p-3 font-medium">Entity</th>
                                        <th className="text-left p-3 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.logs.map((log: any) => {
                                        // Format details in a readable way
                                        let detailsText = "-";
                                        if (log.details) {
                                            const details = log.details;
                                            const parts: string[] = [];
                                            
                                            if (details.name) parts.push(`Name: ${details.name}`);
                                            if (details.company) parts.push(`Company: ${details.company}`);
                                            if (details.email) parts.push(`Email: ${details.email}`);
                                            if (details.phone) parts.push(`Phone: ${details.phone}`);
                                            if (details.status) parts.push(`Status: ${details.status}`);
                                            if (details.stage) parts.push(`Stage: ${details.stage}`);
                                            if (details.oldStage && details.newStage) parts.push(`Stage: ${details.oldStage} → ${details.newStage}`);
                                            if (details.amount) parts.push(`Amount: ${details.amount}`);
                                            if (details.title) parts.push(`Title: ${details.title}`);
                                            if (details.role) parts.push(`Role: ${details.role}`);
                                            if (details.planName) parts.push(`Plan: ${details.planName}`);
                                            if (details.customPrice) parts.push(`Custom Price: ${details.customPrice}`);
                                            
                                            detailsText = parts.length > 0 ? parts.join(", ") : JSON.stringify(details);
                                        }
                                        
                                        return (
                                            <tr key={log.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3 text-sm">
                                                    {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"}
                                                </td>
                                                <td className="p-3 text-sm capitalize">{log.action}</td>
                                                <td className="p-3 text-sm">{log.entity}</td>
                                                <td className="p-3 text-sm text-muted-foreground max-w-md">
                                                    <div className="line-clamp-2" title={detailsText}>
                                                        {detailsText}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
