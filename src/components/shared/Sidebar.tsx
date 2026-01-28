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
} from "lucide-react";
import { memo, useState } from "react";

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

export function SidebarContent() {
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
        <div className="flex flex-col h-full bg-card text-card-foreground">
            {/* Logo */}
            <div className="relative flex h-16 items-center px-6 border-b border-border">
                <Link to="/dashboard" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-300 group-hover:scale-105">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-foreground">
                            Leadcept
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium tracking-wider">ENTERPRISE</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 overflow-y-auto py-6 px-4 scrollbar-ocean">
                <div className="space-y-1">
                    {sidebarItems.filter(item => {
                        if (item.title === "Hierarchy") {
                            return user?.role === 'admin' || user?.role === 'super_admin';
                        }
                        if (item.title === "Settings") {
                            return user?.role === 'admin' || user?.role === 'super_admin';
                        }
                        return true;
                    }).map((item, index) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={index}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary-foreground font-semibold bg-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {item.title}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {isSuperAdmin && (
                <div className="px-4 py-2 space-y-1 relative">
                    <Link
                        to="/super-admin"
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
                    >
                        <ShieldCheck className="h-5 w-5" />
                        Super Admin
                    </Link>
                </div>
            )}

            {/* Footer */}
            <div className="relative p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/50 border border-border">
                    <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || 'Loading...'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SidebarComponent({ className }: { className?: string }) {
    return (
        <div className={cn(
            "hidden lg:flex lg:flex-col lg:w-72 bg-card text-card-foreground relative overflow-hidden border-r border-border h-screen",
            className
        )}>
            <SidebarContent />
        </div>
    );
}

export const Sidebar = memo(SidebarComponent);
