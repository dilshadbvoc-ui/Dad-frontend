import { useNavigate, useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Phone, Mail, Calendar, User, Building, Pencil, MessageSquare, CheckSquare, GripVertical, CheckCircle2, Video, UserPlus, Clock, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogCallDialog } from "@/components/LogCallDialog"
import { ConvertLeadDialog } from "@/components/ConvertLeadDialog"
import { EditLeadDialog } from "@/components/shared/EditLeadDialog"
import { CreateTaskDialog } from "@/components/CreateTaskDialog"
import { CreateFollowUpDialog } from "@/components/CreateFollowUpDialog"
import { LogNoteDialog } from "@/components/LogNoteDialog"
import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog"
import { AssignLeadDialog } from "@/components/AssignLeadDialog"
import { useState } from "react"
import { toast } from "sonner"
import { LeadTimeline } from "@/components/leads/LeadTimeline"
import TimelineFeed from "@/components/shared/TimelineFeed"
import { CollaborationBadge } from "@/components/shared/CollaborationBadge"
import { EmailComposeDialog } from "@/components/EmailComposeDialog"
import { AddProductToLeadDialog } from "@/components/leads/AddProductToLeadDialog"
import { format } from "date-fns"
import { CallRecordingPlayer } from "@/components/CallRecordingPlayer"



const DraggableActivity = ({ type, icon: Icon, label, onDragStart, onClick }: { type: string; icon: React.ElementType; label: string; onDragStart: (e: React.DragEvent, type: string) => void; onClick: (type: string) => void }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, type)}
        onClick={() => onClick(type)}
        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
        <GripVertical className="h-4 w-4 text-gray-400" />
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
    </div>
)

// WhatsApp icon component
const WhatsAppIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
)


