import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import logoWhite from "@/assets/logo-white.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  /** Force the all-white mark + white text, for placing directly on a brand-color or dark
   * background (e.g. the login page's green panel) where the normal light/dark-mode swap
   * (which keeps the green arrow) wouldn't have enough contrast. */
  variant?: "auto" | "onColor";
}

const Logo = ({ className, size = "md", showText = true, variant = "auto" }: LogoProps) => {
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

  if (variant === "onColor") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("relative", sizeClasses[size])}>
          <img
            src={logoWhite}
            alt="PYPE CRM Logo"
            className="h-full w-full object-contain"
          />
        </div>
        {showText && (
          <span
            className={cn("font-extrabold tracking-tighter text-white", textClasses[size])}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Pype CRM
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Light Mode Logo (Visible in Light Mode, Hidden in Dark Mode) */}
        <img
          src={logoLight}
          alt="PYPE CRM Logo"
          className="h-full w-full object-contain dark:hidden"
        />
        {/* Dark Mode Logo (Hidden in Light Mode, Visible in Dark Mode) */}
        <img
          src={logoDark}
          alt="PYPE CRM Logo"
          className="h-full w-full object-contain hidden dark:block"
        />
      </div>
      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tighter text-black",
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
