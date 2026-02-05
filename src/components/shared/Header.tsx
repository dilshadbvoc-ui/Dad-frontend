import { useNavigate } from "react-router-dom"
import { Settings, Zap } from "lucide-react"
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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut } from "lucide-react"

export function Header({ className }: { className?: string }) {
    const navigate = useNavigate()

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userInitials = userInfo.name
        ? userInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : userInfo.email ? userInfo.email[0].toUpperCase() : 'U';

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 bg-transparent", className)}>

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
                                <Settings className="h-5 w-5 text-indigo-100/70 hover:text-white" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2">
                            <Avatar className="h-9 w-9 border border-indigo-900/50">
                                <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                                <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#1e1b4b] border-indigo-900/50 text-indigo-100" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-white">{userInfo.name}</p>
                                <p className="text-xs leading-none text-indigo-300/60">{userInfo.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-indigo-900/50" />
                        <DropdownMenuItem
                            className="focus:bg-indigo-500 focus:text-white cursor-pointer"
                            onClick={() => navigate(`/users/${userInfo.id || userInfo._id}`)}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="focus:bg-indigo-500 focus:text-white cursor-pointer"
                            onClick={() => navigate('/settings')}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-indigo-900/50" />
                        <DropdownMenuItem
                            className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
