import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "User Trend",
    description: "Discover how the calls conversation breaks high over time",
    icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-500/10",
    to: "/trends/user",
  },
  {
    title: "Business Trend",
    description: "Get business insight on conversation calls and lead sources to drive result",
    icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
    color: "bg-purple-500/10",
    to: "/trends/business",
  },
];

export function ToolsSection() {
  return (
    <div className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-foreground">
        Tools to improve efficiency and outcomes
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.title} to={tool.to}>
            <div className="group rounded-[0.8rem] md:rounded-[1.5rem] bg-card shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:scale-[1.01] transition-all">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.color}`}>
                {tool.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-card-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
