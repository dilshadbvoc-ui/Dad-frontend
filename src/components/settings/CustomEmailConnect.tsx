import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Unplug, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCustomEmailStatus, connectCustomEmail, disconnectCustomEmail } from "@/services/customEmailService"

// Presets matching Dad-backend's customEmailService.ts PROVIDER_PRESETS -
// only "custom" needs the user to know their own host/port (e.g. a private
// domain's mail server); the named providers just need an address + password
// (or app-password, for providers that require one instead of the account
// password directly).
const PROVIDERS = [
  { value: "zoho", label: "Zoho Mail" },
  { value: "gmail", label: "Gmail (app password)" },
  { value: "outlook", label: "Outlook / Microsoft 365" },
  { value: "yahoo", label: "Yahoo Mail" },
  { value: "custom", label: "Other (custom SMTP)" },
]

const PROVIDER_HINT: Record<string, string> = {
  zoho: "Use your Zoho Mail password, or an app-specific password if 2FA is enabled.",
  gmail: "Gmail requires an app password (Google Account → Security → App passwords) - your normal password won't work here.",
  outlook: "Use your Microsoft account password, or an app password if 2FA/Modern Auth requires one.",
  yahoo: "Yahoo requires an app password (Account Security → Generate app password).",
  custom: "Enter your mail provider's SMTP server details exactly as given by your provider/IT admin.",
}

export function CustomEmailConnect() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [provider, setProvider] = useState("zoho")
  const [email, setEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("587")

  const { data: status, isLoading } = useQuery({
    queryKey: ["custom-email-status"],
    queryFn: getCustomEmailStatus,
  })

  const connectMutation = useMutation({
    mutationFn: () =>
      connectCustomEmail({
        provider,
        email,
        fromName: fromName || undefined,
        username: username || email,
        password,
        host: provider === "custom" ? host : undefined,
        port: provider === "custom" ? Number(port) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-email-status"] })
      toast.success("Email account connected successfully")
      setShowForm(false)
      setPassword("")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to connect - check your credentials")
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectCustomEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-email-status"] })
      toast.success("Email account disconnected")
    },
    onError: () => toast.error("Failed to disconnect"),
  })

  if (isLoading) {
    return (
      <Card className="rounded-[10px]">
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isConnected = status?.connected

  return (
    <Card className={`rounded-[10px] ${isConnected ? "border-green-200 dark:border-green-800" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Other Email Provider</CardTitle>
              <CardDescription className="text-xs">
                Zoho, Outlook, Yahoo, or any custom domain mailbox
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-[8px] border border-green-100 dark:border-green-900/30">
              <Mail className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">{status.email}</span>
              {status.provider && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 capitalize">
                  {status.provider}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails sent from the CRM will be delivered from this address.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Unplug className="w-3.5 h-3.5" />
              )}
              Disconnect
            </Button>
          </div>
        ) : !showForm ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Not on Gmail? Connect any other mailbox — Zoho (like our own pypecrm.com), Outlook,
              Yahoo, or a custom domain — to send emails from the CRM using your own address.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/90 text-white"
            >
              <Mail className="w-4 h-4" />
              Connect Email Account
            </Button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              connectMutation.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="rounded-lg">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{PROVIDER_HINT[provider]}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (!username) setUsername(e.target.value) }}
                placeholder="you@pypecrm.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">From Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Name" className="h-9" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Password {provider !== "custom" && provider !== "zoho" ? "(app password)" : ""}</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-9"
              />
            </div>

            {provider === "custom" && (
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">SMTP Host</Label>
                  <Input required value={host} onChange={(e) => setHost(e.target.value)} placeholder="mail.yourdomain.com" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Port</Label>
                  <Input required value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" className="h-9" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={connectMutation.isPending}
                className="gap-2 bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/90 text-white"
              >
                {connectMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Test & Connect
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
