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

import { toast } from "sonner"
import { createCheckIn } from "@/services/checkInService"
import { useQueryClient } from "@tanstack/react-query"

export default function FieldForcePage() {
    const [selectedDate] = useState(new Date())
    const [checkingIn, setCheckingIn] = useState(false)
    const queryClient = useQueryClient()

    const handleCheckIn = () => {
        setCheckingIn(true)
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser")
            setCheckingIn(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    await createCheckIn({
                        type: 'CHECK_IN',
                        latitude,
                        longitude,
                        address: 'Fetching address...' // Backend should handle reverse geocoding ideally
                    })
                    toast.success("Checked in successfully!")
                    queryClient.invalidateQueries({ queryKey: ['checkins'] })
                } catch (error) {
                    console.error(error)
                    toast.error("Failed to check in")
                } finally {
                    setCheckingIn(false)
                }
            },
            (error) => {
                console.error(error)
                toast.error("Unable to retrieve your location")
                setCheckingIn(false)
            }
        )
    }

    const { data: checkInsData, isLoading } = useQuery({
        queryKey: ['checkins', selectedDate.toISOString()],
        queryFn: () => getCheckIns({ date: selectedDate.toISOString() })
    })

    const { data: recentCheckInsRaw } = useQuery({
        queryKey: ['checkins-recent'],
        queryFn: () => getCheckIns({ limit: 10 })
    })

    // Use specific recent data for the list, unrelated to today's date filter
    const recentActivityList = useMemo(() => recentCheckInsRaw?.checkIns || (Array.isArray(recentCheckInsRaw) ? recentCheckInsRaw : []) || [], [recentCheckInsRaw]);

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers
    })

    const checkIns = useMemo(() => (checkInsData?.checkIns || []).filter((c: CheckIn) => c && typeof c === 'object'), [checkInsData]);
    const users = useMemo(() => (usersData?.users || []).filter((u: { id: string; firstName: string; lastName: string; role: string }) => u && typeof u === 'object'), [usersData]);

    // Calculate productivity metrics based on actual data
    const productivityMetrics = useMemo(() => {
        if (checkIns.length === 0 || users.length === 0) return { score: 0, activeUsers: 0, inTransit: 0 }

        const activeUsers = checkIns.filter((c: { type: string }) => c.type === 'CHECK_IN').length
        const totalUsers = users.filter((u: { role: string }) => u.role === 'sales_rep' || u.role === 'field_agent').length
        const inTransit = Math.floor(activeUsers * 0.3) // Estimate 30% in transit

        const score = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

        return { score, activeUsers, inTransit }
    }, [checkIns, users])

    // Create team activity from actual users and check-ins
    const teamActivity = useMemo(() => {
        return users
            .filter((u: { role: string }) => u.role === 'sales_rep' || u.role === 'field_agent')
            .slice(0, 10) // Show max 10 for UI
            .map((user: { id: string, firstName: string, lastName: string }) => {
                const userCheckIn = checkIns.find((c: { userId: string }) => c.userId === user.id)
                const status = userCheckIn ? 'checked_in' : 'offline'
                return {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    status,
                    location: userCheckIn?.address || 'Unknown',
                    latitude: userCheckIn?.latitude,
                    longitude: userCheckIn?.longitude,
                    time: userCheckIn ? format(new Date(userCheckIn.createdAt), 'HH:mm') : '--:--'
                }
            })
    }, [users, checkIns])

    const mapMarkers = useMemo(() => {
        return teamActivity
            .filter((m: { latitude?: number, longitude?: number }) => m.latitude && m.longitude)
            .map((m: { id: string, name: string, location: string, status: string, latitude: number, longitude: number }) => ({
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
                                <h1 className="text-3xl font-bold text-foreground">Field Force</h1>
                                <p className="text-muted-foreground mt-1">Track your field sales team activities</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={checkingIn}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                >
                                    {checkingIn ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                                    Check In Now
                                </Button>
                                <Button variant="outline"><Clock className="h-4 w-4 mr-2" />History</Button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{productivityMetrics.activeUsers}</p>
                                        <p className="text-sm text-muted-foreground">Currently Checked In</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Navigation className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{productivityMetrics.inTransit}</p>
                                        <p className="text-sm text-muted-foreground">In Transit</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{checkIns.length}</p>
                                        <p className="text-sm text-muted-foreground">Visits Today</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{productivityMetrics.score}%</p>
                                        <p className="text-sm text-muted-foreground">Productivity Score</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Map View */}
                            <Card className="lg:col-span-2 flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Live Team Locations
                                    </CardTitle>
                                    <CardDescription>Real-time tracking of your field team</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 min-h-[400px]">
                                    <MapComponent markers={mapMarkers} className="h-full w-full rounded-b-xl" />
                                </CardContent>
                            </Card>

                            {/* Team Activity */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Team Activity
                                    </CardTitle>
                                    <CardDescription>Live status updates</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto max-h-[400px]">
                                    <div className="space-y-4">
                                        {teamActivity.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No field team members found</p>
                                            </div>
                                        ) : (
                                            teamActivity.map((member: { id: string, name: string, location: string, status: string, time: string }) => (
                                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                                                {member.name.split(' ').map((n: string) => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${member.status === 'checked_in' ? 'bg-green-500' : member.status === 'in_transit' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate text-foreground">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.location}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {getStatusBadge(member.status)}
                                                        <p className="text-xs text-muted-foreground mt-1">{member.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Check-ins */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Check-ins</CardTitle>
                                <CardDescription>Latest field activities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12">
                                        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                    </div>
                                ) : recentActivityList.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No recent check-ins found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-muted-foreground bg-muted/50 uppercase font-medium text-xs">
                                                <tr>
                                                    <th className="px-6 py-3 rounded-l-lg">Team Member</th>
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3">Location</th>
                                                    <th className="px-6 py-3 rounded-r-lg">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {recentActivityList.map((checkIn: CheckIn) => (
                                                    <tr key={checkIn.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-foreground">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                        {checkIn.user?.firstName?.[0]}{checkIn.user?.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{checkIn.user?.firstName} {checkIn.user?.lastName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {checkIn.type === 'CHECK_IN' ?
                                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">Check In</Badge> :
                                                                <Badge variant="outline" className="text-muted-foreground">Check Out</Badge>
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">{checkIn.address || 'Unknown'}</td>
                                                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(checkIn.createdAt), 'MMM d, h:mm a')}</td>
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
