import React, { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getTrashItems, restoreItem, permanentDelete } from "@/services/trashService"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { RefreshCw, Undo2, Trash2, LayoutGrid, Info } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TrashedItem {
    id: string;
    type: string;
    name: string;
    deletedAt: string;
}

export default function TrashPage() {
    const queryClient = useQueryClient();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: string } | null>(null);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['trash'],
        queryFn: getTrashItems,
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['trash'] });
    };

    const handleRestore = async (type: string, id: string) => {
        setIsActionLoading(true);
        try {
            await restoreItem(type, id);
            toast.success("Item restored successfully");
            handleRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to restore item");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        try {
            await permanentDelete(itemToDelete.type, itemToDelete.id);
            toast.success("Item permanently deleted");
            setItemToDelete(null);
            handleRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete item");
        } finally {
            setIsActionLoading(false);
        }
    };

    const columns: ColumnDef<TrashedItem>[] = [
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string;
                return (
                    <Badge variant="outline" className="capitalize">
                        {type}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "name",
            header: "Name/Title",
            cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>
        },
        {
            accessorKey: "deletedAt",
            header: "Deleted At",
            cell: ({ row }) => {
                const date = row.getValue("deletedAt") as string;
                return date ? format(new Date(date), "MMM d, yyyy HH:mm") : "-";
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-info hover:text-info hover:bg-info/10"
                            onClick={() => handleRestore(item.type, item.id)}
                            disabled={isActionLoading}
                        >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Restore
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setItemToDelete({ type: item.type, id: item.id })}
                            disabled={isActionLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Purge
                        </Button>
                    </div>
                );
            }
        }
    ];

    const trashItems = data || [];

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="flex flex-col space-y-6 min-w-0 px-2 sm:px-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                                Trash Folder
                                <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-bold border border-destructive/20">
                                    {trashItems.length}
                                    <span className="text-[10px] uppercase tracking-widest opacity-70">Items</span>
                                </div>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Items are automatically purged after 7 days
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isFetching}
                            className="h-11 w-11 p-0 rounded-xl border-dashed bg-background/50 backdrop-blur-sm"
                        >
                            <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
                        </Button>
                    </div>
                </div>

                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="font-bold">Data Retention Policy</AlertTitle>
                    <AlertDescription>
                        All items moved to the trash will be permanently deleted after 7 days. Once purged, data cannot be recovered.
                    </AlertDescription>
                </Alert>

                <Card className="border-none shadow-xl shadow-foreground/5 bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            Deleted Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={trashItems}
                        />
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={handlePermanentDelete}
                title="Permanent Deletion"
                description="Are you sure you want to permanently delete this item? This action cannot be undone."
                isDeleting={isActionLoading}
            />
        </div>
    );
}
