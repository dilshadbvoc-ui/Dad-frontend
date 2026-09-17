import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getAccounts, type Account } from "@/services/accountService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEntityTotalCount } from "@/hooks/useEntityTotalCount"
import { CreateAccountDialog } from "@/components/shared/CreateAccountDialog"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"
import { formatIST } from "@/lib/dateUtils"
import { useNavigate } from "react-router-dom"

import {
  Plus,
  Download,
  Search,
  Filter,
  X,
  Building2,
  Globe,
  ArrowRight,
} from "lucide-react"

type TypeFilter = "all" | "prospect" | "customer" | "partner" | "vendor"

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  prospect: "secondary",
  customer: "default",
  partner: "outline",
  vendor: "outline",
}

export default function AccountsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(),
    refetchInterval: 5000,
  })

  const accounts: Account[] = useMemo(() => data?.accounts || [], [data])
  const accountsTotalCount = useEntityTotalCount('accounts', '/accounts')

  const hasActiveFilters = !!searchTerm || typeFilter !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
  }

  const filteredAccounts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return accounts.filter(account => {
      if (typeFilter !== "all" && (account.type || '').toLowerCase() !== typeFilter) return false
      if (!searchTerm) return true
      return (
        account.name?.toLowerCase().includes(searchLower) ||
        account.industry?.toLowerCase().includes(searchLower) ||
        account.website?.toLowerCase().includes(searchLower) ||
        account.phone?.includes(searchTerm)
      )
    })
  }, [accounts, searchTerm, typeFilter])

  const customerCount = accounts.filter(a => (a.type || '').toLowerCase() === 'customer').length
  const prospectCount = accounts.filter(a => (a.type || '').toLowerCase() === 'prospect').length

  const stats = [
    { label: "Total Accounts", value: accounts.length, sub: "In your organisation", accent: "bg-[hsl(var(--chart-5))]" },
    { label: "Customers", value: customerCount, sub: "Active customer accounts", accent: "bg-[hsl(var(--chart-2))]" },
    { label: "Prospects", value: prospectCount, sub: "Not yet converted", accent: "bg-amber-500" },
  ]

  const handleExcelDownload = () => {
    if (filteredAccounts.length === 0) return

    const excelData = filteredAccounts.map((account) => ({
      'Name': account.name || '',
      'Industry': account.industry || '',
      'Type': account.type || '',
      'Website': account.website || '',
      'Phone': account.phone || '',
      'Owner': account.owner ? `${account.owner.firstName} ${account.owner.lastName}` : '',
      'City': account.address?.city || '',
      'Country': account.address?.country || '',
      'Created At': account.createdAt ? formatIST(account.createdAt, 'yyyy-MM-dd HH:mm:ss') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts')
    XLSX.writeFile(workbook, `accounts_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
        <div className="text-red-500 mb-4">Error loading accounts. Please try again.</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              Accounts
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {accounts.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your business accounts and customers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExcelDownload}
            disabled={filteredAccounts.length === 0}
            variant="outline"
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </Button>
        </div>
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
              placeholder="Name, industry, website, phone..."
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
                <SelectItem value="prospect" className="rounded-lg">Prospect</SelectItem>
                <SelectItem value="customer" className="rounded-lg">Customer</SelectItem>
                <SelectItem value="partner" className="rounded-lg">Partner</SelectItem>
                <SelectItem value="vendor" className="rounded-lg">Vendor</SelectItem>
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
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching accounts" : "No accounts yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters ? "Try adjusting your search or filters." : "Add your first business account to get started."}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4 h-9 rounded-[10px] gap-2 text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
              <Plus className="h-3.5 w-3.5" />
              Add Account
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {filteredAccounts.map((account) => (
              <Card
                key={account.id}
                onClick={() => navigate(`/accounts/${account.id}`)}
                className="cursor-pointer active:scale-[0.99] transition-transform"
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground truncate">{account.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{account.industry || 'No industry'}</p>
                    </div>
                    <Badge variant={TYPE_BADGE_VARIANT[(account.type || '').toLowerCase()] || 'outline'} className="capitalize shrink-0">
                      {account.type || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {account.website && (
                      <span className="flex items-center gap-1 min-w-0">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[160px]">{account.website}</span>
                      </span>
                    )}
                    {account.owner && (
                      <span>Owner: <span className="text-foreground/70 font-medium">{account.owner.firstName} {account.owner.lastName}</span></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {account.createdAt ? formatIST(account.createdAt, 'MMM d, yyyy') : ''}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-[10px] border border-border bg-card text-card-foreground overflow-hidden">
            <DataTable columns={columns} data={filteredAccounts} resultsLabel="accounts" totalCount={accountsTotalCount} />
          </div>
        </>
      )}

      <CreateAccountDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={(accountId) => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] })
          navigate(`/accounts/${accountId}`)
        }}
      />
    </div>
  )
}
