import { useNavigate, useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Phone, Mail, Calendar, User, Building, Pencil, MessageSquare, CheckSquare, GripVertical, CheckCircle2, Video, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogCallDialog } from "@/components/LogCallDialog"
import { ConvertLeadDialog } from "@/components/ConvertLeadDialog"
import { EditLeadDialog } from "@/components/shared/EditLeadDialog"
import { CreateTaskDialog } from "@/components/CreateTaskDialog"
import { LogNoteDialog } from "@/components/LogNoteDialog"
import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog"
import { AssignLeadDialog } from "@/components/AssignLeadDialog"
import { SetFollowUpDialog } from "@/components/SetFollowUpDialog"
import { useState } from "react"
import { toast } from "sonner"
import { LeadTimeline } from "@/components/leads/LeadTimeline"
import TimelineFeed from "@/components/shared/TimelineFeed"
import { CollaborationBadge } from "@/components/shared/CollaborationBadge"
import { EmailComposeDialog } from "@/components/EmailComposeDialog"
import { AddProductToLeadDialog } from "@/components/leads/AddProductToLeadDialog"



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

    const updateStageMutation = useMutation({
        mutationFn: async (newStage: string) => {
            await api.put(`/leads/${id}`, { stage: newStage })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', id] })
            toast.success("Lead stage updated")
        },
        onError: () => {
            toast.error("Failed to update lead stage")
        }
    })

    const { data: calls } = useQuery({
        queryKey: ['calls', id],
        queryFn: async () => (await api.get(`/calls/lead/${id}`)).data,
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
                window.open(`https://wa.me/${phone}`, '_blank')
                // Smart Log: Prompt to log this interaction
                setNoteInitialContent(`Started WhatsApp conversation with ${lead.firstName}. Noted: `)
                setIsLogNoteOpen(true)
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {lead.firstName} {lead.lastName}
                        {id && <CollaborationBadge resourceId={`leads/${id}`} />}
                        <Button variant="outline" size="sm" onClick={() => setFollowUpDialogOpen(true)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Set Follow-up
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                        </Button>
                        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setIsConvertOpen(true)} disabled={lead.status === 'converted'}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {lead.status === 'converted' ? 'Converted' : 'Convert'}
                        </Button>
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-4 w-4" /> {lead.company}
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Select value={lead.stage || "New"} onValueChange={(val) => updateStageMutation.mutate(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Stage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Won">Won</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex flex-col items-end">
                        <Badge>{lead.status}</Badge>
                        {lead.potentialValue > 0 && (
                            <span className="text-xs font-semibold text-green-600 mt-1">
                                Value: ${lead.potentialValue.toLocaleString()}
                            </span>
                        )}
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

                            <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>Owner: {lead.assignedTo ? <Link to={`/users/${lead.assignedTo.id}`} className="hover:underline text-blue-600">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</Link> : 'Unassigned'}</span></div>
                            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span></div>

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
                                                <span className="font-medium">${(kp.price * kp.quantity).toLocaleString()}</span>
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
                            <TabsTrigger value="calls">Call History</TabsTrigger>
                            <TabsTrigger value="history">Ownership History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="space-y-4">
                            <Card
                                className={`transition-all border-dashed ${dragOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
                                <CardContent className="min-h-[100px] flex flex-col justify-center items-center">
                                    {dragOver ? (
                                        <div className="text-center animate-pulse"><p className="text-lg font-semibold text-primary">Drop to Create Activity</p></div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-2"><p>Drag actions from the left sidebar here to log new activities.</p></div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                {id && <TimelineFeed type="lead" id={id} />}
                            </div>
                        </TabsContent>

                        <TabsContent value="calls" className="space-y-4">
                            {/* Calls Tab Content (Keep existing separate view if desired, or reuse loop) */}
                            {calls?.map((call: { id: string; subject: string; date: string; description?: string }) => (
                                <Card key={call.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Phone className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">{call.subject}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{new Date(call.date).toLocaleString()}</span>
                                        </div>
                                        {call.description && <p className="text-sm text-gray-600">{call.description}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            {id && <LeadTimeline leadId={id} />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {lead && (
                <>
                    <SetFollowUpDialog
                        open={followUpDialogOpen}
                        onOpenChange={setFollowUpDialogOpen}
                        leadId={lead.id}
                        currentDate={lead.nextFollowUp}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['lead', id] })
                            queryClient.invalidateQueries({ queryKey: ['interactions', id] }) // logs appear in existing unified timeline if we fetch interactions
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
                        leadName={`${lead.firstName} ${lead.lastName}`}
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
                        leadName={`${lead.firstName} ${lead.lastName}`}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['lead', id] })
                            toast.success('Meeting added to calendar!')
                        }}
                    />
                </>
            )}

            {lead && <EditLeadDialog open={isEditOpen} onOpenChange={setIsEditOpen} lead={lead} />}
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
            {lead && (
                <AddProductToLeadDialog
                    open={productDialogOpen}
                    onOpenChange={setProductDialogOpen}
                    leadId={lead.id}
                    currentProducts={lead.products}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lead', id] })}
                />
            )}

        </div>
    )
}
