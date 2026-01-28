import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getInteractions, type Interaction } from "@/services/interactionService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { format } from "date-fns"
import { Phone, Mail, Users, MessageSquare } from "lucide-react"

export default function CommunicationsPage() {
    const [filterType, setFilterType] = useState<string>("")

    const { data: interactionsData, isLoading, isError } = useQuery({
        queryKey: ['interactions', filterType],
        queryFn: () => getInteractions({ type: (filterType as any) || undefined }),
    })

    const interactions = interactionsData?.interactions || []

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            case 'meeting': return <Users className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    }

    if (isError) {
        return (
            <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

                <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
                    <div className="text-red-500 mb-4">Error loading communications. Please try again.</div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Communications Hub</h1>
                                <p className="text-gray-500 mt-1">Central feed of all customer interactions.</p>
                            </div>
                            {/* <LogInteractionDialog /> TODO: Implement Dialog */}
                            <Button>Log Interaction</Button>
                        </div>

                        <div className="flex space-x-2">
                            <Button variant={filterType === "" ? "default" : "outline"} size="sm" onClick={() => setFilterType("")} className="rounded-full">All</Button>
                            <Button variant={filterType === "call" ? "default" : "outline"} size="sm" onClick={() => setFilterType("call")} className="rounded-full">Calls</Button>
                            <Button variant={filterType === "email" ? "default" : "outline"} size="sm" onClick={() => setFilterType("email")} className="rounded-full">Emails</Button>
                            <Button variant={filterType === "meeting" ? "default" : "outline"} size="sm" onClick={() => setFilterType("meeting")} className="rounded-full">Meetings</Button>
                        </div>

                        <div className="space-y-6 relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 pl-8 py-2">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center p-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                            <p className="text-sm text-gray-500">Loading interactions...</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                interactions.map((interaction: Interaction) => (
                                    <div key={interaction.id} className="relative mb-8 last:mb-0">
                                        <div className="absolute -left-[41px] top-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-full p-2 text-gray-500">
                                            {getIcon(interaction.type)}
                                        </div>

                                        <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">{interaction.subject}</h3>
                                                        <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                                                            <span className={`capitalize px-2 py-0.5 rounded text-xs font-medium ${interaction.direction === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {interaction.direction} {interaction.type}
                                                            </span>
                                                            <span className="hidden sm:inline">&bull;</span>
                                                            <span>with <span className="font-medium text-gray-700 dark:text-gray-300">{interaction.relatedTo?.name || `${interaction.relatedTo?.firstName} ${interaction.relatedTo?.lastName}`}</span></span>
                                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">({interaction.onModel})</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-400 text-right">
                                                        <div>{format(new Date(interaction.date), "MMM d, h:mm a")}</div>
                                                        <div className="text-xs mt-0.5">by {interaction.createdBy?.firstName}</div>
                                                    </div>
                                                </div>
                                                {interaction.description && (
                                                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-100 dark:border-gray-800">
                                                        {interaction.description}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))
                            )}
                            {!isLoading && interactions.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <p className="text-gray-500">No interactions found. Log one to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
