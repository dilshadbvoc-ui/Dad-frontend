import { useQuery } from "@tanstack/react-query"
import { type RowSelectionState } from "@tanstack/react-table"
import { useState, type ReactNode } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { LeadTableRow } from "./LeadTableRow"
import { type Lead } from "@/services/leadService"
import { LoadingCard } from "@/components/ui/loading-spinner"

interface LeadListPageProps {
  title: string
  description: string
  icon: ReactNode
  /** Unique react-query key for this list. */
  queryKey: string
  /** Fetches the full (large-page) lead list; same {leads,...} shape as GET /api/leads. */
  queryFn: () => Promise<{ leads: Lead[] }>
  emptyMessage: string
}

// Shared shell for the "needs attention" lead lists (Unattended, No Activity) —
// same table/columns as the main Leads page, minus the heavy filter bar, since
// these are already pre-filtered, single-purpose views.
export function LeadListPage({ title, description, icon, queryKey, queryFn, emptyMessage }: LeadListPageProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn,
  })

  const leads = data?.leads ?? []

  return (
    <div className="flex flex-col gap-6 h-full min-h-0 pt-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
            {title}
            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
              {leads.length.toLocaleString()}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full p-6">
          <LoadingCard text="Loading leads..." />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <p className="font-semibold text-lg text-foreground">All clear</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">{emptyMessage}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          searchKeys={["firstName", "lastName", "email", "phone", "company"]}
          searchPlaceholder="Search by name, phone, email..."
          resultsLabel="leads"
          initialPageSize={50}
          rowSelection={rowSelection}
          onRowSelectionChangeState={setRowSelection}
          isVirtual={true}
          virtualItemHeight={53}
          CustomRowComponent={LeadTableRow as any}
        />
      )}
    </div>
  )
}
