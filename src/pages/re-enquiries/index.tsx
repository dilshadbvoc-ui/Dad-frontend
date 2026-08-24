import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getReEnquiryLeads, type Lead } from "@/services/leadService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/shared/DateRangePicker"
import { RefreshCw, Search, Phone, Mail, Building2, Calendar, TrendingUp, ShieldAlert, X, ArrowUpDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { isManager, getUserInfo } from "@/lib/utils"

type SortOption = "recent" | "count_desc" | "name_asc"

export default function ReEnquiriesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [user] = useState(() => getUserInfo())
  const hasAccess = isManager(user)

  const [now] = useState(() => Date.now())

  // Check user role on mount
  useEffect(() => {
    if (!hasAccess && user !== undefined) {
      navigate('/dashboard')
    }
  }, [hasAccess, navigate, user])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['re-enquiry-leads'],
    queryFn: getReEnquiryLeads,
    enabled: hasAccess // Only fetch if user has access
  })

  const leads: Lead[] = useMemo(() => data?.leads || [], [data])

  const hasDateFilter = !!(startDate || endDate)
  const hasActiveFilters = !!searchTerm || hasDateFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStartDate("")
    setEndDate("")
  }

  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    const rangeStart = startDate ? new Date(`${startDate}T00:00:00`) : null
    const rangeEnd = endDate ? new Date(`${endDate}T23:59:59.999`) : null

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
      // "recent" - most recently re-enquired first
      const dateA = a.lastEnquiryDate ? new Date(a.lastEnquiryDate).getTime() : 0
      const dateB = b.lastEnquiryDate ? new Date(b.lastEnquiryDate).getTime() : 0
      return dateB - dateA
    })

    return sorted
  }, [leads, searchTerm, startDate, endDate, sortBy])

  // Show nothing while checking access
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">
              Only organisation admins and managers can access re-enquiry leads.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getReEnquiryBadgeColor = (count: number) => {
    if (count >= 5) return "destructive"
    if (count >= 3) return "secondary"
    return "default"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Re-Enquiries</h1>
          <p className="text-muted-foreground mt-1">
            Leads who have enquired multiple times - high interest prospects
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Re-Enquiries</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">Leads showing continued interest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => (l.reEnquiryCount || 0) >= 3).length}
            </div>
            <p className="text-xs text-muted-foreground">3+ enquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (24h)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => {
                if (!l.lastEnquiryDate) return false
                const diff = now - new Date(l.lastEnquiryDate).getTime()
                return diff < 24 * 60 * 60 * 1000
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search re-enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-full h-10"
          />
        </div>

        <div className="w-full sm:w-55">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onUpdate={(start, end) => { setStartDate(start); setEndDate(end) }}
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-45 h-10 rounded-full bg-background border-border/50 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="count_desc">Most Enquiries</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10 px-3 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        )}

        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">
            {filteredLeads.length} of {leads.length} leads
          </span>
        )}
      </div>

      {/* Re-Enquiry List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {hasActiveFilters ? "No matching re-enquiries found" : "No re-enquiries yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {hasActiveFilters ? "Try adjusting your search or date range" : "Re-enquiries will appear here when leads contact you again"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 rounded-full">
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {lead.firstName} {lead.lastName || ''}
                      </h3>
                      <Badge variant={getReEnquiryBadgeColor(lead.reEnquiryCount || 0)}>
                        {lead.reEnquiryCount || 0}x Re-Enquiry
                      </Badge>
                      {lead.lastEnquiryDate && (
                        <span className="text-sm text-muted-foreground">
                          Last: {formatDistanceToNow(new Date(lead.lastEnquiryDate), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phoneCountryCode || ''} {lead.phone}</span>
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{lead.company}</span>
                        </div>
                      )}
                      {lead.assignedTo && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Assigned to:</span>
                          <span>{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                        </div>
                      )}
                    </div>

                    {lead.country && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        📍 {lead.country}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/leads/${lead.id}`)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
