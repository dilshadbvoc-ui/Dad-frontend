import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { getReEnquiryLeads, type Lead } from "@/services/leadService"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeDropdown, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown"
import { NameCell } from "@/pages/leads/NameCell"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"
import {
  RefreshCw,
  Search,
  Phone,
  Mail,
  Building2,
  Repeat2,
  Clock3,
  ArrowUpDown,
  ArrowRight,
  X,
  ShieldAlert,
  MapPin,
} from "lucide-react"
import { isManager, getUserInfo } from "@/lib/utils"

type SortOption = "recent" | "count_desc" | "name_asc"

// Same three-tier urgency scale used everywhere else "needs attention" data is
// surfaced (LeadHealthAlerts) — amber for the general case, escalating to a
// stronger tone the more times someone has come back.
function urgencyClasses(count: number) {
  if (count >= 5) return { chip: "bg-destructive/10 text-destructive", bar: "bg-destructive" }
  if (count >= 3) return { chip: "bg-amber-500/10 text-amber-600", bar: "bg-amber-500" }
  return { chip: "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]", bar: "bg-[hsl(var(--chart-5))]" }
}

export default function ReEnquiriesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRangeValue>({ period: "allTime" })
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [user] = useState(() => getUserInfo())
  const hasAccess = isManager(user)

  const [now] = useState(() => Date.now())

  useEffect(() => {
    if (!hasAccess && user !== undefined) {
      navigate('/dashboard')
    }
  }, [hasAccess, navigate, user])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['re-enquiry-leads'],
    queryFn: getReEnquiryLeads,
    enabled: hasAccess
  })

  const leads: Lead[] = useMemo(() => data?.leads || [], [data])

  const hasDateFilter = dateRange.period !== "allTime" && !!dateRange.startDate
  const hasActiveFilters = !!searchTerm || hasDateFilter

  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ period: "allTime" })
  }

  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    const rangeStart = dateRange.startDate ? new Date(`${dateRange.startDate}T00:00:00`) : null
    const rangeEnd = dateRange.endDate ? new Date(`${dateRange.endDate}T23:59:59.999`) : null

    const result = leads.filter(lead => {
      const matchesSearch = !searchTerm || (
        (lead.firstName?.toLowerCase() || "").includes(searchLower) ||
        (lead.lastName?.toLowerCase() || "").includes(searchLower) ||
        (lead.email?.toLowerCase() || "").includes(searchLower) ||
        (lead.phone || "").includes(searchLower) ||
        (lead.company?.toLowerCase() || "").includes(searchLower)
      )
      if (!matchesSearch) return false

      if (rangeStart || rangeEnd) {
        if (!lead.lastEnquiryDate) return false
        const enquiryDate = new Date(lead.lastEnquiryDate)
        if (rangeStart && enquiryDate < rangeStart) return false
        if (rangeEnd && enquiryDate > rangeEnd) return false
      }

      return true
    })

    const sorted = [...result].sort((a, b) => {
      if (sortBy === "count_desc") {
        return (b.reEnquiryCount || 0) - (a.reEnquiryCount || 0)
      }
      if (sortBy === "name_asc") {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase()
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      }
      const dateA = a.lastEnquiryDate ? new Date(a.lastEnquiryDate).getTime() : 0
      const dateB = b.lastEnquiryDate ? new Date(b.lastEnquiryDate).getTime() : 0
      return dateB - dateA
    })

    return sorted
  }, [leads, searchTerm, dateRange, sortBy])

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-5">
        <div className="w-full max-w-sm rounded-[14px] border border-border bg-card p-8 flex flex-col items-center text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-bold font-poppins text-foreground mb-1.5">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Only organisation admins and managers can access re-enquiry leads.
          </p>
        </div>
      </div>
    )
  }

  const highPriorityCount = leads.filter(l => (l.reEnquiryCount || 0) >= 3).length
  const recent24hCount = leads.filter(l => {
    if (!l.lastEnquiryDate) return false
    return now - new Date(l.lastEnquiryDate).getTime() < 24 * 60 * 60 * 1000
  }).length

  const stats = [
    { label: "Total Re-Enquiries", value: leads.length, sub: "Leads showing continued interest", accent: "bg-[hsl(var(--chart-5))]" },
    { label: "High Priority", value: highPriorityCount, sub: "3+ enquiries", accent: "bg-amber-500" },
    { label: "Recent", value: recent24hCount, sub: "Last 24 hours", accent: "bg-[hsl(var(--chart-2))]" },
  ]

  return (
    <div className="flex flex-col gap-5 p-5 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Repeat2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              Re-Enquiries
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {leads.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Leads who have enquired multiple times — high interest prospects
            </p>
          </div>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10 hover:text-[hsl(var(--chart-5))]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="rounded-[10px] bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {stats.map((tile) => (
            <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
              <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
              <span className="text-xl sm:text-2xl font-medium font-poppins text-black">{tile.value}</span>
              <span className="text-[11px] text-muted-foreground">{tile.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <div className={FILTER_CARD_CLASS}>
          <Search className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Search</label>
            <input
              placeholder="Name, phone, email, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Clock3 className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Last Enquiry</label>
            <DateRangeDropdown
              value={dateRange}
              onChange={setDateRange}
              presets={['allTime', 'today', 'yesterday', 'week', 'thisMonth', 'lastMonth', 'custom']}
              variant="accent"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <ArrowUpDown className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Sorting</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="recent" className="rounded-lg">Most Recent</SelectItem>
                <SelectItem value="count_desc" className="rounded-lg">Most Enquiries</SelectItem>
                <SelectItem value="name_asc" className="rounded-lg">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3 -mt-1">
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-[10px] font-bold gap-1.5">
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {filteredLeads.length} of {leads.length} leads
          </span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Repeat2 className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching re-enquiries" : "No re-enquiries yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters ? "Try adjusting your search or date range." : "Re-enquiries will appear here when leads contact you again."}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredLeads.map((lead) => {
            const count = lead.reEnquiryCount || 0
            const urgency = urgencyClasses(count)
            return (
              <div
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-[10px] border border-border bg-card overflow-hidden px-4 py-3.5 cursor-pointer hover:border-[hsl(var(--chart-5))]/30 hover:bg-[hsl(var(--chart-5))]/[0.03] transition-colors"
              >
                <span className={`absolute top-0 left-0 bottom-0 w-1 ${urgency.bar}`} />

                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                  <NameCell lead={lead} />
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 flex-1 min-w-0 text-xs sm:text-sm text-muted-foreground">
                  {lead.email && (
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[180px]">{lead.email}</span>
                    </span>
                  )}
                  {lead.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {lead.phoneCountryCode || ''} {lead.phone}
                    </span>
                  )}
                  {lead.company && (
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[140px]">{lead.company}</span>
                    </span>
                  )}
                  {lead.country && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {lead.country}
                    </span>
                  )}
                  {lead.assignedTo && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="text-foreground/70 font-medium">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${urgency.chip}`}>
                    <Repeat2 className="h-3 w-3" />
                    {count}x
                  </span>
                  {lead.lastEnquiryDate && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
                      {formatDistanceToNow(new Date(lead.lastEnquiryDate), { addSuffix: true })}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-[hsl(var(--chart-5))] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
