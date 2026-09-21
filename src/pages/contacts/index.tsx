import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getContacts, type Contact } from "@/services/contactService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEntityTotalCount } from "@/hooks/useEntityTotalCount"
import { CreateContactDialog } from "@/components/shared/CreateContactDialog"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"
import { formatIST } from "@/lib/dateUtils"
import { useNavigate } from "react-router-dom"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Plus,
  Download,
  Search,
  Filter,
  X,
  Contact as ContactIcon,
  Building2,
  ArrowRight,
} from "lucide-react"

type AccountFilter = "all" | "linked" | "unlinked"

export default function ContactsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => getContacts(),
    refetchInterval: 5000,
  })

  const contacts: Contact[] = useMemo(
    () => (data?.contacts || []).filter((c: unknown) => c && typeof c === 'object'),
    [data]
  )
  const contactsTotalCount = useEntityTotalCount('contacts', '/contacts')

  const hasActiveFilters = !!searchTerm || accountFilter !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setAccountFilter("all")
  }

  const filteredContacts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return contacts.filter(contact => {
      if (accountFilter === "linked" && !contact.account) return false
      if (accountFilter === "unlinked" && contact.account) return false
      if (!searchTerm) return true
      const phoneMatch = (contact.phones || []).some(p => p.number?.includes(searchTerm))
      return (
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.jobTitle?.toLowerCase().includes(searchLower) ||
        phoneMatch
      )
    })
  }, [contacts, searchTerm, accountFilter])

  const linkedCount = contacts.filter(c => !!c.account).length
  const unassignedCount = contacts.filter(c => !c.owner).length

  const stats = [
    { label: "Total Contacts", value: contacts.length, sub: "In your organisation", accent: "bg-[hsl(var(--chart-5))]" },
    { label: "Linked to Account", value: linkedCount, sub: "Associated with a business", accent: "bg-[hsl(var(--chart-2))]" },
    { label: "Unassigned", value: unassignedCount, sub: "No owner yet", accent: "bg-amber-500" },
  ]

  const handleExcelDownload = () => {
    if (filteredContacts.length === 0) return

    const excelData = filteredContacts.map((contact) => ({
      'Name': `${contact.firstName} ${contact.lastName || ''}`.trim(),
      'Email': contact.email || '',
      'Phone': (contact.phones || []).map(p => p.number).join(', '),
      'Job Title': contact.jobTitle || '',
      'Department': contact.department || '',
      'Account': contact.account?.name || '',
      'Owner': contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : '',
      'Created At': contact.createdAt ? formatIST(contact.createdAt, 'yyyy-MM-dd HH:mm:ss') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
    XLSX.writeFile(workbook, `contacts_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
        <div className="text-red-500 mb-4">Error loading contacts. Please try again.</div>
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
            <ContactIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              Contacts
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {contacts.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your contacts and people
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExcelDownload}
            disabled={filteredContacts.length === 0}
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
            Add Contact
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
              placeholder="Name, email, phone, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Account</label>
            <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v as AccountFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Contacts</SelectItem>
                <SelectItem value="linked" className="rounded-lg">Linked to Account</SelectItem>
                <SelectItem value="unlinked" className="rounded-lg">No Account</SelectItem>
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
            Showing {filteredContacts.length} of {contacts.length} contacts
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <ContactIcon className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching contacts" : "No contacts yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters ? "Try adjusting your search or filters." : "Add your first contact to get started."}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4 h-9 rounded-[10px] gap-2 text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="cursor-pointer active:scale-[0.99] transition-transform"
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground truncate">{contact.firstName} {contact.lastName}</h4>
                      <p className="text-xs text-muted-foreground truncate">{contact.jobTitle || 'No title'}</p>
                    </div>
                    {contact.account && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{contact.account.name}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {contact.email && <span className="truncate">{contact.email}</span>}
                    {contact.owner && (
                      <span>Owner: <span className="text-foreground/70 font-medium">{contact.owner.firstName} {contact.owner.lastName}</span></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {contact.createdAt ? formatIST(contact.createdAt, 'MMM d, yyyy') : ''}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-[10px] border border-border bg-card text-card-foreground overflow-hidden">
            <DataTable columns={columns} data={filteredContacts} searchKeys={["firstName", "lastName", "email", "jobTitle"]} resultsLabel="contacts" totalCount={contactsTotalCount} />
          </div>
        </>
      )}

      <CreateContactDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={(contactId) => {
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
          navigate(`/contacts/${contactId}`)
        }}
      />
    </div>
  )
}
