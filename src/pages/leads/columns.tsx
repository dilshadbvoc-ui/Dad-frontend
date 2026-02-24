import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Phone, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Lead } from "@/services/leadService"
import { format } from "date-fns"
import { ActionsCell } from "./ActionsCell"

import { NameCell } from "./NameCell"

export const columns: ColumnDef<Lead>[] = [
    {
        accessorKey: "firstName",
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
        header: "Email",
    },
    {
        accessorKey: "company",
        header: "Company",
    },
    {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
            const source = row.getValue("source") as string
            return <Badge variant="outline" className="capitalize bg-primary/10 text-primary border-primary/20">{source}</Badge>
        }
    },
    {
        accessorKey: "leadScore",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const score = parseFloat(row.getValue("leadScore"))
            return <div className={score > 50 ? "text-success font-bold" : "text-muted-foreground"}>{score}</div>
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let className = "capitalize "

            switch (status) {
                case 'new': className += "bg-blue-500/10 text-blue-500 border-blue-500/20"; break;
                case 'contacted': className += "bg-warning/10 text-warning border-warning/20"; break;
                case 'qualified': className += "bg-success/10 text-success border-success/20"; break;
                case 'converted': className += "bg-primary/10 text-primary border-primary/20"; break;
                case 'lost': className += "bg-destructive/10 text-destructive border-destructive/20"; break;
                default: className += "bg-muted text-muted-foreground border-border";
            }

            return <Badge variant="outline" className={className}>{status}</Badge>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            return <div className="text-muted-foreground text-sm">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>
        }
    },
    {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
            const lead = row.original
            const phone = lead.phone?.replace(/\D/g, '')
            if (!phone) return <span className="text-muted-foreground/50 text-xs italic">No phone</span>

            const logAndOpenWhatsApp = async (e: React.MouseEvent) => {
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
                        body: JSON.stringify({ type: 'whatsapp', phoneNumber: phone })
                    })
                } catch (err) {
                    console.warn('Failed to log WhatsApp interaction:', err)
                }
                window.open(`https://wa.me/${phone}`, '_blank')
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
        cell: ({ row }) => <ActionsCell lead={row.original} />,
    },
]