export default function LeadDetailPage() {
    const { formatCurrency } = useCurrency()
    const { id } = useParams()
    const navigate = useNavigate()
    const [isLogCallOpen, setIsLogCallOpen] = useState(false)
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
    const [isLogNoteOpen, setIsLogNoteOpen] = useState(false)
    const [noteInitialContent, setNoteInitialContent] = useState('')
    const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
    const [isConvertOpen, setIsConvertOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [productDialogOpen, setProductDialogOpen] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const queryClient = useQueryClient()

    const { data: lead, isLoading: leadLoading } = useQuery({
        queryKey: ['lead', id],
        queryFn: async () => (await api.get(`/leads/${id}`)).data,
        enabled: id !== 'new'
    })

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            await api.put(`/leads/${id}`, { status: newStatus })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', id] })
            queryClient.invalidateQueries({ queryKey: ['leads'] })
            toast.success("Lead status updated")
        },
        onError: () => {
            toast.error("Failed to update lead status")
        }
    })

    const { data: calls } = useQuery({
        queryKey: ['calls', id],
        queryFn: async () => (await api.get(`/calls/lead/${id}`)).data,
        enabled: id !== 'new'
    })

    const { data: whatsappMessages, isLoading: wsLoading } = useQuery({
        queryKey: ['whatsapp-messages', id],
        queryFn: async () => (await api.get(`/whatsapp/lead/${id}`)).data,
        enabled: id !== 'new'
    })

    if (leadLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>
    if (!lead) return <div className="p-8">Lead not found</div>

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('activityType', type)
        e.dataTransfer.effectAllowed = 'copy'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(true)
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = () => {
        setDragOver(false)
    }

    const handleActivityAction = (type: string) => {
        if (type === 'call') setIsLogCallOpen(true)
        else if (type === 'task') setIsCreateTaskOpen(true)
        else if (type === 'note') {
            setNoteInitialContent('')
            setIsLogNoteOpen(true)
        }
        else if (type === 'meeting') setIsScheduleMeetingOpen(true)
        else if (type === 'whatsapp') {
            const phone = lead?.phone?.replace(/[^0-9]/g, '')
            if (phone) {
                // Background log
                const logWhatsApp = async () => {
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
                }
                logWhatsApp()

                // Intent redirection
                window.location.href = `https://wa.me/${phone}`
            }
            else toast.error('No phone number available')
        }
        else if (type === 'email') {
            if (lead?.email) {
                window.open(`mailto:${lead.email}`, '_blank')
                // Smart Log
                setNoteInitialContent(`Sent email to ${lead.email}. Subject: `)
                setIsLogNoteOpen(true)
            }
            else toast.error('No email available')
        }
        else toast.info(`Create ${type} dialog coming soon!`)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const type = e.dataTransfer.getData('activityType')
        handleActivityAction(type)
    }

    // Unified Activity List
    // We normalize data to a common structure: { _id, type, date, subject, description, ...meta }


    const initiateCall = async (phone: string) => {
        if (!phone) return toast.error("No phone number available")
        const cleanPhone = phone.replace(/[^0-9+]/g, '') // Keep + for international

        toast.promise(
            api.post('/telephony/outbound', {
                to: cleanPhone,
                leadId: lead.id
            }),
            {
                loading: 'Initiating call...',
                success: 'Call initiated! Your phone will ring shortly.',
                error: (err) => err.response?.data?.message || 'Failed to initiate call'
            }
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} className="h-10 w-10 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                            <h1 className="text-xl sm:text-3xl font-bold truncate">
                                {lead.firstName} {lead.lastName || ''}
                            </h1>
                            <div className="flex items-center gap-2">
                                {id && <CollaborationBadge resourceId={`leads/${id}`} />}
                                <Badge 
                                    variant="outline" 
                                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight h-5 ${
                                        lead.status === 'new' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        lead.status === 'contacted' ? 'bg-warning/10 text-warning border-warning/20' :
                                        lead.status === 'interested' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        lead.status === 'not_interested' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                        lead.status === 'call_not_connected' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                                        lead.status === 'qualified' ? 'bg-success/10 text-success border-success/20' :
                                        lead.status === 'converted' ? 'bg-primary/10 text-primary border-primary/20' :
                                        lead.status === 'lost' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                        ''
                                    }`}
                                >
                                    {lead.status.replace(/_/g, ' ')}
                                </Badge>
                                {lead.reEnquiryCount > 0 && (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs font-bold uppercase tracking-tight h-5 bg-orange-100 text-orange-700 hover:bg-orange-100">
                                        Re-Enquiry ({lead.reEnquiryCount})
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="truncate">{lead.company}</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end shrink-0">
                        {lead.potentialValue > 0 && (
                            <span className="text-sm font-bold text-success mb-1">
                                {formatCurrency(lead.potentialValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mobile Dashboard Actions / Desktop Full Actions */}
                <div className="flex flex-wrap items-center gap-2 px-2 sm:px-0">
                    <div className="flex-1 min-w-[140px] sm:hidden">
                        <Select value={lead.status || "new"} onValueChange={(val) => updateStatusMutation.mutate(val)}>
                            <SelectTrigger className="w-full h-9 text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interested">Interested</SelectItem>
                                <SelectItem value="not_interested">Not Interested</SelectItem>
                                <SelectItem value="call_not_connected">Call Not Connected</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="nurturing">Nurturing</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden sm:block">
                        <Select value={lead.status || "new"} onValueChange={(val) => updateStatusMutation.mutate(val)}>
                            <SelectTrigger className="w-[160px] h-9 text-xs">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interested">Interested</SelectItem>
                                <SelectItem value="not_interested">Not Interested</SelectItem>
                                <SelectItem value="call_not_connected">Call Not Connected</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="nurturing">Nurturing</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0 overflow-x-auto pb-1 no-scrollbar">
                        <Button variant="outline" size="sm" onClick={() => setFollowUpDialogOpen(true)} className="h-9 px-2 sm:px-3 text-xs">
                            <Calendar className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Follow-up</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="h-9 px-2 sm:px-3 text-xs">
                            <Pencil className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)} className="h-9 px-2 sm:px-3 text-xs">
                            <UserPlus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Assign</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)} className="h-9 px-2 sm:px-3 text-xs">
                            <Mail className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Email</span>
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 px-3 sm:px-4 text-xs bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20"
                            onClick={() => setIsConvertOpen(true)}
                            disabled={lead.status === 'converted'}
                        >
                            <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                            <span>{lead.status === 'converted' ? 'Converted' : 'Move to Pipeline'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{lead.email}</span></div>
                            {lead.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex items-center gap-2">
                                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => initiateCall(lead.phone)}
                                            title="Call via CRM"
                                        >
                                            <Phone className="h-3 w-3" />
                                        </Button>
                                    </span>
                                </div>
                            )}

                            {lead.secondaryPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex items-center gap-2">
                                        <a href={`tel:${lead.secondaryPhone}`} className="hover:underline text-muted-foreground">{lead.secondaryPhone}</a>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => initiateCall(lead.secondaryPhone)}
                                            title="Call Alt via CRM"
                                        >
                                            <Phone className="h-3 w-3" />
                                        </Button>
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span></div>
                            
                            {lead.enquiryAbout && (
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex items-start gap-3 mt-2">
                                        <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Enquiry</span>
                                            <p className="text-sm text-muted-foreground whitespace-normal break-words break-all lg:break-normal max-w-[calc(100vw-6rem)] md:max-w-full">
                                                {lead.enquiryAbout}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {lead.assignedTo ? (
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Lead Owner</span>
                                        <span className="text-xs text-muted-foreground">
                                            {lead.assignedTo.firstName} {lead.assignedTo.lastName || ''} ({lead.assignedTo.email})
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 opacity-60">
                                    <User className="h-4 w-4 text-muted-foreground font-italic" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Lead Owner</span>
                                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                    </div>
                                </div>
                            )}

                            {lead.lastEnquiryDate && lead.reEnquiryCount > 0 && (
                                <div className="flex items-center gap-3 text-orange-600 font-medium">
                                    <History className="h-4 w-4" />
                                    <span>Last Re-enquiry: {new Date(lead.lastEnquiryDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {lead.nextFollowUp && (
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                                    <Clock className="h-4 w-4" />
                                    <span>Next Follow-up: {format(new Date(lead.nextFollowUp), "MMM d, yyyy, h:mm a")}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-sm">Products Interested</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setProductDialogOpen(true)}>
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                </div>
                                {lead.products && lead.products.length > 0 ? (
                                    <div className="space-y-1">
                                        {lead.products.map((kp: { productId: string; product?: { name: string }; quantity: number; price: number }) => (
                                            <div key={kp.productId} className="text-sm flex justify-between">
                                                <span>{kp.product?.name} <span className="text-muted-foreground text-xs">x{kp.quantity}</span></span>
                                                <span className="font-medium">{formatCurrency(kp.price * kp.quantity, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No products selected</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <DraggableActivity type="call" icon={Phone} label="Log Call" onDragStart={handleDragStart} onClick={handleActivityAction} />
                            <DraggableActivity type="whatsapp" icon={WhatsAppIcon} label="WhatsApp" onDragStart={handleDragStart} onClick={handleActivityAction} />
                            <DraggableActivity type="email" icon={Mail} label="Email" onDragStart={handleDragStart} onClick={handleActivityAction} />
                            <DraggableActivity type="meeting" icon={Video} label="Meeting" onDragStart={handleDragStart} onClick={handleActivityAction} />
                            <DraggableActivity type="task" icon={CheckSquare} label="Task" onDragStart={handleDragStart} onClick={handleActivityAction} />
                            <DraggableActivity type="note" icon={MessageSquare} label="Note" onDragStart={handleDragStart} onClick={handleActivityAction} />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="timeline">
                        <TabsList>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                            <TabsTrigger value="calls">Call History</TabsTrigger>
                            <TabsTrigger value="history">Ownership History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="space-y-4">
                            {/* Drag & Drop Zone - Integrated */}
                            <div
                                className={`transition-all border-2 border-dashed rounded-lg p-4 ${dragOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5 h-24' : 'border-transparent h-0 overflow-hidden py-0'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="text-center animate-pulse">
                                    <p className="text-sm font-semibold text-primary">Drop here to log activity</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {id && <TimelineFeed type="lead" id={id} />}
                            </div>
                        </TabsContent>

                        <TabsContent value="whatsapp" className="space-y-4">
                            {wsLoading ? (
                                <Skeleton className="h-32 w-full" />
                            ) : whatsappMessages && whatsappMessages.length > 0 ? (
                                whatsappMessages.map((msg: any) => (
                                    <Card key={msg.id} className="overflow-hidden border-teal-100 dark:border-teal-900 shadow-sm transition-all hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-full ${msg.direction === 'inbound' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
                                                    <MessageSquare className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{msg.direction === 'inbound' ? 'From Lead' : 'To Lead'}</span>
                                                        <span className="text-xs text-muted-foreground">{format(new Date(msg.date), "MMM d, h:mm a")}</span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    {msg.actor && <span className="text-[10px] text-muted-foreground mt-2 block">Logged by {msg.actor}</span>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                                    <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                    <p>No WhatsApp activity recorded.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="calls" className="space-y-4">
                            {calls && calls.length > 0 ? calls.map((call: any) => (
                                <Card key={call.id} className="overflow-hidden shadow-sm transition-all hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-full ${call.direction === 'inbound' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                            {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                                                        </span>
                                                        <span className="font-semibold text-sm">{call.subject}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(call.date), "MMM d, h:mm a")}</span>
                                                </div>
                                                
                                                {call.description && <p className="text-sm text-muted-foreground mb-3">{call.description}</p>}
                                                
                                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                                    {call.duration && (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {Math.floor(call.duration)}m {Math.round((call.duration % 1) * 60)}s
                                                        </span>
                                                    )}
                                                    {call.callStatus && (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted/50">
                                                            {call.callStatus}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {call.recordingUrl && (
                                                    <div className="mt-3 p-2 bg-muted/30 rounded-lg">
                                                        <CallRecordingPlayer 
                                                            recordingUrl={call.recordingUrl} 
                                                            duration={call.recordingDuration}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                                    <Phone className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                    <p>No call history recorded.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            {id && <LeadTimeline leadId={id} />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {
                lead && (
                    <>
                        <CreateFollowUpDialog
                            open={followUpDialogOpen}
                            onOpenChange={setFollowUpDialogOpen}
                            leadId={lead.id}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['lead', id] })
                                queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
                            }}
                        />
                        <ConvertLeadDialog
                            open={isConvertOpen}
                            onOpenChange={setIsConvertOpen}
                            lead={lead}
                        />
                        <LogCallDialog
                            open={isLogCallOpen}
                            onOpenChange={setIsLogCallOpen}
                            leadId={lead.id}
                            leadName={`${lead.firstName} ${lead.lastName || ''}`}
                            leadPhone={lead.phone}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['calls', id] })
                                queryClient.invalidateQueries({ queryKey: ['lead', id] })
                            }}
                        />
                        <CreateTaskDialog
                            open={isCreateTaskOpen}
                            onOpenChange={setIsCreateTaskOpen}
                            leadId={lead.id}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['tasks', id] })
                            }}
                        />
                        <LogNoteDialog
                            open={isLogNoteOpen}
                            onOpenChange={setIsLogNoteOpen}
                            leadId={lead.id}
                            initialContent={noteInitialContent}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['interactions', id] })
                            }}
                        />
                        <ScheduleMeetingDialog
                            open={isScheduleMeetingOpen}
                            onOpenChange={setIsScheduleMeetingOpen}
                            leadId={lead.id}
                            leadName={`${lead.firstName} ${lead.lastName || ''}`}
                            onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['lead', id] })
                                toast.success('Meeting added to calendar!')
                            }}
                        />
                    </>
                )
            }

            {lead && <EditLeadDialog open={isEditOpen} onOpenChange={setIsEditOpen} lead={lead} />}
            {lead && <ConvertLeadDialog open={isConvertOpen} onOpenChange={setIsConvertOpen} lead={lead} />}
            {lead && <AssignLeadDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} lead={lead} />}
            <EmailComposeDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                leadId={lead.id}
                leadEmail={lead.email}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['lead-timeline', lead.id] })
                }}
            />
            {
                lead && (
                    <AddProductToLeadDialog
                        open={productDialogOpen}
                        onOpenChange={setProductDialogOpen}
                        leadId={lead.id}
                        currentProducts={lead.products}
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lead', id] })}
                    />
                )
            }

        </div >
    )
}
