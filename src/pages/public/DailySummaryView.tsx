import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneCall, TrendingUp, Users, Wallet, ArrowRight, Loader2 } from "lucide-react"

interface DailySummaryData {
  organisationName: string
  dateLabel: string
  headline: {
    newLeads: number
    leadsClosed: number
    revenue: number
    totalCalls: number
    connectedCalls: number
  }
  perUser: {
    userName: string
    branch: string
    calls: number
    connected: number
    wonDeals: number
    revenue: number
  }[]
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export default function DailySummaryView() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<DailySummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    api.get(`/public/daily-summary/${token}`)
      .then((res) => setData(res.data))
      .catch(() => setError("This report link is invalid or has expired."))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-lg font-semibold text-foreground mb-2">Report not available</p>
            <p className="text-sm text-muted-foreground">{error || "Something went wrong loading this report."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeReps = data.perUser.filter(u => u.calls > 0 || u.wonDeals > 0).sort((a, b) => b.revenue - a.revenue)

  const stats = [
    { label: "Deals Won", value: data.headline.leadsClosed.toString(), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Revenue Today", value: formatCurrency(data.headline.revenue), icon: Wallet, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "New Leads", value: data.headline.newLeads.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Calls Made", value: `${data.headline.connectedCalls}/${data.headline.totalCalls}`, icon: PhoneCall, color: "text-purple-600", bg: "bg-purple-500/10", sub: "connected / total" },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-14 space-y-8">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">PYPE CRM</p>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">{data.organisationName}</h1>
          <p className="text-sm text-muted-foreground">Daily Business Summary — {data.dateLabel}</p>
        </div>

        {/* Headline stat cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 md:p-5">
                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-black text-foreground">{s.value}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{s.label}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top performers today */}
        {activeReps.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-5 md:p-6">
              <h2 className="text-sm font-bold text-foreground mb-4">Today's Activity by Rep</h2>
              <div className="space-y-3">
                {activeReps.slice(0, 8).map((u) => (
                  <div key={u.userName} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.branch} · {u.calls} calls, {u.connected} connected</p>
                    </div>
                    <div className="text-right shrink-0">
                      {u.wonDeals > 0 ? (
                        <>
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(u.revenue)}</p>
                          <p className="text-[11px] text-muted-foreground">{u.wonDeals} won</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No deals yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA into the CRM */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-foreground font-medium">
              Want the full picture — pipeline, follow-ups, and every lead in real time?
            </p>
            <Button className="rounded-xl gap-2" onClick={() => navigate('/login')}>
              Open Full Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground/60">
          This link is generated fresh each day and shared privately with your organisation.
        </p>
      </div>
    </div>
  )
}
