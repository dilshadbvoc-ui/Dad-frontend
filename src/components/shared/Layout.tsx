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
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname === '/dashboard';
    const isFullWidthPage = location.pathname.startsWith('/automation/workflows') ||
        location.pathname.startsWith('/workflows') ||
        location.pathname.startsWith('/whatsapp') ||
        location.pathname.startsWith('/communications') ||
        location.pathname.startsWith('/opportunities');
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

        const handleNotification = (data: { title: string; message: string; type?: string }) => {
            if (!data) return; // Safeguard against null data

            // Map backend types to sonner toast types
            const type = data.type === 'error' ? 'error' :
                data.type === 'success' ? 'success' :
                    data.type === 'warning' ? 'warning' : 'info';

            toast[type](data.title, {
                description: data.message,
                duration: 5000,
            });

            // Optional: Play a sound?
        };

        socketService.on('call_status_update', handleCallUpdate);
        socketService.on('notification', handleNotification);

        return () => {
            socketService.off('call_status_update');
            socketService.off('notification');
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
                <ErrorBoundary name="Sidebar_V4">
                    <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
                </ErrorBoundary>
            </div>

            {/* Mobile Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <ErrorBoundary name="MobileSidebar_V4">
                    <Sidebar isCollapsed={false} setIsCollapsed={() => { }} />
                </ErrorBoundary>
                {/* Close button inside sidebar for better UX */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 lg:hidden"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
                {/* Standardized Header Container */}
                <div className="flex items-center justify-between bg-card border-b border-border px-2 sm:px-4 h-16 shadow-md shadow-black/5 shrink-0 z-20 relative transition-all duration-300">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden h-10 w-10 text-primary hover:bg-primary/10 transition-colors"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6 transform rotate-90 transition-transform duration-300" />
                        ) : (
                            <Menu className="h-6 w-6 transform rotate-0 transition-transform duration-300" />
                        )}
                    </Button>
                    <ErrorBoundary name="Header">
                        <Header className="flex-1 pl-2 sm:pl-4" />
                    </ErrorBoundary>
                </div>

                <main className={cn(
                    "flex-1 bg-background/50 safe-bottom",
                    isFullWidthPage ? "overflow-hidden flex flex-col" : "overflow-y-auto overflow-x-hidden scrollbar-thin"
                )}>
                    <div className={cn(
                        "w-full max-w-[2000px] mx-auto",
                        isFullWidthPage ? "h-full" : "pb-24 lg:pb-8"
                    )}>
                        {!isDashboard && (
                            <div className="px-4 py-3 lg:px-6 lg:py-4 flex items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(-1)}
                                    className="group flex items-center gap-2 text-muted-foreground hover:text-primary pl-0 hover:bg-transparent transition-colors touch-safe"
                                >
                                    <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <ChevronLeft className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest hidden xs:inline">Back</span>
                                </Button>
                            </div>
                        )}
                        <div className={cn(
                            isFullWidthPage ? "p-0 h-full" : "px-4 sm:px-6 pt-0 sm:pt-4"
                        )}>
                            <ErrorBoundary name="PageContent">
                                <Outlet />
                            </ErrorBoundary>
                        </div>
                    </div>
                </main>
            </div>
            <ErrorBoundary name="ViolationAlert">
                <ViolationAlert />
            </ErrorBoundary>
            <ErrorBoundary name="CommandCenter">
                <CommandCenter />
            </ErrorBoundary>
        </div>
    );
}
