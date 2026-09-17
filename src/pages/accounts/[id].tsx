import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Building2, Globe, MapPin, Pencil, User, Plus, Phone, ArrowRight, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { EditAccountDialog } from "@/components/shared/EditAccountDialog"
import { UpsellDialog } from "@/components/UpsellDialog"
import { CreateOpportunityDialog } from "@/components/CreateOpportunityDialog"
import { formatIST } from "@/lib/dateUtils"

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  prospect: "secondary",
  customer: "default",
  partner: "outline",
  vendor: "outline",
}

export default function AccountDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false)
  const [isUpsellOpen, setIsUpsellOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => (await api.get(`/accounts/${id}`)).data,
    enabled: !!id && id !== 'new' && id !== 'undefined'
  })

  if (id === 'undefined') return <div className="p-8">Invalid Account ID. Please go back and try again.</div>
  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <Skeleton className="h-12 w-1/3 rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    )
  }
  if (!account) return <div className="p-8">Account not found</div>

  const totalPurchase = (account.accountProducts || []).reduce((acc: number, curr: { price: number; quantity: number }) => acc + (curr.price * curr.quantity), 0)

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-[10px] shrink-0" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5 flex-wrap">
              <span className="truncate">{account.name}</span>
              <Badge variant={TYPE_BADGE_VARIANT[(account.type || '').toLowerCase()] || 'outline'} className="capitalize">
                {account.type || 'Customer'}
              </Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {account.industry || 'No industry'}
              </span>
              {account.website && (
                <a
                  href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:underline hover:text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" /> {account.website}
                </a>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium shrink-0"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="rounded-[10px] border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Details</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Address</p>
                  {account.address?.street || account.address?.city || account.address?.country ? (
                    <p className="text-sm text-muted-foreground">
                      {account.address?.street}{account.address?.street && <br />}
                      {[account.address?.city, account.address?.state, account.address?.zipCode].filter(Boolean).join(', ')}
                      {account.address?.city || account.address?.state ? <br /> : null}
                      {account.address?.country}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </div>
              </div>
              {account.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${account.phone}`} className="text-sm text-foreground hover:underline">{account.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  Owner: {account.owner ? `${account.owner.firstName} ${account.owner.lastName}` : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="rounded-[10px] border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Contacts</h2>
            </div>
            {account.contacts && account.contacts.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {account.contacts.map((contact: { id: string; firstName: string; lastName: string; email: string }) => (
                  <button
                    key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    className="group flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--chart-5))]/[0.04] transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground truncate">{contact.firstName} {contact.lastName}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{contact.email}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground px-4 py-6 text-center">No contacts associated.</p>
            )}
          </div>

          <div className="rounded-[10px] border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Opportunities</h2>
              <Button size="sm" variant="outline" className="h-8 rounded-[8px] gap-1.5 text-xs" onClick={() => setIsOpportunityOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Opportunity
              </Button>
            </div>
            {account.opportunities && account.opportunities.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {account.opportunities.map((opp: { id: string; name: string; stage: string }) => (
                  <button
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--chart-5))]/[0.04] transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground truncate">{opp.name}</span>
                    <Badge variant={opp.stage === 'closed_won' ? 'default' : 'secondary'} className="capitalize shrink-0">{opp.stage}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground px-4 py-6 text-center">No opportunities associated.</p>
            )}
          </div>

          {/* Purchase History */}
          <div className="rounded-[10px] border border-border bg-card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Purchase History</h2>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <Button size="sm" variant="outline" className="h-8 rounded-[8px] gap-1.5 text-xs border-[hsl(var(--chart-2))]/30 bg-[hsl(var(--chart-2))]/5 text-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/10" onClick={() => setIsUpsellOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Finalize Sale / Upsell
                </Button>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground block">Total Purchase</span>
                  <span className="font-bold text-base text-[hsl(var(--chart-2))]">
                    ₹{totalPurchase.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {account.accountProducts && account.accountProducts.length > 0 ? (
              <>
                {/* Mobile card list */}
                <div className="flex flex-col divide-y divide-border sm:hidden">
                  {account.accountProducts.map((asset: { id: string; customName?: string; product?: { name: string }; purchaseDate?: string; quantity: number; price: number }) => (
                    <div key={asset.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{asset.customName || asset.product?.name}</span>
                        <span className="text-sm font-semibold text-foreground shrink-0">₹{(asset.price * asset.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{asset.purchaseDate ? formatIST(asset.purchaseDate, 'MMM d, yyyy') : 'N/A'}</span>
                        <span>Qty {asset.quantity} × ₹{asset.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr className="text-left">
                        <th className="p-3 font-medium text-muted-foreground">Product</th>
                        <th className="p-3 font-medium text-muted-foreground">Date</th>
                        <th className="p-3 font-medium text-muted-foreground">Qty</th>
                        <th className="p-3 font-medium text-muted-foreground">Price</th>
                        <th className="p-3 font-medium text-muted-foreground text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {account.accountProducts.map((asset: { id: string; customName?: string; product?: { name: string }; purchaseDate?: string; quantity: number; price: number }) => (
                        <tr key={asset.id} className="hover:bg-muted/30">
                          <td className="p-3 font-medium text-foreground">{asset.customName || asset.product?.name}</td>
                          <td className="p-3 text-muted-foreground">
                            {asset.purchaseDate ? formatIST(asset.purchaseDate, 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="p-3">{asset.quantity}</td>
                          <td className="p-3">₹{asset.price?.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">
                            ₹{(asset.price * asset.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground px-4 py-6 text-center">No purchase history recorded.</p>
            )}
          </div>
        </div>
      </div>

      <EditAccountDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={account}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['account', id] })}
      />

      <CreateOpportunityDialog
        open={isOpportunityOpen}
        onOpenChange={setIsOpportunityOpen}
        defaultValues={{ accountId: id }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['account', id] })}
      />

      <UpsellDialog
        open={isUpsellOpen}
        onOpenChange={setIsUpsellOpen}
        accountId={id as string}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['account', id] })}
      />
    </div>
  )
}
