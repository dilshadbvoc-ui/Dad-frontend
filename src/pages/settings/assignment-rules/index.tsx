
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Trash2 } from "lucide-react"
import { AssignmentRuleDialog } from "@/components/shared/AssignmentRuleDialog"
import { getAssignmentRules, deleteAssignmentRule, type AssignmentRule } from "@/services/assignmentRuleService"
import { Badge } from "@/components/ui/badge"

export default function AssignmentRulesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['assignment-rules'],
        queryFn: () => getAssignmentRules(),
    })

    const rules = data?.assignmentRules || []

    const deleteMutation = useMutation({
        mutationFn: deleteAssignmentRule,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignment-rules'] }),
    })

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this rule?")) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Assignment Rules</h1>
                                <p className="text-gray-500">Manage how records are automatically assigned to users.</p>
                            </div>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Rule
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Rules</CardTitle>
                                <CardDescription>Define criteria for automatic assignment.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="p-8 text-center">Loading rules...</div>
                                ) : !rules || rules.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <p>No assignment rules configured.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Create Rule
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {rules.map((rule: AssignmentRule, index: number) => (
                                            <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-900">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center h-8 w-8 rounded bg-gray-100 text-gray-500 font-mono text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{rule.name}</h3>
                                                        <div className="flex gap-2 text-sm text-gray-500">
                                                            <span>Entity: {rule.entity}</span>
                                                            <span>•</span>
                                                            <span>{rule.criteria.length} conditions</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right text-sm">
                                                        <span className="text-gray-500">Assign to: </span>
                                                        <Badge variant="outline">{rule.assignTo.type === 'user' ? 'User' : 'Queue'}</Badge>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
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

            <AssignmentRuleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    )
}
