import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCases, createCase, type Case, type CaseInput } from "@/services/caseService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Headphones, Clock, CheckCircle, AlertCircle, MoreVertical, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const statusColors: Record<string, string> = { new: 'bg-blue-100 text-blue-800', open: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' }
const priorityColors: Record<string, string> = { low: 'text-gray-500', medium: 'text-yellow-500', high: 'text-orange-500', critical: 'text-red-500' }

export default function SupportPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data: casesData, isLoading } = useQuery({
        queryKey: ['cases'],
        queryFn: () => getCases()
    })

    const cases = casesData?.cases || []

    const createMutation = useMutation({
        mutationFn: (data: CaseInput) => createCase(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cases'] }); setIsDialogOpen(false) }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        createMutation.mutate({
            subject: formData.get('subject') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as 'question' | 'problem' | 'feature_request',
            priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'critical',
            status: 'new'
        })
    }

    const openCases = cases.filter((c: Case) => ['new', 'open', 'in_progress'].includes(c.status)).length
    const resolvedCases = cases.filter((c: Case) => c.status === 'resolved').length
    const criticalCases = cases.filter((c: Case) => c.priority === 'critical').length

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Support</h1><p className="text-gray-500">Manage customer support cases</p></div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Plus className="h-4 w-4 mr-2" />New Case</Button></DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleSubmit}>
                                        <DialogHeader><DialogTitle>Create Support Case</DialogTitle></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div><Label>Subject</Label><Input name="subject" required /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Type</Label><Select name="type" defaultValue="question"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="question">Question</SelectItem><SelectItem value="problem">Problem</SelectItem><SelectItem value="feature_request">Feature Request</SelectItem></SelectContent></Select></div>
                                                <div><Label>Priority</Label><Select name="priority" defaultValue="medium"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
                                            </div>
                                            <div><Label>Description</Label><Textarea name="description" rows={4} /></div>
                                        </div>
                                        <DialogFooter><Button type="submit">Create Case</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Headphones className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{cases.length}</p><p className="text-xs text-blue-600">Total Cases</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div><div><p className="text-2xl font-bold">{openCases}</p><p className="text-xs text-yellow-600">Open Cases</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{resolvedCases}</p><p className="text-xs text-green-600">Resolved</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{criticalCases}</p><p className="text-xs text-red-600">Critical</p></div></CardContent></Card>
                        </div>

                        {/* Cases List */}
                        <Card>
                            <CardHeader><CardTitle>All Cases</CardTitle></CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12"><div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                                ) : cases.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500"><Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No support cases yet</p></div>
                                ) : (
                                    <div className="space-y-3">
                                        {cases.map((c: Case) => (
                                            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Headphones className="h-6 w-6 text-white" /></div>
                                                    <div>
                                                        <div className="flex items-center gap-2"><p className="font-semibold">{c.subject}</p><Badge className={statusColors[c.status]}>{c.status.replace('_', ' ')}</Badge></div>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span>{c.caseNumber}</span>
                                                            <span className={priorityColors[c.priority]}>• {c.priority}</span>
                                                            {c.contact && <span>• <User className="h-3 w-3 inline" /> {c.contact.firstName} {c.contact.lastName}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Resolve</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
