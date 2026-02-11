import { useState } from "react"
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

// interface for Form Data
interface QuickLeadFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    company: string
    source: string

    status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost'
    assignedTo?: string
}

interface QuickAddLeadDialogProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function QuickAddLeadDialog({ children, open, onOpenChange }: QuickAddLeadDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined

    const finalOpen = isControlled ? open : internalOpen
    const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

    const queryClient = useQueryClient()

    const form = useForm<QuickLeadFormData>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            company: "",
            source: "manual",

            status: "new",
            assignedTo: "",
        },
    })

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers
    })
    const users = usersData?.users || []

    const mutation = useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast.success("Lead created successfully")
            finalOnOpenChange?.(false)
            form.reset()
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create lead")
        },
    })

    function onSubmit(values: QuickLeadFormData) {
        // Sanitize payload: Remove empty strings
        const payload = { ...values };
        if (!payload.assignedTo || payload.assignedTo === "unassigned") {
            delete payload.assignedTo;
        }

        mutation.mutate(payload as unknown as CreateLeadData)
    }

    return (
        <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[425px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-bold">Quick Add Lead</DialogTitle>
                    <DialogDescription className="text-sm">
                        Add a new lead to your pipeline quickly.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                rules={{ required: "First name is required", minLength: { value: 2, message: "Min 2 chars" } }}
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" className="h-11 sm:h-10" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                rules={{ required: "Last name is required", minLength: { value: 2, message: "Min 2 chars" } }}
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" className="h-11 sm:h-10" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
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
                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" className="h-11 sm:h-10" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            rules={{
                                required: "Phone number is required",
                                pattern: {
                                    value: /^\d{10}$/,
                                    message: "Phone number must be exactly 10 digits"
                                }
                            }}
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="9876543210"
                                            {...field}
                                            maxLength={10}
                                            className="h-11 sm:h-10"
                                            onChange={(e) => {
                                                // Allow only digits
                                                const value = e.target.value.replace(/\D/g, '');
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc" className="h-11 sm:h-10" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
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
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign To</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select user (Optional)" />
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
                        </div>
                        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => finalOnOpenChange?.(false)}
                                className="h-11 sm:h-10 flex-1 sm:flex-none"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={mutation.isPending} className="h-11 sm:h-10 flex-1 sm:flex-none">
                                Create Lead
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
