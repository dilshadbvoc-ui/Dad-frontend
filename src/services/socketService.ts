import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config';

const SOCKET_URL = API_URL;

class SocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: true,
                transports: ['websocket']
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

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }
}

export const socketService = new SocketService();
