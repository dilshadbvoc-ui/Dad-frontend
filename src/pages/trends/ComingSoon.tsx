import { Sparkles } from "lucide-react";

export function TrendComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[60vh]">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground/70 mt-2">This module is coming soon.</p>
    </div>
  );
}
