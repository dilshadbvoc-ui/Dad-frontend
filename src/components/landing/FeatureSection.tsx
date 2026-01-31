import { motion } from "framer-motion";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    BarChart,
    Workflow,
    Bot,
    Globe,
    Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
    {
        title: "Visual Pipeline",
        description: "Drag-and-drop Kanban board to manage deals and visualize your sales process.",
        icon: LayoutDashboard,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "AI Automation",
        description: "Let AI write emails in your brand voice and score leads automatically.",
        icon: Bot,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        title: "Omnichannel Comms",
        description: "Connect WhatsApp, Email, and Calls in one unified inbox.",
        icon: MessageSquare,
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        title: "Team Collaboration",
        description: "Assign roles, track performance, and share notes with your team.",
        icon: Users,
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    {
        title: "Advanced Analytics",
        description: "Deep insights into conversion rates, revenue forecasts, and team targets.",
        icon: BarChart,
        color: "text-pink-500",
        bg: "bg-pink-500/10"
    },
    {
        title: "Workflow Engine",
        description: "Automate repetitive tasks with a powerful trigger-action workflow builder.",
        icon: Workflow,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    {
        title: "Global Reach",
        description: "Multi-currency support and territory management for international sales.",
        icon: Globe,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10"
    },
    {
        title: "Mobile First",
        description: "Full-featured mobile app for field sales teams on the go.",
        icon: Smartphone,
        color: "text-red-500",
        bg: "bg-red-500/10"
    }
];

export default function FeatureSection() {
    return (
        <section id="features" className="py-24 bg-white dark:bg-gray-950 px-4 md:px-6">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4">
                        Everything you need to grow
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        A complete suite of tools designed to help you sell smarter, not harder.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg} group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
