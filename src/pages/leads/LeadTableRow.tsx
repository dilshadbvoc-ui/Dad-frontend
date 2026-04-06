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
        <div
            data-state={row.getIsSelected() && "selected"}
            onDragOver={(e) => onDragOver?.(e, row.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, row)}
            className={cn(
                "flex w-full border-b border-border transition-colors hover:bg-muted/30 group data-[state=selected]:bg-yellow-200/50 dark:data-[state=selected]:bg-yellow-500/10 shrink-0",
                dragOverRowId === row.id && "bg-accent border-primary"
            )}
        >
            {row.getVisibleCells().map((cell) => {
                const width = cell.column.getSize();
                return (
                    <div 
                        key={cell.id} 
                        className="px-4 py-3 font-medium text-sm shrink-0 flex items-center overflow-hidden truncate"
                        style={{ width: `${width}px` }}
                    >
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                    </div>
                );
            })}
        </div>
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
