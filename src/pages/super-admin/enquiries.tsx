import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllEnquiries,
  convertEnquiry,
  rejectEnquiry,
  deleteEnquiry,
  type Enquiry,
} from "@/services/enquiryService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Mail,
  Building2,
  Phone,
  ShieldCheck,
  MailQuestion,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { getUserInfo, isSuperAdmin as checkIsSuperAdmin } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  converted: "bg-green-500/15 text-green-700 dark:text-green-300",
  rejected: "bg-muted text-muted-foreground",
}

export default function SuperAdminEnquiriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user] = useState(() => getUserInfo())
  const hasAccess = checkIsSuperAdmin(user)

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "converted" | "rejected">("pending")
  const [convertingEnquiry, setConvertingEnquiry] = useState<Enquiry | null>(null)
  const [password, setPassword] = useState("")
  const [convertError, setConvertError] = useState<{ message: string; errors?: string[] } | null>(null)

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries", "admin", "all"],
    queryFn: getAllEnquiries,
    enabled: hasAccess,
  })

  const filtered = statusFilter === "all" ? enquiries : enquiries.filter((e) => e.status === statusFilter)

  const convertMutation = useMutation({
    mutationFn: () => convertEnquiry(convertingEnquiry!.id, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries", "admin", "all"] })
      toast.success("Account created")
      setConvertingEnquiry(null)
      setPassword("")
      setConvertError(null)
    },
    onError: (err: unknown) => {
      const parsed = err as { response?: { data?: { message?: string; errors?: string[] } } }
      setConvertError({
        message: parsed.response?.data?.message || "Failed to create account",
        errors: parsed.response?.data?.errors,
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries", "admin", "all"] })
      toast.success("Enquiry rejected")
    },
    onError: () => toast.error("Failed to reject enquiry"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries", "admin", "all"] })
      toast.success("Enquiry deleted")
    },
    onError: (err: unknown) => {
      const parsed = err as { response?: { data?: { message?: string } } }
      toast.error(parsed.response?.data?.message || "Failed to delete enquiry")
    },
  })

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldCheck className="h-14 w-14 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">
              Only the platform super admin can view enquiries.
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
            <MailQuestion className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Enquiries
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Landing page "Enquire" submissions - review and convert into a real account.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["pending", "converted", "rejected", "all"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            className="rounded-full h-8 capitalize"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
        {!isLoading && (
          <span className="text-xs text-muted-foreground ml-1">
            {filtered.length} enquir{filtered.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enquiries</CardTitle>
          <CardDescription>Verify each one before creating an account for them.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MailQuestion className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No enquiries match this filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {enquiry.firstName} {enquiry.lastName || ""}
                      </p>
                      <Badge className={STATUS_STYLES[enquiry.status]}>{enquiry.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{enquiry.companyName}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{enquiry.email}</span>
                      {enquiry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{enquiry.phone}</span>}
                      <span>{formatDistanceToNow(new Date(enquiry.createdAt), { addSuffix: true })}</span>
                    </div>
                    {enquiry.message && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{enquiry.message}</p>
                    )}
                    {enquiry.status === "converted" && enquiry.convertedOrganisation && (
                      <button
                        type="button"
                        onClick={() => navigate(`/super-admin/organisation/${enquiry.convertedOrganisation!.id}`)}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        View organisation: {enquiry.convertedOrganisation.name}
                      </button>
                    )}
                  </div>
                  {enquiry.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setConvertingEnquiry(enquiry)
                          setPassword("")
                          setConvertError(null)
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Create Account
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => rejectMutation.mutate(enquiry.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this enquiry permanently?")) deleteMutation.mutate(enquiry.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!convertingEnquiry} onOpenChange={(open) => !open && setConvertingEnquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Creates a new organisation "{convertingEnquiry?.companyName}" with{" "}
              {convertingEnquiry?.firstName} {convertingEnquiry?.lastName || ""} as its admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="convert-password">Initial Password</Label>
              <Input
                id="convert-password"
                type="password"
                placeholder="At least 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Share this with the customer directly - they can change it after logging in.
              </p>
            </div>
            {convertError && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm space-y-1">
                <div>{convertError.message}</div>
                {convertError.errors?.map((msg) => (
                  <div key={msg} className="pl-3 text-xs">• {msg}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertingEnquiry(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending || password.length < 12}
            >
              {convertMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
