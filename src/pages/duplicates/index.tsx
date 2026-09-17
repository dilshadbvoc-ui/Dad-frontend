import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { getDuplicateLeads } from "@/services/leadService"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"
import {
  AlertTriangle,
  Search,
  Phone,
  Mail,
  RefreshCw,
  ShieldAlert,
  Filter,
  X,
  ArrowRight,
} from "lucide-react"
import { isAdmin, getUserInfo } from "@/lib/utils"

interface DuplicateGroup {
  phone?: string;
  email?: string;
  count: number;
  lead_ids: string[];
  names: string[];
  type: 'phone' | 'email';
}

type TypeFilter = "all" | "phone" | "email"

export default function DuplicatesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [user] = useState(() => getUserInfo())
  const hasAccess = isAdmin(user)

  useEffect(() => {
    if (user !== undefined) {
      if (!hasAccess) {
        navigate('/dashboard')
      }
    } else if (localStorage.getItem('userInfo') === null) {
      navigate('/login')
    }
  }, [navigate, hasAccess, user])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['duplicate-leads'],
    queryFn: getDuplicateLeads,
    enabled: hasAccess
  })

  const duplicates: DuplicateGroup[] = useMemo(() => data?.duplicates || [], [data])

  const hasActiveFilters = !!searchTerm || typeFilter !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
  }

  const filteredDuplicates = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return duplicates.filter(dup => {
      if (typeFilter !== "all" && dup.type !== typeFilter) return false
      if (!searchTerm) return true
      return (
        dup.phone?.toLowerCase().includes(searchLower) ||
        dup.email?.toLowerCase().includes(searchLower) ||
        dup.names.some(name => name.toLowerCase().includes(searchLower))
      )
    })
  }, [duplicates, searchTerm, typeFilter])

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-5">
        <div className="w-full max-w-sm rounded-[14px] border border-border bg-card p-8 flex flex-col items-center text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-bold font-poppins text-foreground mb-1.5">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Only organisation admins can access duplicate leads management.
          </p>
        </div>
      </div>
    )
  }

  const phoneCount = duplicates.filter(d => d.type === 'phone').length
  const emailCount = duplicates.filter(d => d.type === 'email').length

  const stats = [
    { label: "Duplicate Groups", value: duplicates.length, sub: "Groups with duplicate entries", accent: "bg-amber-500" },
    { label: "By Phone", value: phoneCount, sub: "Duplicate phone numbers", accent: "bg-[hsl(var(--chart-2))]" },
    { label: "By Email", value: emailCount, sub: "Duplicate email addresses", accent: "bg-[hsl(var(--chart-5))]" },
  ]

  return (
    <div className="flex flex-col gap-5 p-5 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              Duplicate Leads
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {duplicates.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Identify and manage duplicate lead entries in your system
            </p>
          </div>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium border-amber-500/20 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
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
              placeholder="Name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Type</label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
                <SelectItem value="phone" className="rounded-lg">Phone</SelectItem>
                <SelectItem value="email" className="rounded-lg">Email</SelectItem>
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
            Showing {filteredDuplicates.length} of {duplicates.length} groups
          </span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : filteredDuplicates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching duplicates found" : "No duplicates detected"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters ? "Try adjusting your search or filters." : "Your lead database is clean!"}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-amber-600 hover:bg-amber-500/10">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDuplicates.map((dup, index) => (
            <div
              key={index}
              className="relative rounded-[10px] border border-border bg-card overflow-hidden"
            >
              <span className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    {dup.type === 'phone' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {dup.type === 'phone' ? dup.phone : dup.email}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {dup.count} duplicate entries found
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive sm:ml-auto w-fit">
                  {dup.count} Duplicates
                </span>
              </div>

              <div className="flex flex-col divide-y divide-border">
                {dup.names.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/leads/${dup.lead_ids[idx]}`)}
                    className="group flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-amber-500/4 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate">{name}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground shrink-0 group-hover:text-amber-600">
                      View Lead
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>

              <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Action required:</strong> Review these leads and merge or delete duplicates to maintain data quality.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
