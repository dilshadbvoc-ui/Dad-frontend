import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

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
        {/* Light Mode Logo (Visible in Light Mode, Hidden in Dark Mode) */}
        {/* Dark Mode Logo (Hidden in Light Mode, Visible in Dark Mode) */}
        <img
          src={logoDark}
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
