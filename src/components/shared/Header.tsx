import { useNavigate } from "react-router-dom"
import { Settings, Zap, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { GlobalSearch } from "./GlobalSearch"
import { NotificationPopover } from "./NotificationPopover"
import { QuickAddLeadDialog } from "./QuickAddLeadDialog"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { SidebarContent } from "./Sidebar"

export function Header({ className }: { className?: string }) {
    const navigate = useNavigate()

    return (
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 bg-[#F3F4F6] px-6", className)}>
            <div className="flex items-center lg:hidden mr-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground shrink-0" aria-label="Toggle Menu">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-r bg-card">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                        <SidebarContent isCollapsed={false} setIsCollapsed={() => {}} />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="w-full flex-1">
                {/* Search Bar */}
                <GlobalSearch />
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    {/* Quick Add Lead */}
                    <QuickAddLeadDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                    <Zap className="h-5 w-5 fill-current" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Quick Lead</TooltipContent>
                        </Tooltip>
                    </QuickAddLeadDialog>

                    {/* Notifications */}
                    <NotificationPopover />

                    {/* Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/settings')}
                            >
                                <Settings className="h-5 w-5 text-gray-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* User Profile Hook could go here too */}
            </div>
        </header>
    )
}
