import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export const initSocket = (httpServer: HttpServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'https://dad-frontend-psi.vercel.app'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    ioInstance = io;

    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            // @ts-ignore
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_this');
            // @ts-ignore
            socket.userId = decoded.id; // Store userId on socket
            // @ts-ignore
            socket.organisationId = decoded.organisationId; // Store organisationId on socket
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        // @ts-ignore
        const userId = socket.userId;
        console.log(`Socket connected: ${socket.id} (User: ${userId})`);

        // Automatically join user room
        if (userId) {
            socket.join(userId);
            // @ts-ignore
            const organisationId = socket.organisationId;
            if (organisationId) {
                socket.join(`org:${organisationId}`);
                console.log(`User ${userId} auto-joined room org:${organisationId}`);
            }
            console.log(`User ${userId} auto-joined room ${userId}`);
        }

        // User joins their personal room (custom manual join if needed)
        socket.on('join_room', (room) => {
            if (userId) {
                console.log(`User ${userId} joining room ${userId}`);
                socket.join(userId);
            }
        });

        // Web Client requests a dial on the Mobile Device
        socket.on('dial_request', (data) => {
            const { userId, phoneNumber, callId } = data;
            console.log(`Dial request for ${userId}: ${phoneNumber} (Call ID: ${callId})`);

            // Forward the request to the specific user's mobile device (in their room)
            // The Mobile App must be listening for 'dial_request'
            io.to(userId).emit('dial_request', {
                phoneNumber,
                callId
            });
        });

        // Mobile Device reports call completion (optional confirmation)
        socket.on('call_completed', (data) => {
            const { userId, callId } = data;
            console.log(`Call completed for ${userId}: ${callId}`);
            // Notify the Web Client (if they are listening in the same room or a web-specific room)
            io.to(userId).emit('call_completed', { callId });
        });

        // Mobile Device reports call connected
        socket.on('call_connected', (data) => {
            // We assume the mobile app sends { phoneNumber, timestamp }
            // We need to know WHICH user this socket belongs to. 
            // Ideally, the mobile socket "joins" the room with the userId on connection.
            // For now, we'll assume the mobile socket joined the room `userId`.
            // But wait, the mobile code emits 'call_connected' but doesn't pass userId explicitly in that event, 
            // relying on the socket being in the room? 
            // Actually, looking at mobile App.tsx, it emits: newSocket.emit('call_connected', ...). 
            // But it doesn't join a room explicitly in the `useEffect` for `callDetector`.
            // It DOES call `checkAuth` but the socket logic is separate.
            // I need to update Mobile App to join the room OR pass userId in the event.

            // *Correction*: The Mobile App creates a NEW socket connection in the `useEffect`. 
            // It does NOT emit `join_room`.
            // I must fix the Mobile App to join the room first. 

            // However, for this step, I will add the server handlers assuming the socket IS identified. 
            // Better yet, I will update the server to broadcast to all clients if I can't identify the user easily 
            // (which is bad security), OR I simply update the Mobile App next.

            // Let's implement generic forwarding first, assuming the socket `handshake.query` or `join_room` happened. 
            // Since I can't change Mobile right this second without a rebuild, I'll rely on the Mobile App sending `userId` in the body?
            // Mobile code: `newSocket.emit('call_connected', { phoneNumber, timestamp })`. No userId.

            // OK, I need to update the Mobile App to `emit('join_room', userId)` in that useEffect hook.
            // But the user just installed the APK. 
            // Is there a way to identify them? Authentication token?
            // The mobile app sends Authorization header in fetch, but socket?

            // To fix this PROPERLY without forcing another immediate valid APK rebuild if possible:
            // The mobile socket connects. It doesn't join a room.
            // So `socket.rooms` only has the socketId.
            // If I want to broadcast to the "Web Client" of the same user... 
            // I need to link them.

            // Valid Plan:
            // 1. Update Server to handle these events.
            // 2. Realize Mobile needs to identify itself.
            // 3. I will have to ask the user to rebuild/update mobile if I want this feature to work.
            // OR, I can use the `token` (JWT) if I pass it in socket options on mobile.

            // Let's look at `App.tsx` again. usage: `const newSocket = io(SERVER_URL);`
            // It does NOT pass the token.
            // So the server doesn't know who the mobile user is.

            // CRITICAL MISS: The mobile app's socket is anonymous. 
            // I MUST update the mobile app to pass the token or userId.

            // Since I just gave the user an APK, this is awkward. 
            // BUT the user asked "add the logic to webcrm to reflect". 
            // I will start with the Server/Web changes. 
            // I will *also* have to update the mobile app to make it work.

            // Server side change:
            // We'll require `userId` in the payload for these events.
            const { userId, phoneNumber, timestamp } = data;
            if (userId) {
                io.to(userId).emit('call_status_update', { status: 'connected', phoneNumber, timestamp });
            }
        });

        socket.on('call_ended', (data) => {
            const { userId, phoneNumber, timestamp, duration } = data;
            if (userId) {
                io.to(userId).emit('call_status_update', { status: 'ended', phoneNumber, timestamp, duration });
            }
        });

        // Collaboration: User joins a specific resource (e.g., Lead page)
        socket.on('join_collaboration', (data) => {
            const { resourceId } = data;
            if (userId && resourceId) {
                socket.join(`collaboration:${resourceId}`);
                console.log(`User ${userId} joined collaboration on ${resourceId}`);

                // Fetch all users currently in this resource room
                // Note: We'll broadcast a 'presence_update' to the room
                io.to(`collaboration:${resourceId}`).emit('presence_update', {
                    resourceId,
                    action: 'join',
                    userId,
                    socketId: socket.id
                });
            }
        });

        socket.on('leave_collaboration', (data) => {
            const { resourceId } = data;
            if (userId && resourceId) {
                socket.leave(`collaboration:${resourceId}`);
                io.to(`collaboration:${resourceId}`).emit('presence_update', {
                    resourceId,
                    action: 'leave',
                    userId,
                    socketId: socket.id
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Note: In a production app, we would ideally track which rooms the user was in
            // and emit 'leave' events for all of them. For now, simple disconnect log.
        });
    });

    return io;
};

let ioInstance: SocketIOServer | null = null;

export const getIO = () => {
    if (!ioInstance) {
        // This relies on initSocket setting it, which we should do
        // Since initSocket returns io, we can't easily capture it inside here unless we assign it.
        // Let's modify initSocket to assign to ioInstance.
        return null;
    }
    return ioInstance;
};
