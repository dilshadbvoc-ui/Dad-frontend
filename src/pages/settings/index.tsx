import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

import {
    User,
    Users,
    Building,
    FormInput,
    Map,
    GitBranch,
    Star,
    Webhook,
    Bell,
    ArrowRight,
    Shield,
    Upload,
    Phone,
    CreditCard,
    FileText
} from "lucide-react"

const settingsSections = [
    {
        title: "Profile Settings",
        description: "Update your personal information and preferences",
        href: "/settings/profile",
        icon: User,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Organisation Details",
        description: "Manage company profile, address, contact info, and upsell configuration",
        href: "/settings/organisation",
        icon: Building,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Team & Users",
        description: "Manage team members, roles, and permissions",
        href: "/settings/team",
        icon: Users,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Roles & Permissions",
        description: "Configure access control and user roles",
        href: "/settings/roles",
        icon: Shield,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Custom Fields",
        description: "Add custom fields to leads, contacts, and opportunities",
        href: "/settings/custom-fields",
        icon: FormInput,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Territories",
        description: "Define and manage sales territories",
        href: "/settings/territories",
        icon: Map,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Assignment Rules",
        description: "Configure automatic lead and opportunity assignment",
        href: "/settings/assignment-rules",
        icon: GitBranch,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Lead Scoring",
        description: "Set up scoring rules to prioritize leads",
        href: "/settings/lead-scoring",
        icon: Star,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Integrations",
        description: "Manage webhooks, APIs, and third-party integrations",
        href: "/settings/integrations",
        icon: Webhook,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Notifications",
        description: "Configure email and in-app notification preferences",
        href: "/settings/notifications",
        icon: Bell,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Data Migration",
        description: "Import data from CSV files",
        href: "/settings/import",
        icon: Upload,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Call Recording",
        description: "Configure automatic call recording and storage settings",
        href: "/settings/call-recording",
        icon: Phone,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Billing & Subscription",
        description: "Manage plans, invoices, and payment methods",
        href: "/settings/billing",
        icon: CreditCard,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Audit Logs",
        description: "View system activity and security logs",
        href: "/settings/audit-logs",
        icon: FileText,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Sales Pipelines",
        description: "Configure deal stages and sales processes",
        href: "/settings/pipelines",
        icon: GitBranch,
        gradient: "from-indigo-600 to-violet-600"
    },
    {
        title: "Developer / API",
        description: "Connect your website or other tools via API and Webhooks",
        href: "/settings/developer",
        icon: Shield,
        gradient: "from-indigo-600 to-violet-600"
    },
]

export default function SettingsPage() {
    const navigate = useNavigate();
    const [user] = useState<{ role?: string } | null>(() => {
        const userStr = localStorage.getItem('userInfo');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user', e);
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'admin' && user.role !== 'super_admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null; // Or a loading spinner
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your CRM configuration and preferences.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-muted/50 border-border backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">-</p>
                                <p className="text-xs text-muted-foreground">Team Members</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FormInput className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">-</p>
                                <p className="text-xs text-muted-foreground">Custom Fields</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GitBranch className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">-</p>
                                <p className="text-xs text-muted-foreground">Assignment Rules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Webhook className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">-</p>
                                <p className="text-xs text-muted-foreground">Active Integrations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsSections.map((section, index) => (
                    <Link key={index} to={section.href}>
                        <Card className="h-full bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <section.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {section.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
