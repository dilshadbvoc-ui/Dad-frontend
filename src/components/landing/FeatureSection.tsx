import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Target,
  Package,
  CheckSquare,
  Bell,
  Calendar,
  Trophy,
  Wallet,
  FileBarChart,
  LayoutDashboard,
  FileText,
  FormInput,
  Globe,
  Megaphone,
  BarChart3,
  MessageCircle,
  Smartphone,
  Phone,
  PhoneCall,
  PhoneForwarded,
  BrainCircuit,
  PenSquare,
  BellRing,
  Bot,
  Lightbulb,
  Search,
  Sparkles,
  MessageSquareText,
  Workflow,
  BellDot,
  UsersRound,
  ShieldCheck,
  SlidersHorizontal,
  ArrowLeftRight,
  Database,
  Copy,
  Plug,
  Webhook,
  FileStack,
  Building,
  CreditCard,
  History,
} from "lucide-react";

const gridItems = [
  { label: "Leads", icon: Users },
  { label: "Contacts", icon: UsersRound },
  { label: "Accounts", icon: Building2 },
  { label: "Opportunities", icon: Target },
  { label: "Products", icon: Package },
  { label: "Tasks", icon: CheckSquare },
  { label: "Follow-ups", icon: Bell },
  { label: "Calendar", icon: Calendar },
  { label: "Sales Targets", icon: Trophy },
  { label: "Commissions", icon: Wallet },

  { label: "Reports", icon: FileBarChart },
  { label: "Dashboards", icon: LayoutDashboard },
  { label: "Templates", icon: FileText },
  { label: "Forms", icon: FormInput },
  { label: "Landing Pages", icon: Globe },
  { label: "Campaigns", icon: Megaphone },

  { label: "Ads Manager", icon: BarChart3 },
  { label: "WhatsApp", icon: MessageCircle },
  { label: "SMS", icon: Smartphone },
  { label: "Call Management", icon: Phone },
  { label: "Call Recording", icon: PhoneCall },
  { label: "Dialer", icon: PhoneForwarded },

  { label: "AI Lead Scoring", icon: BrainCircuit },
  { label: "AI Email Writer", icon: PenSquare },
  { label: "AI Follow-ups", icon: BellRing },
  { label: "AI Chat Assistant", icon: Bot },
  { label: "AI Insights", icon: Lightbulb },
  { label: "Lead Research", icon: Search },

  { label: "Smart Recommendations", icon: Sparkles },
  { label: "Conversation Summaries", icon: MessageSquareText },
  { label: "AI Agents", icon: Workflow },
  { label: "Notifications", icon: BellDot },
  { label: "Teams", icon: UsersRound },
  { label: "Roles & Permissions", icon: ShieldCheck },
];

const bottomRow = [
  { label: "Custom Fields", icon: SlidersHorizontal },
  { label: "Import & Export", icon: ArrowLeftRight },
  { label: "Data Management", icon: Database },
  { label: "Duplicate Detection", icon: Copy },
  { label: "Integrations", icon: Plug },
  { label: "API & Webhooks", icon: Webhook },
  { label: "Documents", icon: FileStack },
  { label: "Branches", icon: Building },
  { label: "Billing & EMI", icon: CreditCard },
  { label: "Audit Logs", icon: History },
];

const allSmallItems = [...gridItems, ...bottomRow];

const heroCards = [
  {
    key: "pipeline",
    title: "Sales Pipeline",
    image: "/All-in-One3.png",
    gridColumn: "3 / span 3",
    gridRow: "2 / span 2",
  },
  {
    key: "ai",
    title: "AI Sales Assistant",
    image: "/All-in-One2.png",
    gridColumn: "6 / span 3",
    gridRow: "2 / span 2",
  },
  {
    key: "inbox",
    title: "Omnichannel Inbox",
    image: "/All-in-One4.png",
    gridColumn: "3 / span 3",
    gridRow: "4 / span 2",
  },
  {
    key: "automation",
    title: "Automation Engine",
    image: "/All-in-One1.png",
    gridColumn: "6 / span 3",
    gridRow: "4 / span 2",
  },
];

function GridCell({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 border-r border-b border-gray-100 px-2 py-4 h-28 hover:z-10 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-[0_8px_14px_-6px_rgba(0,0,0,0.15)] transition-all group">
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
      <span className="text-[11px] leading-tight text-gray-500 text-center">{label}</span>
    </div>
  );
}

function HeroCell({ card, index }: { card: (typeof heroCards)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      style={{ gridColumn: card.gridColumn, gridRow: card.gridRow }}
      className="relative border-r border-b border-gray-100 overflow-hidden"
    >
      <img src={card.image} alt={card.title} className="w-full scale-[1.24] h-full object-cover" />
    </motion.div>
  );
}

export default function FeatureSection() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50 px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            All-in-One CRM
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything your sales team
            <br />
            needs, <span className="text-green-600">in one place.</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            A complete CRM workspace for leads, conversations, automation, AI and revenue operations.
          </p>
        </div>

        {/* Desktop: one continuous grid (spreadsheet style) with 4 hero tiles
            embedded as 2x2 spans in the middle - no outer frame; only the thin
            internal cell borders remain, so it blends straight into the page
            background instead of looking boxed in. */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-10 auto-rows-[7rem]">
            {gridItems.slice(0, 34).map((item) => (
              <GridCell key={item.label} {...item} />
            ))}
            {heroCards.map((card, i) => (
              <HeroCell key={card.key} card={card} index={i} />
            ))}
            {bottomRow.map((item) => (
              <GridCell key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Mobile / tablet: hero tiles first, then the full feature list in a
            simpler bordered grid. */}
        <div className="lg:hidden space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {heroCards.map((card, i) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl overflow-hidden aspect-[3/2]"
              >
                <img src={card.image} alt={card.title} className="w-full h-full object-cover absolute inset-0" />
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4">
            {allSmallItems.map((item) => (
              <GridCell key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
