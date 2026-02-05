import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
};

const textSizeMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
};

export function LoadingSpinner({
    size = "md",
    className,
    text,
    fullScreen = false,
}: LoadingSpinnerProps) {
    const spinner = (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2
                className={cn(
                    sizeMap[size],
                    "animate-spin text-primary"
                )}
            />
            {text && (
                <p className={cn(textSizeMap[size], "text-muted-foreground animate-pulse")}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}

// Inline loading for buttons or small areas
export function InlineLoader({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
    );
}

// Skeleton loading placeholder
export function LoadingPlaceholder({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center p-8", className)}>
            <LoadingSpinner size="lg" text="Loading..." />
        </div>
    );
}

// Page loading state
export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}
