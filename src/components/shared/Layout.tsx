import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { ViolationAlert } from "@/components/shared/ViolationAlert";

import { socketService } from '@/services/socketService';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname === '/dashboard';

    useEffect(() => {
        interface CallUpdateData {
            status: 'connected' | 'ended';
            phoneNumber: string;
            duration?: string;
        }

        const handleCallUpdate = (data: CallUpdateData) => {
            console.log('Call Update:', data);
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
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {!isDashboard && (
                        <div className="container mx-auto px-6 py-4 pb-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
                            >
                                <div className="p-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Back</span>
                            </Button>
                        </div>
                    )}
                    <div className={cn("container mx-auto p-4 md:p-6 pt-4", isDashboard && "md:pt-6")}>
                        <Outlet />
                    </div>
                </main>
            </div>
            <ViolationAlert />
        </div>
    );
}

