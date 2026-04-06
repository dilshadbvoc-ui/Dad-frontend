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
    getExpandedRowModel,
    type ExpandedState,
    type RowSelectionState,
    type Row,
} from "@tanstack/react-table"
import { useState, Fragment, useEffect, useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

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
    searchKeys?: string[] // Multiple search keys for hierarchical search
    onRowDrop?: (e: React.DragEvent, row: TData) => void
    mobileCardRender?: (row: TData) => React.ReactNode
    renderSubComponent?: (props: { row: any }) => React.ReactElement
    initialPageSize?: number
    pageSize?: number
    rowSelection?: RowSelectionState
    onRowSelectionChangeState?: (state: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
    isVirtual?: boolean
    virtualItemHeight?: number
    CustomRowComponent?: React.ComponentType<{
        row: Row<TData>;
        onDragOver?: (e: React.DragEvent, rowId: string) => void;
        onDragLeave?: () => void;
        onDrop?: (e: React.DragEvent, row: Row<TData>) => void;
        dragOverRowId?: string | null;
    }>
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchKeys,
    onRowDrop,
    mobileCardRender,
    renderSubComponent,
    initialPageSize,
    pageSize,
    onRowSelectionChangeState,
    rowSelection,
    isVirtual = false,
    virtualItemHeight = 53,
    CustomRowComponent,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})
    const [expanded, setExpanded] = useState<ExpandedState>({})
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null)
    const [globalFilter, setGlobalFilter] = useState("")

    const tableContainerRef = useRef<HTMLDivElement>(null)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: onRowSelectionChangeState || setInternalRowSelection,
        onExpandedChange: setExpanded,
        getExpandedRowModel: getExpandedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            // Custom global filter for hierarchical search
            const searchValue = String(filterValue).toLowerCase()
            const keysToSearch = searchKeys || (searchKey ? [searchKey] : [])

            return keysToSearch.some(key => {
                const value = row.getValue(key)
                if (value == null) return false
                return String(value).toLowerCase().includes(searchValue)
            })
        },
        getRowCanExpand: () => true,
        getRowId: (row: any) => row.id || row._id || row.uuid,
        initialState: {
            pagination: {
                pageSize: initialPageSize || 100,
            },
        },
        state: {
            sorting,
            columnFilters,
            rowSelection: rowSelection || internalRowSelection,
            globalFilter,
            expanded,
        },
    })

    // Update page size if prop changes
    useEffect(() => {
        if (pageSize !== undefined) {
            table.setPageSize(pageSize)
        }
    }, [pageSize, table])

    const { rows } = table.getRowModel()

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => virtualItemHeight,
        overscan: 10,
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

    const handleDrop = (e: React.DragEvent, row: Row<TData>) => {
        if (!onRowDrop) return
        e.preventDefault()
        setDragOverRowId(null)
        onRowDrop(e, row.original)
    }

    return (
        <div className="space-y-4">
            {(searchKey || searchKeys) && (
                <div className="flex items-center px-4 sm:px-0">
                    <Input
                        placeholder="Search..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
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
            <div 
                ref={tableContainerRef}
                className={cn(
                    "rounded-md border shadow-sm bg-card overflow-auto relative",
                    isVirtual ? "max-h-[600px]" : "w-full",
                    mobileCardRender ? "hidden lg:block" : "block"
                )}
            >
                <div className="min-w-full inline-block align-middle">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-muted/50 border-b border-border flex shrink-0 min-w-full">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <div key={headerGroup.id} className="flex flex-1 min-w-full items-center">
                                {headerGroup.headers.map((header) => {
                                    const width = header.column.getSize();
                                    return (
                                        <div 
                                            key={header.id} 
                                            className="font-semibold text-xs uppercase tracking-wider h-11 px-4 flex items-center text-muted-foreground/80 shrink-0"
                                            style={{ width: `${width}px` }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Body */}
                    <div 
                        className="relative min-w-full flex-1"
                        style={isVirtual ? { height: `${virtualizer.getTotalSize()}px` } : {}}
                    >
                        {rows?.length ? (
                            isVirtual ? (
                                virtualizer.getVirtualItems().map((virtualRow) => {
                                    const row = rows[virtualRow.index] as Row<TData>
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            className="absolute left-0 top-0 w-full flex border-b border-border transition-colors hover:bg-muted/30 group data-[state=selected]:bg-yellow-200/50 dark:data-[state=selected]:bg-yellow-500/10"
                                            data-state={row.getIsSelected() && "selected"}
                                            style={{
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            {CustomRowComponent ? (
                                                <CustomRowComponent
                                                    row={row}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    dragOverRowId={dragOverRowId}
                                                />
                                            ) : (
                                                row.getVisibleCells().map((cell) => {
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
                                                    )
                                                })
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <div
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "flex border-b border-border transition-colors hover:bg-muted/30 group data-[state=selected]:bg-yellow-200/50 dark:data-[state=selected]:bg-yellow-500/10",
                                                dragOverRowId === row.id && onRowDrop && 'bg-accent border-primary'
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
                                                )
                                            })}
                                        </div>
                                        {row.getIsExpanded() && renderSubComponent && (
                                            <div className="bg-muted/10 border-b border-border p-4">
                                                {renderSubComponent({ row })}
                                            </div>
                                        )}
                                    </Fragment>
                                ))
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 min-w-full">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
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
                                <div className="text-center">
                                    <p className="font-semibold text-lg text-foreground">No data found</p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        We couldn't find any records matching your criteria. Try adjusting your filters.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
