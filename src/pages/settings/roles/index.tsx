import { useQuery } from "@tanstack/react-query"
import { getRoles } from "@/services/settingsService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users } from "lucide-react"

interface Role {
    id: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    userCount: number;
}

export default function RolesSettingsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles
    })

    const roles = data?.roles || []

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Roles & Permissions</h1>
                            <p className="text-gray-500">Manage user roles and access levels</p>
                        </div>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Roles</CardTitle></CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12"><div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                                ) : roles.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No roles defined</p></div>
                                ) : (
                                    <div className="space-y-3">
                                        {roles.map((role: Role) => (
                                            <div key={role.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Shield className="h-5 w-5 text-white" /></div>
                                                    <div>
                                                        <p className="font-semibold">{role.name}</p>
                                                        <p className="text-sm text-gray-500">{role.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {role.isSystemRole && <Badge variant="secondary">System</Badge>}
                                                    <div className="flex items-center gap-1 text-sm text-gray-500"><Users className="h-4 w-4" /><span>{role.userCount || 0}</span></div>
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
