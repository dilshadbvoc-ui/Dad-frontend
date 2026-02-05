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
                    className="hover:bg-white/5 text-indigo-300"
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
            return <Badge variant="outline" className="capitalize bg-indigo-500/10 text-indigo-300 border-indigo-500/20">{source}</Badge>
        }
    },
    {
        accessorKey: "leadScore",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-white/5 text-indigo-300"
                >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const score = parseFloat(row.getValue("leadScore"))
            return <div className={score > 50 ? "text-emerald-400 font-bold" : "text-indigo-200"}>{score}</div>
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let className = "capitalize "

            switch (status) {
                case 'new': className += "bg-blue-500/10 text-blue-400 border-blue-500/20"; break;
                case 'contacted': className += "bg-amber-500/10 text-amber-400 border-amber-500/20"; break;
                case 'qualified': className += "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; break;
                case 'converted': className += "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"; break;
                case 'lost': className += "bg-red-500/10 text-red-400 border-red-500/20"; break;
                default: className += "bg-slate-500/10 text-slate-400 border-slate-500/20";
            }

            return <Badge variant="outline" className={className}>{status}</Badge>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            return <div className="text-indigo-300/70 text-sm">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>
        }
    },
    {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
            const lead = row.original
            const phone = lead.phone?.replace(/\D/g, '')
            if (!phone) return <span className="text-indigo-300/40 text-xs italic">No phone</span>

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
                        className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        onClick={logAndOpenWhatsApp}
                        title="WhatsApp"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
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
