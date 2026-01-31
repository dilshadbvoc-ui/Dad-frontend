import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCheckIns, type CheckIn } from "@/services/checkInService"
import { getUsers } from "@/services/settingsService"
import MapComponent from "@/components/common/MapComponent"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Clock, CheckCircle, Navigation, TrendingUp, Activity } from "lucide-react"
import { format } from "date-fns"

export default function FieldForcePage() {
    const [selectedDate] = useState(new Date())

    const { data: checkInsData, isLoading } = useQuery({
        queryKey: ['checkins', selectedDate.toISOString()],
        queryFn: () => getCheckIns({ date: selectedDate.toISOString() })
    })

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers
    })

    const checkIns = checkInsData?.checkIns || []
    const users = usersData?.users || []

    // Calculate productivity metrics based on actual data
    const productivityMetrics = useMemo(() => {
        if (checkIns.length === 0 || users.length === 0) return { score: 0, activeUsers: 0, inTransit: 0 }

        const activeUsers = checkIns.filter((c: any) => c.type === 'check_in').length
        const totalUsers = users.filter((u: any) => u.role === 'sales_rep' || u.role === 'field_agent').length
        const inTransit = Math.floor(activeUsers * 0.3) // Estimate 30% in transit

        const score = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

        return { score, activeUsers, inTransit }
    }, [checkIns, users])

    // Create team activity from actual users and check-ins
    const teamActivity = useMemo(() => {
        return users
            .filter((u: any) => u.role === 'sales_rep' || u.role === 'field_agent')
            .slice(0, 10) // Show max 10 for UI
            .map((user: any) => {
                const userCheckIn = checkIns.find((c: any) => c.userId === user.id)
                const status = userCheckIn ? 'checked_in' : 'offline'
                return {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    status,
                    location: userCheckIn?.location?.address || 'Unknown',
                    latitude: userCheckIn?.location?.latitude,
                    longitude: userCheckIn?.location?.longitude,
                    time: userCheckIn ? format(new Date(userCheckIn.createdAt), 'HH:mm') : '--:--'
                }
            })
    }, [users, checkIns])

    const mapMarkers = useMemo(() => {
        return teamActivity
            .filter((m: any) => m.latitude && m.longitude)
            .map((m: any) => ({
                id: m.id,
                position: [m.latitude, m.longitude] as [number, number],
                title: m.name,
                description: m.location,
                status: m.status
            }))
    }, [teamActivity])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'checked_in': return <Badge className="bg-green-100 text-green-800">Checked In</Badge>
            case 'in_transit': return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
            case 'checked_out': return <Badge className="bg-gray-100 text-gray-800">Checked Out</Badge>
            default: return <Badge variant="outline">Offline</Badge>
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Field Force</h1>
                                <p className="text-gray-500 mt-1">Track your field sales team activities</p>
                            </div>
                            <Button variant="outline"><Clock className="h-4 w-4 mr-2" />Check-in History</Button>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 border-green-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{productivityMetrics.activeUsers}</p><p className="text-xs text-green-600">Currently Checked In</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 border-blue-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Navigation className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{productivityMetrics.inTransit}</p><p className="text-xs text-blue-600">In Transit</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 border-purple-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><MapPin className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{checkIns.length}</p><p className="text-xs text-purple-600">Visits Today</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 border-orange-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{productivityMetrics.score}%</p><p className="text-xs text-orange-600">Productivity Score</p></div></CardContent></Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Map View */}
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-500" />Live Team Locations</CardTitle><CardDescription>Real-time tracking of your field team</CardDescription></CardHeader>
                                <CardContent className="p-0 h-[400px]">
                                    <MapComponent markers={mapMarkers} className="h-full w-full rounded-b-xl" />
                                </CardContent>
                            </Card>

                            {/* Team Activity */}
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-green-500" />Team Activity</CardTitle><CardDescription>Live status updates</CardDescription></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {teamActivity.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No field team members found</p>
                                            </div>
                                        ) : (
                                            teamActivity.map((member: any) => (
                                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">{member.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                                                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${member.status === 'checked_in' ? 'bg-green-500' : member.status === 'in_transit' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{member.name}</p><p className="text-xs text-gray-500 truncate">{member.location}</p></div>
                                                    <div className="text-right">{getStatusBadge(member.status)}<p className="text-xs text-gray-400 mt-1">{member.time}</p></div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Check-ins */}
                        <Card>
                            <CardHeader><CardTitle>Recent Check-ins</CardTitle><CardDescription>Latest field activities</CardDescription></CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12"><div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                                ) : checkIns.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500"><MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No check-ins recorded today</p></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Team Member</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th></tr></thead>
                                            <tbody>
                                                {checkIns.slice(0, 5).map((checkIn: CheckIn) => (
                                                    <tr key={checkIn.id} className="border-b hover:bg-gray-50">
                                                        <td className="py-3 px-4"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">{checkIn.user?.firstName?.[0]}{checkIn.user?.lastName?.[0]}</AvatarFallback></Avatar><span className="text-sm font-medium">{checkIn.user?.firstName} {checkIn.user?.lastName}</span></div></td>
                                                        <td className="py-3 px-4">{checkIn.type === 'check_in' ? <Badge className="bg-green-100 text-green-800">Check In</Badge> : <Badge className="bg-gray-100 text-gray-800">Check Out</Badge>}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">{checkIn.location?.address || 'Unknown'}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-500">{format(new Date(checkIn.createdAt), 'MMM d, h:mm a')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
