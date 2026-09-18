import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import { DataTable } from "@/components/ui/data-table"
import { columns, type EMISchedule } from "./columns"
import { EMIScheduleMobileCard } from "./EMIScheduleMobileCard"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { CreditCard, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatIST } from "@/lib/dateUtils"

type StatusTab = "active" | "completed" | "defaulted" | "all"

const TABS: { id: StatusTab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "defaulted", label: "Defaulted" },
  { id: "all", label: "All" },
]

export default function EMISchedulesPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("active")

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emi-schedules', activeTab],
    queryFn: async () => {
      const response = await api.get(`/emi-schedules?status=${activeTab}`)
      return response.data
    },
  })

  const schedules: EMISchedule[] = useMemo(() => data?.schedules || [], [data])

  const stats = useMemo(() => {
    const totalOutstanding = schedules.reduce((sum, s) => sum + s.remainingAmount, 0)
    const overdueCount = schedules.filter(s =>
      s.installments.some(i => i.status === 'overdue' || i.status === 'missed')
    ).length
    return [
      { label: "Schedules", value: schedules.length, sub: `${TABS.find(t => t.id === activeTab)?.label} EMIs`, accent: "bg-[hsl(var(--chart-5))]" },
      { label: "Outstanding", value: `₹${totalOutstanding.toLocaleString('en-IN')}`, sub: "Remaining across these", accent: "bg-[hsl(var(--chart-2))]" },
      { label: "Overdue", value: overdueCount, sub: "Schedules with a missed/overdue installment", accent: "bg-destructive" },
    ]
  }, [schedules, activeTab])

  const handleExport = () => {
    if (schedules.length === 0) return

    const excelData = schedules.map((s) => ({
      'Opportunity': s.opportunity?.name || '',
      'Total Amount': s.totalAmount,
      'Paid Amount': s.paidAmount,
      'Remaining': s.remainingAmount,
      'Status': s.status,
      'Installments Paid': `${s.installments.filter(i => i.status === 'paid').length}/${s.installments.length}`,
      'Start Date': s.startDate ? formatIST(s.startDate, 'yyyy-MM-dd') : '',
      'End Date': s.endDate ? formatIST(s.endDate, 'yyyy-MM-dd') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EMI Schedules')
    XLSX.writeFile(workbook, `emi_schedules_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-destructive">Error loading EMI schedules. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              EMI Schedules
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {schedules.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage payment installments and track EMI status
            </p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={schedules.length === 0}
          variant="outline"
          className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
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
              <span className="text-[11px] text-muted-foreground text-center">{tile.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex bg-muted/60 p-1 rounded-[10px] shrink-0 w-fit overflow-x-auto max-w-full">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-[8px] h-8 px-3 text-xs font-semibold transition-all shrink-0",
              activeTab === tab.id ? "bg-white text-[hsl(var(--chart-5))] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <CreditCard className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">No {activeTab !== 'all' ? activeTab : ''} EMI schedules</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            EMI schedules created from Closed Won deals will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {schedules.map((schedule) => (
              <EMIScheduleMobileCard key={schedule.id} schedule={schedule} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-[10px] border border-border bg-card overflow-hidden">
            <DataTable
              columns={columns}
              data={schedules}
              searchKeys={["opportunity_name", "status"]}
              resultsLabel="schedules"
            />
          </div>
        </>
      )}
    </div>
  )
}
