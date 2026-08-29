import { Link } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound, LogIn, Users, BookOpen } from "lucide-react";
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
    title: "User Login Report",
    description: "Track sign-in activity by user",
    icon: <LogIn className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-500/10",
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
];

export function QuickAccessSection() {
  return (
    <div className="space-y-3">
      <SectionHeading>Quick Access</SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const content = (
            <div className="group rounded-[0.8rem] md:rounded-[1.5rem] bg-card shadow-sm p-4 flex flex-col gap-3 h-full hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm text-card-foreground group-hover:text-[hsl(var(--chart-5))] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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
