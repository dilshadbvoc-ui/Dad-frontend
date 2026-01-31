import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Building,
    Target,
    CheckSquare,
    Megaphone,
    PieChart,
    User,
    Settings,
    LogOut,
    Zap,
    GitBranch,
    MapPin,
    Phone,
    PhoneCall,
    Package,
    FileText,
    Trophy,
    Headphones,
    Calendar,
    Sparkles,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
} from "lucide-react";
import { memo, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: User,
    },
    {
        title: "Contacts",
        href: "/contacts",
        icon: Users,
    },
    {
        title: "Accounts",
        href: "/accounts",
        icon: Building,
    },
    {
        title: "Opportunities",
        href: "/opportunities",
        icon: Target,
    },
    {
        title: "Products",
        href: "/products",
        icon: Package,
    },
    {
        title: "Quotes",
        href: "/quotes",
        icon: FileText,
    },
    {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
    },
    {
        title: "Goals",
        href: "/goals",
        icon: Trophy,
    },
    {
        title: "Sales Targets",
        href: "/sales-targets",
        icon: Target,
    },
    {
        title: "Workflows",
        href: "/workflows",
        icon: GitBranch,
    },
    {
        title: "Automation",
        href: "/automation",
        icon: Zap,
    },
    {
        title: "Field Force",
        href: "/field-force",
        icon: MapPin,
    },
    {
        title: "Marketing",
        href: "/marketing",
        icon: Megaphone,
    },
    {
        title: "Ads Manager",
        href: "/marketing/ads",
        icon: Megaphone,
    },
    {
        title: "Support",
        href: "/support",
        icon: Headphones,
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Communications",
        href: "/communications",
        icon: Phone,
    },
    {
        title: "WhatsApp Inbox",
        href: "/whatsapp/inbox",
        icon: MessageSquare,
    },
    {
        title: "Call Logs",
        href: "/calls",
        icon: PhoneCall,
    },
    {
        title: "AI Writer",
        href: "/ai-writer",
        icon: Sparkles,
    },
    {
        title: "Reports",
        href: "/reports",
        icon: FileText,
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: PieChart,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
    {
        title: "Hierarchy",
        href: "/organisation/hierarchy",
        icon: Users, // Hierarchy icon
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function SidebarContent({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const [user] = useState<{ firstName: string; lastName: string; email: string; role?: string } | null>(() => {
        const userStr = localStorage.getItem('userInfo');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
        return null;
    });

    const [isSuperAdmin] = useState(() => {
        const userStr = localStorage.getItem('userInfo');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                return parsed.role === 'super_admin';
            } catch { return false; }
        }
        return false;
    });

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <TooltipProvider>
            <div className={cn(
                "flex flex-col h-full bg-[#2E3344] text-white transition-all duration-300",
                isCollapsed ? "w-20" : "w-72"
            )}>
                {/* Logo & Toggle */}
                <div className={cn(
                    "relative flex h-20 items-center border-b border-gray-700/50",
                    isCollapsed ? "justify-center px-0" : "justify-between px-6"
                )}>
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4ADE80] text-[#2E3344] font-bold shadow-lg shadow-green-900/20 shrink-0">
                            <span className="text-xl">W</span>
                        </div>
                        {!isCollapsed && (
                            <span className="text-lg font-bold text-white tracking-wide truncate">
                                CRM
                            </span>
                        )}
                    </Link>
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(true)}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(false)}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#4ADE80] text-[#2E3344] shadow-lg border-2 border-[#2E3344] hover:bg-[#4ADE80]/90 z-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="relative flex-1 overflow-y-auto py-6 px-3 scrollbar-ocean overflow-x-hidden">
                    <div className="space-y-1">
                        {/* Super Admin Dashboard Link - Always show at top for Super Admins */}
                        {isSuperAdmin && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        to="/super-admin"
                                        className={cn(
                                            "relative flex items-center gap-4 rounded-r-full py-3 text-sm font-medium transition-all duration-200",
                                            pathname.startsWith('/super-admin')
                                                ? "text-[#4ADE80] bg-gradient-to-r from-[#4ADE80]/10 to-transparent"
                                                : "text-gray-400 hover:text-white hover:bg-white/5",
                                            isCollapsed ? "justify-center px-0 rounded-full mx-auto w-10 h-10" : "px-4"
                                        )}
                                    >
                                        {pathname.startsWith('/super-admin') && !isCollapsed && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4ADE80] rounded-r-full" />
                                        )}
                                        <ShieldCheck className={cn(
                                            "h-5 w-5 transition-colors shrink-0",
                                            pathname.startsWith('/super-admin') ? "text-[#4ADE80]" : "text-gray-500 group-hover:text-white"
                                        )} />
                                        {!isCollapsed && <span className="truncate">Super Admin</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && (
                                    <TooltipContent className="bg-[#2E3344] text-white border-gray-700">
                                        Super Admin
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}

                        {sidebarItems.filter(item => {
                            // Super Admin Logic: Hide everything except Settings
                            if (user?.role === 'super_admin') {
                                return item.title === "Settings";
                            }

                            // Normal User Logic
                            if (item.title === "Hierarchy") {
                                return user?.role === 'admin';
                            }
                            if (item.title === "Settings") {
                                return true;
                            }
                            return true;
                        }).map((item, index) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Content = (
                                <Link
                                    key={index}
                                    to={item.href}
                                    className={cn(
                                        "relative flex items-center gap-4 rounded-r-full py-3 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "text-[#4ADE80] bg-gradient-to-r from-[#4ADE80]/10 to-transparent"
                                            : "text-gray-400 hover:text-white hover:bg-white/5",
                                        isCollapsed ? "justify-center px-0 rounded-full mx-auto w-10 h-10" : "px-4"
                                    )}
                                >
                                    {isActive && !isCollapsed && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4ADE80] rounded-r-full" />
                                    )}
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-colors shrink-0",
                                        isActive ? "text-[#4ADE80]" : "text-gray-500 group-hover:text-white"
                                    )} />
                                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                                </Link>
                            );

                            if (isCollapsed) {
                                return (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            {Content}
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-[#2E3344] text-white border-gray-700">
                                            {item.title}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return Content;
                        })}
                    </div>
                </nav>



                {/* Footer */}
                <div className="relative p-4 border-t border-gray-700/50 mt-auto">
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-9 w-9 rounded-lg bg-[#4ADE80] flex items-center justify-center text-sm font-bold text-[#2E3344]">
                                        {user?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#2E3344] text-white border-gray-700">
                                <p className="font-medium">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                                <p className="text-xs text-gray-400">{user?.email}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-black/20">
                            <div className="h-9 w-9 rounded-lg bg-[#4ADE80] flex items-center justify-center text-sm font-bold text-[#2E3344]">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email || 'Loading...'}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}

function SidebarComponent({ className, isCollapsed, setIsCollapsed }: SidebarProps & { className?: string }) {
    return (
        <div className={cn(
            "hidden lg:flex lg:flex-col bg-[#2E3344] text-white relative h-screen transition-all duration-300",
            isCollapsed ? "w-20" : "w-72",
            className
        )}>
            <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
    );
}

export const Sidebar = memo(SidebarComponent);
