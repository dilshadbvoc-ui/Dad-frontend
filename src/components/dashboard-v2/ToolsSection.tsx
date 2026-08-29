import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const tools = [
  {
    title: "User Trend",
    description: "Discover how the calls conversation breaks high over time",
    icon: <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-300" />,
    cardClass: "bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/40 dark:to-indigo-950/40",
    iconBg: "bg-white/60 dark:bg-white/10",
    to: "/trends/user",
  },
  {
    title: "Business Trend",
    description: "Get business insight on conversation calls and lead sources to drive result",
    icon: <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-300" />,
    cardClass: "bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/40",
    iconBg: "bg-white/60 dark:bg-white/10",
    to: "/trends/business",
  },
];

export function ToolsSection() {
  return (
    <div className="space-y-3">
      <SectionHeading>Tools to improve efficiency and outcomes</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.title} to={tool.to}>
            <div className={`group rounded-[0.8rem] md:rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-md hover:scale-[1.01] transition-all ${tool.cardClass}`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.iconBg}`}>
                {tool.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-foreground">
                  {tool.title}
                </h3>
                <p className="text-xs text-foreground/70 mt-0.5">{tool.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/60 shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
