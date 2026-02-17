import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, isAdmin, isSuperAdmin } from "@/lib/utils";
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
    CreditCard,
    Smartphone,
    Percent,
    LifeBuoy
} from "lucide-react";
import Logo from "./Logo";
import { memo, useState } from "react";

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
            { title: "Commissions", href: "/sales/commissions", icon: Percent, role: "admin" },
            { title: "Sales Targets", href: "/sales-targets", icon: Trophy },
        ]
    },
    {
        title: "Marketing",
        items: [
            { title: "Campaigns", href: "/marketing", icon: Megaphone, role: "admin" },
            { title: "Ads Manager", href: "/marketing/ads-manager", icon: Megaphone, role: "admin" },
            { title: "WhatsApp", href: "/marketing/whatsapp", icon: MessageSquare, role: "admin" },
            { title: "SMS", href: "/marketing/sms", icon: Smartphone, role: "admin" },
            { title: "Landing Pages", href: "/marketing/landing-pages", icon: Globe, role: "admin" },
            { title: "Web Forms", href: "/marketing/forms", icon: FileText, role: "admin" },
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
            { title: "Hierarchy", href: "/organisation/hierarchy", icon: Users, role: "admin" },
            { title: "Settings", href: "/settings", icon: Settings },
            { title: "Support", href: "/support", icon: LifeBuoy },
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

    const [user] = useState(() => {
        const userStr = localStorage.getItem('userInfo');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { console.error(e); }
        }
        return null;
    });

    const userIsSuperAdmin = isSuperAdmin(user);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (item.role === 'admin' && !isAdmin(user)) return false;
            return true;
        })
    })).filter(group => group.items.length > 0);

    return (
        <div className={cn(
            "flex flex-col h-full bg-sidebar-bg text-sidebar-text transition-all duration-300 border-r border-sidebar-border overflow-hidden",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo & Toggle - Fixed Height Section */}
            <div className={cn(
                "relative flex h-20 items-center shrink-0",
                isCollapsed ? "justify-center px-0" : "justify-between px-6"
            )}>
                <Link to="/dashboard" className="flex items-center gap-3">
                    <Logo size="lg" showText={!isCollapsed} />
                </Link>
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(true)}
                        className="h-8 w-8 text-sidebar-text bg-sidebar-hover/50 hover:text-sidebar-text hover:bg-sidebar-hover rounded-full"
                    >
                        <ChevronLeft className="h-4 w-4 stroke-[3]" />
                    </Button>
                )}

            </div>

            {/* Scrollable Navigation Area */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-ocean overflow-x-hidden">
                <div className="space-y-6">
                    {/* Super Admin Section */}
                    {userIsSuperAdmin && (
                        <div className="mb-2 space-y-1">
                            <Link to="/super-admin" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                pathname === '/super-admin' ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <ShieldCheck className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", pathname === '/super-admin' ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>Dashboard</span>}
                            </Link>
                            <Link to="/super-admin?tab=overview" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                pathname === '/super-admin' && (!location.search || location.search.includes('tab=overview')) ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <Building className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", (pathname === '/super-admin' && (!location.search || location.search.includes('tab=overview'))) ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>Organisations</span>}
                            </Link>
                            <Link to="/super-admin?tab=plans" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                location.search.includes('tab=plans') ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <CreditCard className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", location.search.includes('tab=plans') ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>License Plans</span>}
                            </Link>
                            <Link to="/super-admin/seo" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                pathname.startsWith('/super-admin/seo') ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <Globe className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", pathname.startsWith('/super-admin/seo') ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>SEO Panel</span>}
                            </Link>
                            <Link to="/super-admin?tab=roles" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                location.search.includes('tab=roles') ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <ShieldCheck className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", location.search.includes('tab=roles') ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>System Roles</span>}
                            </Link>
                            <Link to="/settings" className={cn(
                                "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                pathname.startsWith('/settings') ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                            )}>
                                <Settings className={cn("h-5 w-5 shrink-0 transition-colors stroke-[3]", pathname.startsWith('/settings') ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text")} />
                                {!isCollapsed && <span>General Settings</span>}
                            </Link>
                        </div>
                    )}

                    {/* Filtered Grouped Menu */}
                    {filteredGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-3 text-xs font-bold text-sidebar-text/70 uppercase tracking-wider mb-2 mt-2">
                                    {group.title}
                                </div>
                            )}
                            {group.items.map((item, itemIndex) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={itemIndex}
                                        to={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition-all duration-200",
                                            isActive ? "bg-sidebar-active text-sidebar-bg shadow-md" : "text-sidebar-text/80 hover:text-sidebar-text hover:bg-sidebar-hover",
                                            isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 shrink-0 transition-colors stroke-[3]",
                                            isActive ? "text-sidebar-bg" : "text-sidebar-text/70 group-hover:text-sidebar-text"
                                        )} />
                                        {!isCollapsed && <span>{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer - Fixed Height Section */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar-bg mt-auto shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-sidebar-active flex items-center justify-center text-sm font-bold text-sidebar-bg shadow-sm shrink-0">
                        {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-sidebar-text">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-sidebar-text/80 truncate">{user?.email}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 text-sidebar-text/70 hover:text-sidebar-text hover:bg-sidebar-hover shrink-0"
                            >
                                <LogOut className="h-4 w-4 stroke-[3]" />
                            </Button>
                        </>
                    )}
                    {isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-8 w-8 mx-auto text-sidebar-text/70 hover:text-sidebar-text hover:bg-sidebar-hover shrink-0"
                        >
                            <LogOut className="h-4 w-4 stroke-[3]" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SidebarComponent({ className, isCollapsed, setIsCollapsed }: SidebarProps & { className?: string }) {
    return (
        <div className={cn(
            "flex flex-col bg-sidebar-bg relative h-full lg:h-screen transition-all duration-300",
            isCollapsed ? "w-20" : "w-full lg:w-64",
            className
        )}>
            <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Expand Button - Moved outside to avoid clipping */}
            {isCollapsed && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(false)}
                    className="absolute -right-3 top-20 translate-y-2 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background hover:bg-primary/90 z-50 p-0.5"
                >
                    <ChevronRight className="h-3 w-3 stroke-[3]" />
                </Button>
            )}
        </div>
    );
}

export const Sidebar = memo(SidebarComponent);
