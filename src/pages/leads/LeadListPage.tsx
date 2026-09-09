import { useQuery } from "@tanstack/react-query"
import { type RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { Building, Users, Globe, ArrowUpDown, LayoutGrid, X, GitBranch, CalendarRange } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { columns } from "./columns"
import { LeadTableRow } from "./LeadTableRow"
import { type Lead } from "@/services/leadService"
import { getBranches } from "@/services/settingsService"
import { getUsers } from "@/services/userService"
import { getLeadSourceAnalytics } from "@/services/analyticsService"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { DateRangeDropdown, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "./filterStyles"

interface LeadListResponse {
  leads: Lead[]
  total?: number
}

export interface LeadListQueryParams {
  branchId?: string
  startDate?: string
  endDate?: string
  assignedTo?: string
  source?: string
  status?: string
}

interface LeadListPageProps {
  title: string
  description: string
  icon: ReactNode
  /** Unique react-query key for this list. */
  queryKey: string
  /** Fetches the (large-page) lead list; same {leads, total, ...} shape as GET /api/leads. */
  queryFn: (params: LeadListQueryParams) => Promise<LeadListResponse>
  emptyMessage: string
  /** Show the Pipeline Stage filter — only meaningful on views that span more than one status. */
  showStageFilter?: boolean
}

const formatSourceLabel = (src: string) => {
  if (!src) return 'Unknown'
  if (src === 'meta_leadgen') return 'Meta Ads'
  if (src === 'meta_ads') return 'Meta Ads (Custom)'
  if (src === 'google_ads') return 'Google Ads'
  if (src === 'facebook_payload') return 'Facebook Lead'
  if (src === 'lead_squared') return 'LeadSquared'
  return src.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const FETCH_CAP = 2000

// Shared shell for the "needs attention" lead lists (Unattended, No Activity) — same
// table/columns as the main Leads page, plus the same filter-bar look (branch, owner,
// source, date range, sort, page size), synced to URL params so links from the
// Dashboard (which carry branch/date range) land pre-filtered here too.
export function LeadListPage({ title, description, icon, queryKey, queryFn, emptyMessage, showStageFilter }: LeadListPageProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [searchParams, setSearchParams] = useSearchParams()
  const { statuses } = useLeadStatuses()

  const branchId = searchParams.get('branchId') || 'all'
  const assignedTo = searchParams.get('assignedTo') || 'all'
  const source = searchParams.get('source') || 'all'
  const status = searchParams.get('status') || 'all'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const sort = searchParams.get('sort') || 'default'
  const pageSize = searchParams.get('pageSize') || '50'

  const dateRange: DateRangeValue = startDate && endDate
    ? { period: 'custom', startDate, endDate }
    : { period: 'allTime' }

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const hasActiveFilters = branchId !== 'all' || assignedTo !== 'all' || source !== 'all' || status !== 'all' || !!startDate || !!endDate

  const resetFilters = () => setSearchParams(new URLSearchParams())

  const { data: branches = [] } = useQuery({ queryKey: ['branches', 'list'], queryFn: getBranches, staleTime: 5 * 60 * 1000 })
  const { data: userData } = useQuery({ queryKey: ['users', 'list'], queryFn: () => getUsers(), staleTime: 5 * 60 * 1000 })
  const users = (userData?.users || (Array.isArray(userData) ? userData : [])).filter((u: any) => u.isActive !== false)
  const { data: sourceStats = [] } = useQuery({ queryKey: ['lead-sources'], queryFn: () => getLeadSourceAnalytics() })

  const queryParams: LeadListQueryParams = {
    branchId: branchId !== 'all' ? branchId : undefined,
    assignedTo: assignedTo !== 'all' ? assignedTo : undefined,
    source: source !== 'all' ? source : undefined,
    status: showStageFilter && status !== 'all' ? status : undefined,
    startDate,
    endDate,
  }

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, branchId, assignedTo, source, status, startDate, endDate],
    queryFn: () => queryFn(queryParams),
  })

  const fetchedLeads = data?.leads ?? []
  // Use the server-reported total, not leads.length — the fetch is capped (see FETCH_CAP)
  // so leads.length would silently under-report once a list grows past the cap.
  const total = data?.total ?? fetchedLeads.length

  const leads = useMemo(() => {
    const list = [...fetchedLeads]
    switch (sort) {
      case 'newest': return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest': return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'name-asc': return list.sort((a, b) => `${a.firstName} ${a.lastName || ''}`.localeCompare(`${b.firstName} ${b.lastName || ''}`))
      default: return list // server default order (most urgent first)
    }
  }, [fetchedLeads, sort])

  const effectivePageSize = pageSize === 'all' ? Math.max(leads.length, 1) : parseInt(pageSize, 10)

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 pt-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
            {title}
            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
              {total.toLocaleString()}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
          {total > leads.length && (
            <p className="text-xs text-amber-600 mt-1">
              Showing the first {leads.length.toLocaleString()} of {total.toLocaleString()} — narrow this down with the filters below to see the rest.
            </p>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${showStageFilter ? "lg:grid-cols-7" : "lg:grid-cols-6"}`}>
        <div className={FILTER_CARD_CLASS}>
          <Building className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Branch</label>
            <Select value={branchId} onValueChange={(v) => updateParam('branchId', v)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg font-medium italic">All Locations</SelectItem>
                {branches.map((b: any) => (
                  <SelectItem key={b.id} value={b.id} className="rounded-lg">{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Users className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Assigned To</label>
            <Select value={assignedTo} onValueChange={(v) => updateParam('assignedTo', v)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Owners" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg font-medium italic">General Pool (All)</SelectItem>
                <SelectGroup>
                  {users
                    .filter((u: any) => branchId === 'all' || u.branchId === branchId)
                    .map((u: any) => (
                      <SelectItem key={u.id} value={u.id} className="rounded-lg">{u.firstName} {u.lastName || ''}</SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Globe className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Source</label>
            <Select value={source} onValueChange={(v) => updateParam('source', v)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg italic">All Sources</SelectItem>
                {sourceStats.map((stat: any) => (
                  <SelectItem key={stat.source} value={stat.source} className="rounded-lg">
                    {formatSourceLabel(stat.source)} ({stat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showStageFilter && (
          <div className={FILTER_CARD_CLASS}>
            <GitBranch className={FILTER_ICON_CLASS} />
            <div className="min-w-0 flex-1">
              <label className={FILTER_LABEL_CLASS}>Pipeline Stage</label>
              <Select value={status} onValueChange={(v) => updateParam('status', v)}>
                <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Stages" /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl border-border/50">
                  <SelectItem value="all" className="rounded-lg font-medium italic">All Stages</SelectItem>
                  {statuses.filter(s => s.id !== 'converted' && s.id !== 'lost').map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className={FILTER_CARD_CLASS}>
          <CalendarRange className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Date Range</label>
            <DateRangeDropdown
              value={dateRange}
              onChange={(v) => {
                const next = new URLSearchParams(searchParams)
                if (v.period === 'allTime' || !v.startDate || !v.endDate) {
                  next.delete('startDate')
                  next.delete('endDate')
                } else {
                  next.set('startDate', v.startDate)
                  next.set('endDate', v.endDate)
                }
                setSearchParams(next)
              }}
              presets={['allTime', 'today', 'yesterday', 'week', 'thisMonth', 'lastMonth', 'custom']}
              variant="accent"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <ArrowUpDown className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Sorting</label>
            <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="default" className="rounded-lg">Most Urgent First</SelectItem>
                <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
                <SelectItem value="oldest" className="rounded-lg">Oldest First</SelectItem>
                <SelectItem value="name-asc" className="rounded-lg">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <LayoutGrid className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Show</label>
            <Select value={pageSize} onValueChange={(v) => updateParam('pageSize', v)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="20" className="rounded-lg">20 Per Page</SelectItem>
                <SelectItem value="50" className="rounded-lg">50 Per Page</SelectItem>
                <SelectItem value="100" className="rounded-lg">100 Per Page</SelectItem>
                <SelectItem value="all" className="rounded-lg">Show All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div>
          <Button variant="ghost" onClick={resetFilters} className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-[10px] font-bold gap-1.5">
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        </div>
      )}

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
          initialPageSize={effectivePageSize}
          pageSize={effectivePageSize}
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

export { FETCH_CAP }
