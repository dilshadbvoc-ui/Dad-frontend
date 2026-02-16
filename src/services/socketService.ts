import { io, Socket } from 'socket.io-client';
// Direct environment access to avoid circular dependency or initialization order issues
const getSocketUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // Hard fallback for production if env var is missing/empty but we know we are in prod
    if (import.meta.env.PROD && (!url || url === '/')) {
        console.warn('VITE_API_URL missing or relative in production, defaulting to EC2 instance');
        url = 'http://13.53.145.83';
    }

    return url.replace(/\/$/, '').replace(/\/api$/, '');
};

const SOCKET_URL = getSocketUrl();


class SocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        if (!this.socket) {
            const userInfo = localStorage.getItem('userInfo');
            const token = userInfo ? JSON.parse(userInfo).token : null;



            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: true,
                transports: ['websocket', 'polling'],
                auth: {
                    token
                }
            });

            this.socket.on('connect', () => {

                this.socket?.emit('join_room', userId);
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit<T = unknown>(event: string, data: T) {
        this.socket?.emit(event, data);
    }

    on<T = unknown>(event: string, callback: (data: T) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
