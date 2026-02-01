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
        gradient: "from-blue-500 to-blue-600"
    },
    {
        title: "Organisation Details",
        description: "Manage company profile, address, contact info, and upsell configuration",
        href: "/settings/organisation",
        icon: Building,
        gradient: "from-teal-500 to-teal-600"
    },
    {
        title: "Team & Users",
        description: "Manage team members, roles, and permissions",
        href: "/settings/team",
        icon: Users,
        gradient: "from-purple-500 to-purple-600"
    },
    {
        title: "Roles & Permissions",
        description: "Configure access control and user roles",
        href: "/settings/roles",
        icon: Shield,
        gradient: "from-indigo-500 to-indigo-600"
    },
    {
        title: "Custom Fields",
        description: "Add custom fields to leads, contacts, and opportunities",
        href: "/settings/custom-fields",
        icon: FormInput,
        gradient: "from-green-500 to-green-600"
    },
    {
        title: "Territories",
        description: "Define and manage sales territories",
        href: "/settings/territories",
        icon: Map,
        gradient: "from-orange-500 to-orange-600"
    },
    {
        title: "Assignment Rules",
        description: "Configure automatic lead and opportunity assignment",
        href: "/settings/assignment-rules",
        icon: GitBranch,
        gradient: "from-pink-500 to-pink-600"
    },
    {
        title: "Lead Scoring",
        description: "Set up scoring rules to prioritize leads",
        href: "/settings/lead-scoring",
        icon: Star,
        gradient: "from-yellow-500 to-amber-600"
    },
    {
        title: "Integrations",
        description: "Manage webhooks, APIs, and third-party integrations",
        href: "/settings/integrations",
        icon: Webhook,
        gradient: "from-cyan-500 to-cyan-600"
    },
    {
        title: "Notifications",
        description: "Configure email and in-app notification preferences",
        href: "/settings/notifications",
        icon: Bell,
        gradient: "from-red-500 to-red-600"
    },
    {
        title: "Data Migration",
        description: "Import data from CSV files",
        href: "/settings/import",
        icon: Upload,
        gradient: "from-gray-500 to-gray-600"
    },
    {
        title: "Call Recording",
        description: "Configure automatic call recording and storage settings",
        href: "/settings/call-recording",
        icon: Phone,
        gradient: "from-emerald-500 to-teal-600"
    },
    {
        title: "Billing & Subscription",
        description: "Manage plans, invoices, and payment methods",
        href: "/settings/billing",
        icon: CreditCard,
        gradient: "from-yellow-400 to-orange-500"
    },
    {
        title: "Audit Logs",
        description: "View system activity and security logs",
        href: "/settings/audit-logs",
        icon: FileText,
        gradient: "from-slate-500 to-slate-600"
    },
    {
        title: "Developer / API",
        description: "Connect your website or other tools via API and Webhooks",
        href: "/settings/developer",
        icon: Shield,
        gradient: "from-blue-600 to-indigo-700"
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
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Settings</h1>
                            <p className="text-gray-500 mt-1">Manage your CRM configuration and preferences.</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">-</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Team Members</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <FormInput className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">-</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">Custom Fields</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">-</p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400">Assignment Rules</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <Webhook className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">-</p>
                                            <p className="text-xs text-orange-600 dark:text-orange-400">Active Integrations</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Settings Cards Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {settingsSections.map((section, index) => (
                                <Link key={index} to={section.href}>
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                                    <section.icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {section.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {section.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
