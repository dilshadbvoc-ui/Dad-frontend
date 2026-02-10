import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '@/services/socketService';


import { SocketContext } from './SocketContextObject';


export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const userInfoStr = localStorage.getItem('userInfo');

        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                if (userInfo.token) {
                    // Use the singleton service to connect
                    socketService.connect(userInfo.id || userInfo._id);

                    // Sync state from service
                    const socketInstance = socketService.getSocket();
                    if (socketInstance) {
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setSocket(socketInstance);
                        setConnected(socketInstance.connected);
                    }

                    socketService.on('connect', () => setConnected(true));
                    socketService.on('disconnect', () => setConnected(false));
                }
            } catch (e) {
                console.error('Error parsing userInfo for socket:', e);
            }
        }

        return () => {
            socketService.disconnect();
            setConnected(false);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
