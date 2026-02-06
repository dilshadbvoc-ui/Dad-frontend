import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Trophy } from "lucide-react"

export function TopPerformersWidget() {
    const { data: performers = [], isLoading } = useQuery({
        queryKey: ['top-performers'],
        queryFn: async () => {
            try {
                const res = await api.get('/analytics/top-performers');
                console.log('Top Performers Raw:', res.data, 'Is Array:', Array.isArray(res.data));
                // Ensure it's always an array
                return Array.isArray(res.data) ? res.data : [];
            } catch (error) {
                console.error('Error fetching top performers:', error);
                return [];
            }
        }
    });

    // Additional safety check
    const performersList = Array.isArray(performers) ? performers : [];
    
    console.log('Top Performers List:', performersList, 'Length:', performersList.length);

    return (
        <Card className="col-span-2 rounded-3xl bg-gradient-to-br from-indigo-50 to-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-indigo-500" />
                    Top Performers
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        {performersList.map((user: { id: string, name: string, image?: string, dealsWon: number, totalRevenue: number }, index: number) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-orange-50 text-orange-700' : 'text-gray-400'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.dealsWon} deals won</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-700">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(user.totalRevenue)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {performersList.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-8">No performance data yet</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
