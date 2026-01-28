import { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getMetaCampaigns, getMetaInsights, type MetaCampaign } from '@/services/adService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ExternalLink, Plus, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdsDashboard() {

    const { data: campaigns, isLoading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useQuery({
        queryKey: ['meta-campaigns'],
        queryFn: getMetaCampaigns
    });

    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['meta-insights', 'account'],
        queryFn: () => getMetaInsights('account')
    });

    const accountInsights = insights && insights.length > 0 ? insights[0] : null;

    if (campaignsError) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Ads</AlertTitle>
                    <AlertDescription>
                        Failed to load Meta Ads data. Please check your integration settings and ensure your Access Token and Ad Account ID are correct.
                        <br />
                        {(campaignsError as AxiosError<{ message: string }>).response?.data?.message || (campaignsError as Error).message}
                    </AlertDescription>
                </Alert>
                <div className="mt-4">
                    <Button variant="outline" onClick={() => window.location.href = '/settings/integrations'}>
                        Go to Settings
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Ads Manager</h1>
                                <p className="text-gray-500">Manage your Meta (Facebook & Instagram) campaigns.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <Button size="sm" onClick={() => window.open('https://adsmanager.facebook.com/ads/create', '_blank')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Campaign
                                </Button>
                                <Button size="sm" onClick={() => window.open('https://adsmanager.facebook.com/', '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Meta Ads Manager
                                </Button>
                            </div>
                        </div>

                        {/* Overview Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spend (30d)</CardTitle>
                                    <span className="text-muted-foreground">$</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {insightsLoading ? '...' : accountInsights ? `$${accountInsights.spend}` : '$0.00'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Last 30 days
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {insightsLoading ? '...' : accountInsights ? parseInt(accountInsights.impressions).toLocaleString() : '0'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {insightsLoading ? '...' : accountInsights ? parseInt(accountInsights.clicks).toLocaleString() : '0'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        CTR: {insightsLoading ? '...' : accountInsights ? `${parseFloat(accountInsights.ctr).toFixed(2)}%` : '0%'}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">CPC</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {insightsLoading ? '...' : accountInsights ? `$${parseFloat(accountInsights.cpc).toFixed(2)}` : '$0.00'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="campaigns" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                                <TabsTrigger value="adsets" disabled>Ad Sets (Coming Soon)</TabsTrigger>
                                <TabsTrigger value="ads" disabled>Ads (Coming Soon)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="campaigns" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Campaigns</CardTitle>
                                        <CardDescription>
                                            View and manage your active campaigns.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {campaignsLoading ? (
                                            <div className="py-10 text-center">Loading campaigns...</div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Objective</TableHead>
                                                        <TableHead>Budget</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {campaigns && campaigns.length > 0 ? (
                                                        campaigns.map((campaign: MetaCampaign) => (
                                                            <TableRow key={campaign.id}>
                                                                <TableCell>
                                                                    <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className={campaign.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                                        {campaign.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    {campaign.name}
                                                                    <div className="text-xs text-muted-foreground">ID: {campaign.id}</div>
                                                                </TableCell>
                                                                <TableCell>{campaign.objective}</TableCell>
                                                                <TableCell>
                                                                    {campaign.daily_budget ? `$${(parseInt(campaign.daily_budget) / 100).toFixed(2)} / day` : campaign.lifetime_budget ? `$${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)} lifetime` : '-'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {/* Placeholder for actions */}
                                                                    <Button variant="ghost" size="sm">
                                                                        Details
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-24 text-center">
                                                                No campaigns found.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>
                </main>
            </div>
        </div>
    )
}
