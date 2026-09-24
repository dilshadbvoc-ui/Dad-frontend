import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
// import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLead, type CreateLeadData } from "@/services/leadService"
import { getUsers } from "@/services/settingsService"
import { useQuery } from "@tanstack/react-query"
import DynamicCustomFields from "@/components/forms/DynamicCustomFields"
import { countryCodes, identifyCountryFromPhone } from "@/lib/countryCodes"
import { UserPlus, Contact, ClipboardList } from "lucide-react"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { getUserInfo } from "@/lib/utils"

// interface for Form Data
interface QuickLeadFormData {
  firstName: string
  lastName?: string
  email?: string
  phone: string
  phoneCountryCode: string
  secondaryPhone?: string
  company?: string
  enquiryAbout?: string
  source: string
  status: string
  assignedTo?: string
  customFields?: Record<string, unknown>
}

interface QuickAddLeadDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function QuickAddLeadDialog({ children, open, onOpenChange }: QuickAddLeadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({})
  const isControlled = open !== undefined

  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const { statuses, selectableStatuses } = useLeadStatuses()
  const queryClient = useQueryClient()

  const currentUser = getUserInfo()

  const form = useForm<QuickLeadFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      phoneCountryCode: "+91",
      secondaryPhone: "",
      company: "",
      enquiryAbout: "",
      source: "manual",
      status: "", // Set dynamically via useEffect
      assignedTo: "",
    },
  })

  // Auto-set default status from settings
  useEffect(() => {
    if (statuses?.length > 0) {
      const defaultStatus = statuses.find(s => s.isDefault);
      if (defaultStatus && !form.getValues('status')) {
        form.setValue('status', defaultStatus.id);
      } else if (!form.getValues('status')) {
        form.setValue('status', 'new'); // Fallback if no default marked
      }
    }
  }, [statuses, form]);

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const users = (usersData?.users || []).filter((u: any) => u.isActive !== false)
  // The backend already scopes this list to the caller's visible hierarchy
  // (self + subordinates). A plain individual-contributor with no reports
  // only ever gets themself back — hide the picker for them and auto-assign
  // to self on submit instead. Anyone with at least one subordinate (any
  // role, not just "manager"-named ones) sees the picker.
  const canAssign = users.length > 1

  const mutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead created successfully")
      finalOnOpenChange?.(false)
      form.reset()
      setCustomFieldValues({})
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create lead")
    },
  })

  function onSubmit(values: QuickLeadFormData) {
    // Sanitize payload: Remove empty strings and convert to undefined for optional fields
    const payload: CreateLeadData = {
      firstName: values.firstName,
      phone: values.phone,
      phoneCountryCode: values.phoneCountryCode,
      source: values.source,
      status: values.status,
    };

    // Only add optional fields if they have values
    if (values.lastName && values.lastName.trim()) {
      payload.lastName = values.lastName.trim();
    }
    if (values.email && values.email.trim()) {
      payload.email = values.email.trim();
    }
    if (values.secondaryPhone && values.secondaryPhone.trim()) {
      payload.secondaryPhone = values.secondaryPhone.trim();
    }
    if (values.company && values.company.trim()) {
      payload.company = values.company.trim();
    }
    if (values.enquiryAbout && values.enquiryAbout.trim()) {
      payload.enquiryAbout = values.enquiryAbout.trim();
    }
    if (!canAssign) {
      // No assignment picker is shown to them — always their own lead.
      if (currentUser?.id) payload.assignedTo = currentUser.id;
    } else if (values.assignedTo && values.assignedTo !== "unassigned") {
      payload.assignedTo = values.assignedTo;
    }
    if (Object.keys(customFieldValues).length > 0) {
      (payload as any).customFields = customFieldValues;
    }

    mutation.mutate(payload)
  }

  const handleCustomFieldChange = (name: string, value: unknown) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[620px] p-0 rounded-[16px] max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="text-left px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Add New Lead</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new lead to your pipeline quickly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8">
            {/* Contact Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[hsl(var(--chart-5))]">
                <Contact className="w-4 h-4" />
                <h4 className="text-sm font-semibold">Contact Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="firstName"
                  rules={{ required: "First name is required", minLength: { value: 2, message: "Min 2 chars" } }}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John" className="h-11 rounded-[10px]" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Last Name <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" className="h-11 rounded-[10px]" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Email <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" className="h-11 rounded-[10px]" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-[80px_1fr] gap-2">
                <FormField
                  control={form.control}
                  name="phoneCountryCode"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px] px-2">
                            <SelectValue>
                              {field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code + c.prefix} value={c.prefix}>
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span className="font-mono">{c.prefix}</span>
                                <span className="text-muted-foreground text-[10px] truncate max-w-[60px]">{c.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{
                    required: "Phone number is required",
                    validate: (value) => {
                      if (value.length < 5) return "Too short";
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Phone <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          className="h-11 rounded-[10px]"
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            // Auto-identify country if it starts with +
                            if (rawValue.startsWith('+')) {
                              const identified = identifyCountryFromPhone(rawValue);
                              if (identified) {
                                form.setValue('phoneCountryCode', identified.country.prefix);
                                field.onChange(identified.localNumber);
                                return;
                              }
                            }
                            // Otherwise just clean and set
                            const value = rawValue.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                </div>
                <FormField
                  control={form.control}
                  name="secondaryPhone"
                  rules={{
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Phone number must be exactly 10 digits"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Alt Phone <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543211"
                          {...field}
                          maxLength={10}
                          className="h-11 rounded-[10px]"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Lead Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[hsl(var(--chart-5))]">
                <ClipboardList className="w-4 h-4" />
                <h4 className="text-sm font-semibold">Lead Info</h4>
              </div>
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-foreground">Company <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc" className="h-11 rounded-[10px]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enquiryAbout"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-foreground">Enquiry About <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Course, service..." className="h-11 rounded-[10px]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Source <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px]">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="cold_call">Cold Call</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="email_campaign">Email Campaign</SelectItem>
                          <SelectItem value="meta_ads">Meta Ads</SelectItem>
                          <SelectItem value="google_ads">Google Ads</SelectItem>
                          <SelectItem value="import">Bulk Import</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium text-foreground">Status <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectableStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {canAssign && (
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-sm font-medium text-foreground">Assign To <span className="text-muted-foreground font-normal normal-case">(optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-[10px]">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((user: { id: string; firstName: string; lastName: string }) => (
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
              </div>
            </div>

            {/* Custom Fields Section */}
            <DynamicCustomFields
              entityType="Lead"
              values={customFieldValues}
              onChange={handleCustomFieldChange}
            />
            </div>

            <DialogFooter className="px-6 sm:px-8 py-5 border-t border-border flex-col sm:flex-row gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => finalOnOpenChange?.(false)}
                className="h-11 rounded-[10px] flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={mutation.isPending}
                className="h-11 rounded-[10px] flex-1 sm:flex-none bg-[hsl(var(--chart-5))] hover:bg-[hsl(94_48%_38%)] text-white"
              >
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
