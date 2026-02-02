import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let socketInstance: Socket | null = null;

        const initSocket = async () => {
            try {
                const { API_URL } = await import('@/config');

                socketInstance = io(API_URL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling']
                });

                socketInstance.on('connect', () => {
                    setConnected(true);
                });

                socketInstance.on('disconnect', () => {
                    setConnected(false);
                });

                socketInstance.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                });

                setSocket(socketInstance);
            } catch (e) {
                console.error('Failed to initialize socket:', e);
            }
        };

        initSocket();

        return () => {
            if (socketInstance) {
                socketInstance.close();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
