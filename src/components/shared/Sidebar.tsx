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
    RefreshCw,
    AlertTriangle,
    Globe,
    CreditCard
} from "lucide-react";
import Logo from "./Logo";
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
            { title: "Re-Enquiries", href: "/re-enquiries", icon: RefreshCw, role: "admin" },
            { title: "Duplicates", href: "/duplicates", icon: AlertTriangle, role: "admin" },
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
            { title: "Marketing Hub", href: "/marketing", icon: Megaphone, role: "admin" },
            { title: "Ads Manager", href: "/marketing/ads-manager", icon: Megaphone, role: "admin" },
            { title: "Email Lists", href: "/marketing/lists", icon: Users, role: "admin" },
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
    console.log('Sidebar Debug:', { user, role: user?.role, isSuperAdmin });

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    // Filter items based on role
    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (isSuperAdmin && item.title !== "Settings") return false;
            // Check if item requires admin role
            if (item.role === 'admin' && user?.role !== 'admin' && user?.role !== 'super_admin') return false;
            if (item.role && item.role !== 'admin' && item.role !== user?.role) return false;
            return true;
        })
    })).filter(group => group.items.length > 0);

    return (
        <TooltipProvider>
            <div className={cn(
                "flex flex-col h-full bg-sidebar-bg text-sidebar-text transition-all duration-300 border-r border-sidebar-border",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Logo & Toggle */}
                <div className={cn(
                    "relative flex h-20 items-center",
                    isCollapsed ? "justify-center px-0" : "justify-between px-6"
                )}>
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <Logo size="lg" showText={!isCollapsed} />
                    </Link>
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(true)}
                            className="h-8 w-8 text-muted-foreground hover:text-sidebar-text hover:bg-sidebar-hover rounded-full"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(false)}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background hover:bg-primary/90 z-50 p-0.5"
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
                                        pathname === '/super-admin' ? "bg-sidebar-active/10 text-sidebar-active" : "text-sidebar-text/60 hover:text-sidebar-text hover:bg-sidebar-hover",
                                        isCollapsed && "justify-center px-0"
                                    )}>
                                        <ShieldCheck className="h-5 w-5 shrink-0 text-sidebar-active" />
                                        {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent>Dashboard</TooltipContent>}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to="/super-admin?tab=overview" className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1",
                                        pathname === '/super-admin' && (!location.search || location.search.includes('tab=overview')) ? "bg-sidebar-active/10 text-sidebar-active" : "text-sidebar-text/60 hover:text-sidebar-text hover:bg-sidebar-hover",
                                        isCollapsed && "justify-center px-0"
                                    )}>
                                        <Building className="h-5 w-5 shrink-0 text-sidebar-active" />
                                        {!isCollapsed && <span className="text-sm font-medium">Organisations</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent>Organisations</TooltipContent>}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to="/super-admin?tab=plans" className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1",
                                        location.search.includes('tab=plans') ? "bg-sidebar-active/10 text-sidebar-active" : "text-sidebar-text/60 hover:text-sidebar-text hover:bg-sidebar-hover",
                                        isCollapsed && "justify-center px-0"
                                    )}>
                                        <CreditCard className="h-5 w-5 shrink-0 text-sidebar-active" />
                                        {!isCollapsed && <span className="text-sm font-medium">License Plans</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent>License Plans</TooltipContent>}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to="/super-admin/seo" className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1",
                                        pathname.startsWith('/super-admin/seo') ? "bg-sidebar-active/10 text-sidebar-active" : "text-sidebar-text/60 hover:text-sidebar-text hover:bg-sidebar-hover",
                                        isCollapsed && "justify-center px-0"
                                    )}>
                                        <Globe className="h-5 w-5 shrink-0 text-sidebar-active" />
                                        {!isCollapsed && <span className="text-sm font-medium">SEO Panel</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent>SEO Panel</TooltipContent>}
                            </Tooltip>
                        </div>
                    )}

                    {filteredGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-3 text-xs font-semibold text-sidebar-text/50 uppercase tracking-wider mb-2 mt-2">
                                    {group.title}
                                </div>
                            )}

                            {group.items.map((item, itemIndex) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const LinkContent = (
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                            isActive
                                                ? "bg-sidebar-active text-sidebar-bg shadow-md"
                                                : "text-sidebar-text/70 hover:text-sidebar-text hover:bg-sidebar-hover",
                                            isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : ""
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 shrink-0 transition-colors",
                                            isActive ? "text-sidebar-bg" : "text-sidebar-text/50 group-hover:text-sidebar-text"
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
                                            <TooltipContent className="bg-popover text-popover-foreground border-border">
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
                <div className="p-4 border-t border-sidebar-border bg-sidebar-bg mt-auto shrink-0">
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={handleLogout}>
                                    <div className="h-8 w-8 rounded-lg bg-sidebar-active flex items-center justify-center text-xs font-bold text-sidebar-bg shadow-sm">
                                        {user?.firstName?.charAt(0) || 'U'}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Logout</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-sidebar-active flex items-center justify-center text-sm font-bold text-sidebar-bg shadow-sm">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-sidebar-text">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-sidebar-text/60 truncate">{user?.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-sidebar-text/50 hover:text-sidebar-text hover:bg-sidebar-hover">
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
            "flex flex-col bg-[hsl(var(--sidebar-bg))] relative h-full lg:h-screen transition-all duration-300",
            isCollapsed ? "w-20" : "w-full lg:w-64", // Full width on mobile when shown
            className
        )}>
            <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
    );
}

export const Sidebar = memo(SidebarComponent);

