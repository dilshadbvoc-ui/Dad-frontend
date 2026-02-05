import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { ViolationAlert } from "@/components/shared/ViolationAlert";
import { CommandCenter } from "@/components/shared/CommandCenter";

import { socketService } from '@/services/socketService';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname === '/dashboard';
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);

    // Close mobile menu when route changes
    useEffect(() => {
        // Defer to avoid cascading renders during navigation
        const timer = setTimeout(() => {
            setMobileMenuOpen(false);
        }, 0);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        interface CallUpdateData {
            status: 'connected' | 'ended';
            phoneNumber: string;
            duration?: string;
        }

        const handleCallUpdate = (data: CallUpdateData) => {
            // Call Update Received
            if (data.status === 'connected') {
                toast.info(`Call Connected: ${data.phoneNumber}`, {
                    description: 'Call timer started...',
                    duration: Infinity, // Keep open until ended
                    id: 'active-call-toast'
                });
            } else if (data.status === 'ended') {
                toast.dismiss('active-call-toast');
                toast.success(`Call Ended`, {
                    description: `Duration: ${data.duration || 'Unknown'}`,
                });
            }
        };

        socketService.on('call_status_update', handleCallUpdate);

        return () => {
            socketService.off('call_status_update');
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
            </div>

            {/* Mobile Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar isCollapsed={false} setIsCollapsed={() => { }} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Standardized Header Container */}
                <div className="flex items-center justify-between lg:justify-end bg-card border-b border-border px-4 h-16 shadow-md shadow-black/5 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 text-indigo-100"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                    <Header className="flex-1 lg:flex-none" />
                </div>

                <main className="flex-1 overflow-y-auto">
                    <div className="container max-w-7xl mx-auto">
                        {!isDashboard && (
                            <div className="px-4 py-4 lg:px-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(-1)}
                                    className="group flex items-center gap-2 text-indigo-400/60 hover:text-white pl-0 hover:bg-transparent transition-colors"
                                >
                                    <div className="p-1 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                        <ChevronLeft className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-xs uppercase tracking-wider">Back</span>
                                </Button>
                            </div>
                        )}
                        <div className={cn(
                            "px-4 pb-8 lg:px-6",
                            isDashboard ? "pt-6" : "pt-0"
                        )}>
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
            <ViolationAlert />
            <CommandCenter />
        </div>
    );
}

