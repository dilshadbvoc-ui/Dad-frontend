"use client"

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    type SortingState,
    getSortedRowModel,
    type ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    onRowDrop?: (e: React.DragEvent, row: TData) => void
    mobileCardRender?: (row: TData) => React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    onRowDrop,
    mobileCardRender
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    const handleDragOver = (e: React.DragEvent, rowId: string) => {
        if (!onRowDrop) return
        e.preventDefault()
        setDragOverRowId(rowId)
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = () => {
        setDragOverRowId(null)
    }

    const handleDrop = (e: React.DragEvent, row: { original: TData }) => {
        if (!onRowDrop) return
        e.preventDefault()
        setDragOverRowId(null)
        onRowDrop(e, row.original)
    }

    return (
        <div className="space-y-4">
            {searchKey && (
                <div className="flex items-center px-4 sm:px-0">
                    <Input
                        placeholder="Search..."
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm h-10 shadow-sm"
                    />
                </div>
            )}

            {/* Mobile Card View (visible below lg) */}
            {mobileCardRender && (
                <div className="grid grid-cols-1 gap-4 lg:hidden px-4">
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <div key={row.id}>
                                {mobileCardRender(row.original)}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
                            No results found.
                        </div>
                    )}
                </div>
            )}

            {/* Desktop Table View (visible on lg and above, or always if no mobileCardRender) */}
            <div className={cn(
                "rounded-md border table-responsive-wrapper shadow-sm bg-card",
                mobileCardRender ? "hidden lg:block" : "block"
            )}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wider h-12">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onDragOver={(e) => handleDragOver(e, row.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, row)}
                                    className={cn(
                                        "transition-colors hover:bg-muted/30 group data-[state=selected]:bg-muted",
                                        dragOverRowId === row.id && onRowDrop && 'bg-accent border-primary'
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-0 py-2">
                <div className="text-xs text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 touch-safe"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 touch-safe"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
