import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { whatsAppAssignmentRuleService } from "@/services/whatsAppAssignmentRuleService"
import { WhatsAppAssignmentRule } from "@/services/whatsAppAccountService"
import { getUsers } from "@/services/settingsService"

interface WhatsAppAssignmentRuleDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  ruleToEdit?: WhatsAppAssignmentRule | null
  whatsappAccountId: string
}

export function WhatsAppAssignmentRuleDialog({ children, open, onOpenChange, ruleToEdit, whatsappAccountId }: WhatsAppAssignmentRuleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined

  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const queryClient = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })

  const users = usersData?.users || []

  const form = useForm<Partial<WhatsAppAssignmentRule>>({
    defaultValues: {
      whatsappAccountId: whatsappAccountId,
      distributionType: 'specific_user',
      assignedUserIds: [],
      isActive: true
    }
  })

  useEffect(() => {
    if (ruleToEdit) {
      form.reset({
        whatsappAccountId: ruleToEdit.whatsappAccountId,
        distributionType: ruleToEdit.distributionType,
        assignedUserIds: ruleToEdit.assignedUserIds || [],
        targetTeamId: ruleToEdit.targetTeamId,
        isActive: ruleToEdit.isActive
      })
    } else {
      form.reset({
        whatsappAccountId: whatsappAccountId,
        distributionType: 'specific_user',
        assignedUserIds: [],
        isActive: true
      })
    }
  }, [ruleToEdit, whatsappAccountId, form, finalOpen])

  const mutation = useMutation({
    mutationFn: (data: Partial<WhatsAppAssignmentRule>) => {
      if (ruleToEdit?.id) {
        return whatsAppAssignmentRuleService.updateRule(ruleToEdit.id, data)
      }
      return whatsAppAssignmentRuleService.createRule(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-assignment-rules"] })
      toast.success(`Rule ${ruleToEdit ? 'updated' : 'created'} successfully`)
      finalOnOpenChange?.(false)
      form.reset()
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to save rule")
    },
  })

  function onSubmit(values: Partial<WhatsAppAssignmentRule>) {
    mutation.mutate(values)
  }

  const distributionType = form.watch('distributionType')

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ruleToEdit ? 'Edit Assignment Rule' : 'Create Assignment Rule'}</DialogTitle>
          <DialogDescription>
            Configure how incoming conversations on this number are assigned.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="distributionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distribution Type</FormLabel>
                  <Select value={field.value} onValueChange={(val) => {
                    field.onChange(val)
                    // reset assigned users when switching type
                    form.setValue('assignedUserIds', [])
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="specific_user">Specific User</SelectItem>
                      <SelectItem value="round_robin">Round Robin (Multiple Users)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {distributionType === 'specific_user' && (
              <FormField
                control={form.control}
                name="assignedUserIds"
                rules={{ required: "Select a user", validate: (val) => val && val.length > 0 || "Select a user" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To User</FormLabel>
                    <Select
                      value={field.value?.[0] || ""}
                      onValueChange={(val) => field.onChange([val])}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {distributionType === 'round_robin' && (
              <div className="space-y-2">
                <FormLabel>Select Users for Round Robin</FormLabel>
                <div className="border rounded-lg p-3 max-h-[150px] overflow-y-auto space-y-2">
                  {users.map((user: any) => {
                    const currentUsers = form.watch('assignedUserIds') || []
                    const isSelected = currentUsers.includes(user.id)
                    return (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              form.setValue('assignedUserIds', [...currentUsers, user.id])
                            } else {
                              form.setValue('assignedUserIds', currentUsers.filter((id: string) => id !== user.id))
                            }
                          }}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{user.firstName} {user.lastName}</span>
                      </label>
                    )
                  })}
                </div>
                {form.formState.errors.assignedUserIds && (
                  <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.assignedUserIds.message}</p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Rule</FormLabel>
                    <FormDescription>
                      Enable or disable this assignment rule.
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
                {mutation.isPending ? "Saving..." : "Save Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
