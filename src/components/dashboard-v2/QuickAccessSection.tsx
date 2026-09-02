import { Link } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound, LogIn, Users, BookOpen, BarChart3, Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface QuickAccessItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  to?: string;
}

const items: QuickAccessItem[] = [
  {
    title: "User Code Report",
    description: "Track per-user activity codes",
    icon: <KeyRound className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-500/10",
  },
  {
    title: "Lead Reports",
    description: "Lead volume, sources and outcomes",
    icon: <Users className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-500/10",
    to: "/reports/leads",
  },
  {
    title: "Sales Book",
    description: "Transaction logs & history",
    icon: <BookOpen className="h-5 w-5 text-rose-500" />,
    color: "bg-rose-500/10",
    to: "/reports/sales-book",
  },
  {
    title: "Daily Report",
    description: "Today's exact metrics",
    icon: <BarChart3 className="h-5 w-5 text-[#69a63a]" />,
    color: "bg-[#69a63a]/10",
    to: "/reports/daily",
  },
  {
    title: "User Total",
    description: "Efficiency & metrics summary",
    icon: <Trophy className="h-5 w-5 text-blue-600" />,
    color: "bg-blue-600/10",
    to: "/reports/user-total",
  },
  {
    title: "User Sales",
    description: "Performance leaderboard",
    icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-500/10",
    to: "/reports/user-sales",
  },
];

export function QuickAccessSection() {
  return (
    <div className="space-y-3">
      <SectionHeading>Quick Access</SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const content = (
            <div className="group relative h-16 rounded-[0.8rem] md:rounded-none overflow-hidden flex items-stretch hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
              <ArrowUpRight strokeWidth={1} className="absolute top-1 right-1 h-6 w-6 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              <div className={`flex w-16 h-16 shrink-0 items-center justify-center ${item.color}`}>
                <div className="scale-125">{item.icon}</div>
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center bg-transparent pl-4 pr-8">
                <h3 className="font-medium font-poppins text-sm text-card-foreground truncate transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-poppins text-muted-foreground mt-0.5 truncate">{item.description}</p>
              </div>
            </div>
          );

          if (item.to) {
            return (
              <Link key={item.title} to={item.to}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.title}
              type="button"
              className="text-left"
              onClick={() => toast.info(`${item.title} is coming soon.`)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
