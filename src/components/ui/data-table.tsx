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
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="font-semibold text-xs uppercase tracking-wider h-11 text-muted-foreground/80">
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
                                        <TableCell key={cell.id} className="py-3 font-medium text-sm">
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
                                    className="h-64 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                            <svg
                                                className="h-8 w-8 text-muted-foreground/50"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    vectorEffect="non-scaling-stroke"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-lg text-foreground">No data found</p>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                We couldn't find any records matching your criteria. Try adjusting your filters.
                                            </p>
                                        </div>
                                    </div>
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
