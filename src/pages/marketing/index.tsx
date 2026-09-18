import { useState } from "react"
import { Mail, Facebook, MessageCircle, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmailCampaigns } from "./components/EmailCampaigns"
import { MetaCampaigns } from "./components/MetaCampaigns"
import { WhatsAppCampaigns } from "./components/WhatsAppCampaigns"

type Channel = "email" | "meta" | "whatsapp"

const CHANNELS: { id: Channel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email Campaigns", icon: Mail },
  { id: "meta", label: "Meta Ads", icon: Facebook },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
]

export default function MarketingPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>("email")

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">Marketing Studio</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Multi-channel campaign management and automation</p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex bg-muted/60 p-1 rounded-[10px] shrink-0 w-fit max-w-full overflow-x-auto">
        {CHANNELS.map((channel) => (
          <Button
            key={channel.id}
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setActiveChannel(channel.id)}
            className={cn(
              "rounded-[8px] h-8 px-3 text-xs font-semibold transition-all gap-1.5 shrink-0",
              activeChannel === channel.id ? "bg-white text-[hsl(var(--chart-5))] shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <channel.icon className="h-3.5 w-3.5" />
            {channel.label}
          </Button>
        ))}
      </div>

      {activeChannel === "email" && <EmailCampaigns />}
      {activeChannel === "meta" && <MetaCampaigns />}
      {activeChannel === "whatsapp" && <WhatsAppCampaigns />}
    </div>
  )
}
