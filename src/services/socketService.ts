import { io, Socket } from 'socket.io-client';
// Direct environment access to avoid circular dependency or initialization order issues
const getSocketUrl = () => {
    let url = import.meta.env.VITE_API_URL;

    // If VITE_API_URL is missing/invalid, try to infer from window.location
    if (!url || url === 'null' || url === 'undefined' || url === '/') {
        if (typeof window !== 'undefined' && window.location) {
            const hostname = window.location.hostname;
            if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                url = window.location.origin;
            } else {
                url = 'http://localhost:5001';
            }
        } else {
            url = 'http://localhost:5001';
        }
    }

    // Hard fallback for production if it still somehow ended up as localhost
    if (import.meta.env.PROD && url === 'http://localhost:5001') {
        console.warn('Socket URL fallback to EC2 instance triggered');
        url = 'https://pypecrm.com';
    }

    return url.replace(/\/$/, '').replace(/\/api$/, '');
};

const SOCKET_URL = getSocketUrl();


class SocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        // If a socket already exists (e.g. from a previous user session), tear it down
        // completely before creating a new one. Without this, the old socket stays
        // joined to the previous user's personal room and receives their notifications.
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        const userInfo = localStorage.getItem('userInfo');
        const token = userInfo ? JSON.parse(userInfo).token : null;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true,
            autoConnect: true,
            // Defaulting to auto-upgrade from polling is more reliable in complex network environments
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            auth: {
                token
            }
        });

        this.socket.on('connect', () => {

            this.socket?.emit('join_room', userId);
        });
    }


    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    reconnect() {
        if (this.socket && this.socket.disconnected) {
            this.socket.connect();
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
