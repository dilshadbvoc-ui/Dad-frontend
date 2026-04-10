import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Phone, MessageCircle, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Lead } from "@/services/leadService"
import { format } from "date-fns"
import { ActionsCell } from "./ActionsCell"
import { toast } from "sonner"

import { NameCell } from "./NameCell"
import { StatusCell } from "./StatusCell"

export const columns: ColumnDef<Lead>[] = [
    {
        id: "select",
        size: 40,
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => {
                    table.toggleAllPageRowsSelected(!!value)
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => {
                    row.toggleSelected(!!value)
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "expander",
        size: 40,
        header: () => null,
        cell: ({ row }) => {
            return row.getCanExpand() ? (
                <Button
                    variant="ghost"
                    onClick={row.getToggleExpandedHandler()}
                    className="p-0 h-6 w-6"
                >
                    {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            ) : null
        },
    },
    {
        accessorKey: "firstName",
        size: 180,
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <NameCell lead={row.original} />
    },
    {
        accessorKey: "email",
        size: 200,
        header: "Email",
    },
    {
        accessorKey: "company",
        size: 150,
        header: "Company",
    },
    {
        accessorKey: "assignedTo",
        size: 150,
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                    Owner
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const assignedTo = row.original.assignedTo as any;
            if (!assignedTo) return <span className="text-muted-foreground/30 text-xs italic">Unassigned</span>;
            return <div className="text-sm font-medium">{assignedTo.firstName} {assignedTo.lastName || ''}</div>;
        }
    },
    {
        accessorKey: "source",
        size: 100,
        header: "Source",
        cell: ({ row }) => {
            const source = row.getValue("source") as string
            return <Badge variant="outline" className="capitalize bg-primary/10 text-primary border-primary/20">{source}</Badge>
        }
    },
    {
        accessorKey: "nextFollowUp",
        size: 150,
        header: "Next Follow-up",
        cell: ({ row }) => {
            const date = row.getValue("nextFollowUp") as string
            if (!date) return <div className="text-muted-foreground/30 text-xs italic">-</div>
            const followUpDate = new Date(date)
            return (
                <div className="text-indigo-400 font-medium text-sm">
                    {format(followUpDate, "MMM d, h:mm a")}
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        size: 120,
        header: "Status",
        cell: ({ row }) => <StatusCell statusId={row.getValue("status")} />
    },
    {
        accessorKey: "createdAt",
        size: 120,
        header: "Created",
        cell: ({ row }) => {
            return <div className="text-muted-foreground text-sm">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>
        }
    },
    {
        id: "contact",
        size: 100,
        header: "Contact",
        cell: ({ row }) => {
            const lead = row.original
            const phone = lead.phone?.replace(/\D/g, '')
            if (!phone) return <span className="text-muted-foreground/50 text-xs italic">No phone</span>

            const logAndOpenWhatsApp = async (e: React.MouseEvent) => {
                e.stopPropagation()
                if (!phone) {
                    toast.error('No phone number available')
                    return
                }

                try {
                    const userInfo = localStorage.getItem('userInfo')
                    const token = userInfo ? JSON.parse(userInfo).token : null
                    await fetch(`/api/interactions/leads/${row.original.id}/quick-log`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ type: 'whatsapp', phoneNumber: phone })
                    })
                } catch (err) {
                    console.warn('Failed to log WhatsApp interaction:', err)
                }
                window.location.href = `https://wa.me/${phone}`
            }

            const logAndCall = async (e: React.MouseEvent) => {
                e.stopPropagation()
                try {
                    const userInfo = localStorage.getItem('userInfo')
                    const token = userInfo ? JSON.parse(userInfo).token : null
                    await fetch(`/api/interactions/leads/${lead.id}/quick-log`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ type: 'call', phoneNumber: phone })
                    })
                } catch (err) {
                    console.warn('Failed to log Call interaction:', err)
                }
                window.location.href = `tel:${phone}`
            }

            return (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-success hover:text-success/80 hover:bg-success/10"
                        onClick={logAndOpenWhatsApp}
                        title="WhatsApp"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-info hover:text-info/80 hover:bg-info/10"
                        onClick={logAndCall}
                        title="Call"
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    },
    {
        id: "actions",
        size: 50,
        cell: ({ row }) => <ActionsCell lead={row.original} />,
    },
]
