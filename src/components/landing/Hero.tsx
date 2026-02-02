import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-50/50 dark:bg-gray-950">

            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                            New: AI-Powered Lead Scoring
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
                            The CRM that <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                actually works for you.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Stop wrestling with spreadsheets. Automate sales, manage relationships, and close deals faster with our AI-driven platform.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all hover:scale-105">
                                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-gray-100 dark:hover:bg-gray-900">
                                    View Demo
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> 14-day free trial
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Cancel anytime
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Dashboard Preview / Floating UI */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative mx-auto max-w-5xl"
                >
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl shadow-2xl p-2 md:p-4">
                        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 aspect-[16/9] flex items-center justify-center text-gray-300 relative">
                            {/* You can replace this placeholder with a real screenshot of the dashboard later */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 flex flex-col">
                                {/* Fake UI Header */}
                                <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4">
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                        <div className="h-3 w-3 rounded-full bg-green-400" />
                                    </div>
                                </div>
                                {/* Fake UI Body */}
                                <div className="flex-1 flex p-6 gap-6">
                                    <div className="w-1/4 space-y-3">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                                        <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded-lg mt-4" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="h-24 flex-1 bg-blue-100 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800" />
                                            <div className="h-24 flex-1 bg-purple-100 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800" />
                                            <div className="h-24 flex-1 bg-green-100 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800" />
                                        </div>
                                        <div className="h-64 w-full bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                            <span className="text-gray-400 font-medium">Interactive Dashboard Preview</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Badges */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute -left-12 top-1/4 hidden lg:flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
                    >
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                            <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Leads Converted</p>
                            <p className="text-xs text-gray-500">+124% this month</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="absolute -right-12 bottom-1/4 hidden lg:flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
                    >
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Enterprise Security</p>
                            <p className="text-xs text-gray-500">SOC2 Type II Ready</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
