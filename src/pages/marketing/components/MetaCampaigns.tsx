import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Facebook, Plus, ExternalLink, BarChart3, Users, MousePointer2 } from "lucide-react"

export function MetaCampaigns() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Meta Ads Manager</h3>
                    <p className="text-sm text-muted-foreground">Manage your Facebook and Instagram ad campaigns.</p>
                </div>
                <Button className="bg-[#1877F2] hover:bg-[#166fe5] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ad Campaign
                </Button>
            </div>

            {/* Connection Status Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <Facebook className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200">Not Connected</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Meta Business Suite to see ad performance.</p>
                        </div>
                    </div>
                    <Button variant="default" size="sm" className="gap-2 bg-[#1877F2] hover:bg-[#166fe5]">
                        <ExternalLink className="h-4 w-4" />
                        Connect Account
                    </Button>
                </CardContent>
            </Card>

            {/* Platform Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Reach</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#1877F2]" />
                            <span className="text-2xl font-bold">0</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">-- from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Ad Impressions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                            <span className="text-2xl font-bold">0</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">-- from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Link Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <MousePointer2 className="h-4 w-4 text-orange-600" />
                            <span className="text-2xl font-bold">0</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">-- from last month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign List Placeholder */}
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Campaigns</CardTitle>
                        <CardDescription>Real-time performance of your Meta ads</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-gray-500">
                            <Facebook className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>No active ad campaigns found.</p>
                            <Button variant="link" className="text-[#1877F2]">Sync Campaigns</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
