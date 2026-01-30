import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailCampaigns } from "./components/EmailCampaigns"
import { MetaCampaigns } from "./components/MetaCampaigns"
import { WhatsAppCampaigns } from "./components/WhatsAppCampaigns"

export default function MarketingPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Marketing</h1>
                            <p className="text-gray-500 mt-1">Manage all your campaigns in one place.</p>
                        </div>

                        <Tabs defaultValue="email" className="space-y-6">
                            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl">
                                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                    Email Campaigns
                                </TabsTrigger>
                                <TabsTrigger value="meta" className="rounded-lg data-[state=active]:bg-[#1877F2]/10 data-[state=active]:text-[#1877F2]">
                                    Meta Ads
                                </TabsTrigger>
                                <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-[#25D366]/10 data-[state=active]:text-[#25D366]">
                                    WhatsApp
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="email" className="outline-none">
                                <EmailCampaigns />
                            </TabsContent>

                            <TabsContent value="meta" className="outline-none">
                                <MetaCampaigns />
                            </TabsContent>

                            <TabsContent value="whatsapp" className="outline-none">
                                <WhatsAppCampaigns />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
