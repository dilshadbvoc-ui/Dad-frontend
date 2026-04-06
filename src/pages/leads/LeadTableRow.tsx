import React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { type Lead } from "@/services/leadService";

interface LeadTableRowProps {
    row: Row<Lead>;
    onDragOver?: (e: React.DragEvent, rowId: string) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent, row: Row<Lead>) => void;
    dragOverRowId?: string | null;
}

const LeadTableRowComponent = ({
    row,
    onDragOver,
    onDragLeave,
    onDrop,
    dragOverRowId
}: LeadTableRowProps) => {
    return (
        <tr
            data-state={row.getIsSelected() && "selected"}
            onDragOver={(e) => onDragOver?.(e, row.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, row)}
            className={cn(
                "transition-colors hover:bg-muted/30 group data-[state=selected]:bg-muted border-b border-border",
                dragOverRowId === row.id && "bg-accent border-primary"
            )}
        >
            {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 font-medium text-sm">
                    {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                    )}
                </td>
            ))}
        </tr>
    );
};

// Memoize to prevent re-renders unless the row's selection or data actually changes
export const LeadTableRow = React.memo(LeadTableRowComponent, (prev, next) => {
    return (
        prev.row.getIsSelected() === next.row.getIsSelected() &&
        prev.row.original === next.row.original &&
        prev.dragOverRowId === next.dragOverRowId
    );
});
