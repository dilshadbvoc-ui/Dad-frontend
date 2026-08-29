import type { ReactNode } from "react";

export function SectionHeading({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 shrink-0">
        {icon}
        {children}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
