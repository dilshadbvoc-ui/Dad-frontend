import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  getHelperActivityLogs,
  getHelperActivityLogUsers,
} from "@/services/helperLogService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { ArrowLeft, PhoneCall, ShieldCheck, RadioTower } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getUserInfo, isSuperAdmin as checkIsSuperAdmin } from "@/lib/utils"

const LEVEL_STYLES: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  error: "bg-destructive/15 text-destructive",
}

// Every event string CallStateReceiver/CallLogReconciler/CallSyncWorker
// currently append to EngineDebugLog (Dad-call-recorder) — used only to
// give the raw event a readable label, new event names still render fine
// (falls back to the raw string).
const EVENT_LABELS: Record<string, string> = {
  CALL_RINGING: "Call ringing",
  CALL_ACTIVE: "Call connected",
  CALL_ENDED: "Call ended",
  CALL_LOG_RECONCILED: "Call log reconciled",
  BULK_SYNC_SUCCESS: "Synced to CRM",
  BULK_SYNC_FAILED: "Sync failed",
  BULK_SYNC_RATE_LIMITED: "Sync rate-limited",
  TIER0_MATCH_FOUND: "Native recording matched",
  TIER0_NO_MATCH: "Native recording not found",
}

// Polling, not a socket — near-real-time is enough for a diagnostics feed
// and there's no existing super-admin-panel precedent for wiring SocketContext
// into a page like this one.
const POLL_INTERVAL_MS = 10_000

export default function SuperAdminHelperLogsPage() {
  const navigate = useNavigate()
  const [user] = useState(() => getUserInfo())
  const hasAccess = checkIsSuperAdmin(user)

  const [userFilter, setUserFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  const { data: usersList = [] } = useQuery({
    queryKey: ["helper-logs", "users"],
    queryFn: getHelperActivityLogUsers,
    enabled: hasAccess,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["helper-logs", "list", userFilter, levelFilter, page],
    queryFn: () =>
      getHelperActivityLogs({
        userId: userFilter === "all" ? undefined : userFilter,
        level: levelFilter === "all" ? undefined : (levelFilter as "info" | "warn" | "error"),
        page,
        limit: 50,
      }),
    enabled: hasAccess,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const logs = data?.logs ?? []
  const pagination = data?.pagination

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldCheck className="h-14 w-14 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">
              Only the platform super admin can view helper logs.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <PhoneCall className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Helper Logs
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Call-fetching &amp; sync activity from the PypeCRM Helper app, across every organisation.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1) }}>
          <SelectTrigger className="w-64 h-9 rounded-full bg-background">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {usersList.map((u) => (
              <SelectItem key={u.userId} value={u.userId}>
                {u.user.firstName} {u.user.lastName} · {u.organisation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-background">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
          <RadioTower className={`h-3.5 w-3.5 ${isFetching ? "text-primary animate-pulse" : ""}`} />
          Refreshes every {POLL_INTERVAL_MS / 1000}s
        </span>

        {pagination && (
          <span className="text-xs text-muted-foreground">{pagination.total} event{pagination.total === 1 ? "" : "s"}</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Newest first — call detected, reconciled, and synced events from every device.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No helper activity yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.clientTimestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {log.user.firstName} {log.user.lastName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {log.organisation.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {EVENT_LABELS[log.event] || log.event}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {log.detail || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={LEVEL_STYLES[log.level] || LEVEL_STYLES.info}>{log.level}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
