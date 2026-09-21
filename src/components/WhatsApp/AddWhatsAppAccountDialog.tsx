import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { whatsAppAccountService } from "@/services/whatsAppAccountService"
import type { WhatsAppAccount } from "@/services/whatsAppAccountService"

interface AddWhatsAppAccountDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  accountToEdit?: WhatsAppAccount | null
}

export function AddWhatsAppAccountDialog({ children, open, onOpenChange, accountToEdit }: AddWhatsAppAccountDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined

  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const queryClient = useQueryClient()

  const form = useForm<Partial<WhatsAppAccount>>({
    defaultValues: {
      provider: 'meta',
      status: 'active',
      isDefault: false
    }
  })

  useEffect(() => {
    if (accountToEdit) {
      form.reset({
        phoneNumber: accountToEdit.phoneNumber,
        displayName: accountToEdit.displayName,
        provider: accountToEdit.provider,
        phoneNumberId: accountToEdit.phoneNumberId,
        wabaId: accountToEdit.wabaId,
        status: accountToEdit.status,
        isDefault: accountToEdit.isDefault
      })
    } else {
      form.reset({
        provider: 'meta',
        status: 'active',
        isDefault: false
      })
    }
  }, [accountToEdit, form, finalOpen])

  const mutation = useMutation({
    mutationFn: (data: Partial<WhatsAppAccount>) => {
      if (accountToEdit?.id) {
        return whatsAppAccountService.updateWhatsAppAccount(accountToEdit.id, data)
      }
      return whatsAppAccountService.createWhatsAppAccount(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-accounts"] })
      toast.success(`WhatsApp account ${accountToEdit ? 'updated' : 'added'} successfully`)
      finalOnOpenChange?.(false)
      form.reset()
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to save account")
    },
  })

  function onSubmit(values: Partial<WhatsAppAccount>) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{accountToEdit ? 'Edit WhatsApp Account' : 'Add WhatsApp Account'}</DialogTitle>
          <DialogDescription>
            {accountToEdit ? 'Update details for this WhatsApp number.' : 'Connect a new WhatsApp number to your organisation.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              rules={{ required: "Phone number is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sales - North Region" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="meta">Meta (Official API)</SelectItem>
                      <SelectItem value="gallabox">Gallabox</SelectItem>
                      <SelectItem value="wati">Wati</SelectItem>
                      <SelectItem value="doubletick">DoubleTick</SelectItem>
                      <SelectItem value="wabis">Wabis</SelectItem>
                      <SelectItem value="happilee">Happilee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number ID / Channel ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Meta Phone Number ID or Provider Channel ID" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wabaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WABA ID</FormLabel>
                  <FormControl>
                    <Input placeholder="WhatsApp Business Account ID" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessToken" // intentionally omit from reset to avoid sending empty string if not changed
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token (API Key)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={accountToEdit ? "Leave blank to keep existing token" : "Enter access token or API key"} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Set as Default</FormLabel>
                    <FormDescription>
                      Use this number for outbound messages by default.
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => finalOnOpenChange?.(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
