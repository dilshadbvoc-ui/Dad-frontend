import { cn } from "@/lib/utils";
import logoOnDark from "@/assets/logo-ondark.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-8 w-8",
    xl: "h-8 w-8",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-xl",
    xl: "text-xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* This component is used on a permanently dark surface (e.g. GetStartedBanner),
            independent of the site's own light/dark theme, so it always renders the
            white-ring mark rather than switching with the theme toggle. */}
        <img
          src={logoOnDark}
          alt="PYPE CRM Logo"
          className="h-full w-full object-contain"
        />
      </div>
      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tighter text-white",
            textClasses[size]
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Pype CRM
        </span>
      )}
    </div>
  );
};

export default Logo;
