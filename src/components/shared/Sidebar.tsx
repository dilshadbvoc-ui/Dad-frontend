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
    Calendar,
    Sparkles,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
} from "lucide-react";
import { memo, useState, useEffect } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// New Grouped Structure
const menuGroups = [
    {
        title: "Overview",
        items: [
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { title: "Analytics", href: "/analytics", icon: PieChart },
        ]
    },
    {
        title: "Sales Engine",
        items: [
            { title: "Leads", href: "/leads", icon: User },
            { title: "Contacts", href: "/contacts", icon: Users },
            { title: "Accounts", href: "/accounts", icon: Building },
            { title: "Opportunities", href: "/opportunities", icon: Target },
            { title: "Quotes", href: "/quotes", icon: FileText },
            { title: "Products", href: "/products", icon: Package },
            { title: "Sales Targets", href: "/sales-targets", icon: Trophy },
        ]
    },
    {
        title: "Marketing",
        items: [
            { title: "Marketing Hub", href: "/marketing", icon: Megaphone },
            { title: "Ads Manager", href: "/marketing/ads", icon: Megaphone },
            { title: "Email Lists", href: "/marketing/lists", icon: Users },
        ]
    },
    {
        title: "Field Force",
        items: [
            { title: "Field Operations", href: "/field-force", icon: MapPin },
        ]
    },
    {
        title: "Connect",
        items: [
            { title: "WhatsApp", href: "/whatsapp/inbox", icon: MessageSquare },
            { title: "Call Logs", href: "/calls", icon: PhoneCall },
            { title: "Communications", href: "/communications", icon: Phone },
        ]
    },
    {
        title: "Productivity",
        items: [
            { title: "Tasks", href: "/tasks", icon: CheckSquare },
            { title: "Calendar", href: "/calendar", icon: Calendar },
            { title: "Goals", href: "/goals", icon: Trophy },
            { title: "Reports", href: "/reports", icon: FileText },
            { title: "AI Writer", href: "/ai-writer", icon: Sparkles },
        ]
    },
    {
        title: "System",
        items: [
            { title: "Workflows", href: "/workflows", icon: GitBranch },
            { title: "Automation", href: "/automation", icon: Zap },
            { title: "Settings", href: "/settings", icon: Settings },
            { title: "Hierarchy", href: "/organisation/hierarchy", icon: Users, role: "admin" },
        ]
    }
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function SidebarContent({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;
    const [openGroups, setOpenGroups] = useState<string[]>(["Sales Engine", "Overview"]); // Default open

    // Auto-open group based on active route
    useEffect(() => {
        if (isCollapsed) return;
        const activeGroup = menuGroups.find(group =>
            group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
        );
        if (activeGroup && !openGroups.includes(activeGroup.title)) {
            setOpenGroups(prev => [...prev, activeGroup.title]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, isCollapsed]);

    // Toggle function available for future use if accordion-style navigation is needed
    // const toggleGroup = useCallback((title: string) => {
    //     setOpenGroups(prev =>
    //         prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    //     );
    // }, []);

    const [user] = useState<{ firstName: string; lastName: string; email: string; role?: string } | null>(() => {
        const userStr = localStorage.getItem('userInfo');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { console.error(e); }
        }
        return null;
    });

    const isSuperAdmin = user?.role === 'super_admin';

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    // Filter items based on role
    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (isSuperAdmin && item.title !== "Settings") return false;
            if (item.role && item.role !== user?.role) return false;
            return true;
        })
    })).filter(group => group.items.length > 0);

    return (
        <TooltipProvider>
            <div className={cn(
                "flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))] transition-all duration-300 border-r border-[hsl(var(--sidebar-border))]",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Logo & Toggle */}
                <div className={cn(
                    "relative flex h-16 items-center border-b border-[hsl(var(--sidebar-border))]",
                    isCollapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 shrink-0">
                            <span className="text-xl">L</span>
                        </div>
                        {!isCollapsed && (
                            <span className="text-lg font-bold text-[hsl(var(--sidebar-text))] tracking-wide truncate font-sans">
                                LeadHostix
                            </span>
                        )}
                    </Link>
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(true)}
                            className="h-8 w-8 text-indigo-300 hover:text-white hover:bg-white/10"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(false)}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-indigo-600 text-white shadow-lg border border-indigo-400 hover:bg-indigo-500 z-50 p-0.5"
                        >
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="relative flex-1 overflow-y-auto py-4 px-3 scrollbar-ocean overflow-x-hidden space-y-6">

                    {/* Super Admin Link */}
                    {isSuperAdmin && (
                        <div className="mb-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to="/super-admin" className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1",
                                        pathname.startsWith('/super-admin') ? "bg-indigo-600/20 text-indigo-300" : "text-gray-400 hover:text-white hover:bg-white/5",
                                        isCollapsed && "justify-center px-0"
                                    )}>
                                        <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-400" />
                                        {!isCollapsed && <span className="text-sm font-medium">Super Admin</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent>Super Admin</TooltipContent>}
                            </Tooltip>
                        </div>
                    )}

                    {filteredGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-3 text-xs font-semibold text-indigo-400/80 uppercase tracking-wider mb-2 mt-2">
                                    {group.title}
                                </div>
                            )}

                            {group.items.map((item, itemIndex) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const LinkContent = (
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/20"
                                                : "text-indigo-100/70 hover:text-white hover:bg-white/5",
                                            isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-indigo-300 group-hover:text-white"
                                        )} />
                                        {!isCollapsed && <span>{item.title}</span>}
                                    </Link>
                                );

                                if (isCollapsed) {
                                    return (
                                        <Tooltip key={itemIndex}>
                                            <TooltipTrigger asChild>
                                                {LinkContent}
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-indigo-950 border-indigo-800 text-white">
                                                {item.title}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return <div key={itemIndex}>{LinkContent}</div>;
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))]">
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={handleLogout}>
                                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                        {user?.firstName?.charAt(0) || 'U'}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Logout</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-indigo-400 hover:text-white hover:bg-white/10">
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
            "hidden lg:flex lg:flex-col bg-[hsl(var(--sidebar-bg))] relative h-screen transition-all duration-300",
            isCollapsed ? "w-20" : "w-64",
            className
        )}>
            <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
    );
}

export const Sidebar = memo(SidebarComponent);
