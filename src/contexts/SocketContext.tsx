import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';


import { SocketContext } from './SocketContextObject';


export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let socketInstance: Socket | null = null;

        const manageConnection = async () => {
            const userInfoStr = localStorage.getItem('userInfo');

            // Case 1: Connect if authenticated and not connected
            if (userInfoStr && !socketInstance) {
                try {
                    const { API_URL } = await import('@/config');
                    let token = null;
                    try {
                        const userInfo = JSON.parse(userInfoStr);
                        token = userInfo.token;
                    } catch (e) {
                        console.error('Error parsing userInfo for socket:', e);
                        return;
                    }

                    if (!token) return;

                    socketInstance = io(API_URL, {
                        withCredentials: true,
                        transports: ['websocket', 'polling'],
                        auth: { token }
                    });

                    socketInstance.on('connect', () => {
                        setConnected(true);
                    });

                    socketInstance.on('disconnect', () => {
                        setConnected(false);
                    });

                    socketInstance.on('connect_error', (error) => {
                        // Suppress 401 errors globally or log them?
                        // Log mostly for debugging, but prevent spam if possible?
                        // User complained about spam.
                        // If token is invalid (expired), we might want to close socket to stop retry spam?
                        console.error('Socket connection error:', error.message);
                    });

                    setSocket(socketInstance);
                } catch (e) {
                    console.error('Failed to initialize socket:', e);
                }
            }
            // Case 2: Disconnect if logged out and connected
            else if (!userInfoStr && socketInstance) {
                socketInstance.close();
                socketInstance = null;
                setSocket(null);
                setConnected(false);
            }
        };

        manageConnection(); // Initial check
        const intervalId = setInterval(manageConnection, 2000); // Poll every 2s for login/logout state

        return () => {
            clearInterval(intervalId);
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
