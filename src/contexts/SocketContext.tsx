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
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) return;

        try {
            const parsed = JSON.parse(userInfo);
            const token = parsed.token;

            if (!token) return;

            const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const newSocket = io(SERVER_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } catch (e) {
            console.error('Failed to initialize socket:', e);
        }
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
