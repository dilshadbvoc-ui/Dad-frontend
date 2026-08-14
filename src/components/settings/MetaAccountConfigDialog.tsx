

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrganisation, getBranches } from "@/services/settingsService"
import { getAdAccounts } from "@/services/marketingService"

interface MetaAccountConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: any // The specific account object being configured
  integrations: any // Full integrations object to preserve other keys
}

export function MetaAccountConfigDialog({ open, onOpenChange, account, integrations }: MetaAccountConfigDialogProps) {
  const queryClient = useQueryClient()

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches
  });
  const branches = branchesData?.branches || [];

  // Ad accounts the connected Facebook user actually has access to — lets the org correct
  // which ad account this Page is linked to. The OAuth connect flow can only guess a "primary"
  // ad account (it has no way to know which one the org actually meant), so a wrong guess has
  // to be fixable here rather than by reconnecting from scratch.
  const { data: adAccountsData, isError: adAccountsError } = useQuery({
    queryKey: ['meta-ad-accounts-for-config'],
    queryFn: getAdAccounts,
    enabled: open,
    retry: false
  });
  const adAccountOptions: { id: string; name: string }[] = adAccountsData?.data?.data || adAccountsData?.data || [];

  const form = useForm<{ branchId: string; syncEnabled: boolean; adAccountId: string }>({
    defaultValues: {
      branchId: account?.branchId || "all_branches_placeholder",
      syncEnabled: account?.connected !== false,
      adAccountId: account?.adAccountId || "no_ad_account_placeholder"
    }
  })

  useEffect(() => {
    if (open && account) {
      form.reset({
        branchId: account.branchId || "all_branches_placeholder",
        syncEnabled: account.connected !== false,
        adAccountId: account.adAccountId || "no_ad_account_placeholder"
      })
    }
  }, [open, account, form])

  const mutation = useMutation({
    mutationFn: (data: { branchId: string; syncEnabled: boolean; adAccountId: string }) => {
      const allAccounts = integrations.metaAccounts || [];
      const selectedAdAccount = adAccountOptions.find(a => a.id === data.adAccountId);
      const adAccountId = data.adAccountId === "no_ad_account_placeholder" ? null : data.adAccountId;
      const adAccountName = data.adAccountId === "no_ad_account_placeholder" ? null : (selectedAdAccount?.name ?? account?.adAccountName ?? null);

      // update the specific account in the array using pageId
      const updatedAccounts = allAccounts.map((acc: any) => {
        if (acc.pageId === account.pageId) {
          return {
            ...acc,
            branchId: data.branchId === "all_branches_placeholder" ? null : data.branchId,
            connected: data.syncEnabled,
            adAccountId,
            adAccountName
          }
        }
        return acc
      })

      // Update legacy meta object if it matches this pageId
      let updatedMeta = integrations.meta;
      if (updatedMeta && updatedMeta.pageId === account.pageId) {
        updatedMeta = {
          ...updatedMeta,
          branchId: data.branchId === "all_branches_placeholder" ? null : data.branchId,
          connected: data.syncEnabled,
          adAccountId,
          adAccountName
        };
      }

      // Construct full payload properly preserving other keys
      const updatedIntegrations = {
        ...integrations,
        meta: updatedMeta,
        metaAccounts: updatedAccounts
      };

      return updateOrganisation({ integrations: updatedIntegrations })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisation"] })
      toast.success(`Settings saved for ${account?.pageName || account?.adAccountName || 'Page'}`)
      onOpenChange(false)
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update settings")
    },
  })

  function onSubmit(values: { branchId: string; syncEnabled: boolean; adAccountId: string }) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Meta Account</DialogTitle>
          <DialogDescription>
            Set the default branch for leads generated by <strong>{account?.adAccountName || account?.pageName || 'this account'}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="syncEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                  <div className="space-y-0.5">
                    <FormLabel>Sync Leads</FormLabel>
                    <FormDescription>
                      Retrieve and sync leads generated from this page.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Account</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ad account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no_ad_account_placeholder">None</SelectItem>
                      {adAccountOptions.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                      {/* Keep the currently-saved ad account selectable even if it didn't come back
                          in this fetch (e.g. token temporarily invalid) so saving other fields
                          doesn't silently wipe out the existing selection. */}
                      {account?.adAccountId && !adAccountOptions.some(a => a.id === account.adAccountId) && (
                        <SelectItem value={account.adAccountId}>
                          {account.adAccountName || account.adAccountId} (currently saved)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {adAccountsError && (
                    <FormDescription className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Couldn't load ad accounts right now — reconnect Meta if this persists.
                    </FormDescription>
                  )}
                  {!adAccountsError && adAccountOptions.length > 1 && (
                    <FormDescription>
                      This Facebook user has access to multiple ad accounts — pick the one that
                      actually belongs to this business.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all_branches_placeholder">All Branches / Head Office</SelectItem>
                      {branches.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leads from this account will be assigned to this branch.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
