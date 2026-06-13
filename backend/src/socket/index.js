import {Server} from 'socket.io';
import http from 'http'
import express from 'express'
import { socketAuthMiddleware } from '../middlewares/socketMiddleware.js';
import { getUserConversationsForSocketIO } from '../controllers/conversationController.js';
import CallHistory from '../models/CallHistory.js';

// utility to get socket id by user id
const getSocketIdByUserId = (userId) => {
    const entry = onlineUsers.get(userId);
    return entry || null;
}

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map();  //userId: socketId


io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`${user.displayName} online với socketid ${socket.id}`);

    onlineUsers.set(user._id, socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()))

    const conversationIds = await getUserConversationsForSocketIO(user._id)
    conversationIds.forEach((id) => {
        socket.join(id);
    });

    // join personal room for direct targeting
    socket.join(user._id.toString());

    socket.on("join-conversation", (conversationId) => { 
        socket.join(conversationId);
        console.log(`User ${user.displayName} joined new room: ${conversationId}`);
    });
   

    // ---------- Call signaling handlers ----------
    // Caller initiates a call to `to` (userId) with type 'voice' | 'video'
    socket.on('call-user', ({ to, callType, metadata }, cb) => {
        try {
            console.log(`socket:call-user from ${user._id} to ${to} type=${callType}`);
            const targetSocket = getSocketIdByUserId(to);
            const callId = `${socket.id}-${Date.now()}`;
            // send incoming-call to callee
            console.log(`found target socket ${targetSocket}`);
            // emit to the user's personal room (room name = userId)
            io.to(to).emit('incoming-call', {
                callId,
                from: user._id,
                callerName: user.displayName,
                callType,
                metadata,
                startedAt: new Date(),
            });

            // also emit directly to the specific socket id if available
            if (targetSocket) {
                io.to(targetSocket).emit('incoming-call', {
                    callId,
                    from: user._id,
                    callerName: user.displayName,
                    callType,
                    metadata,
                    startedAt: new Date(),
                });
            }

            // ack back to caller with callId
            if (cb) cb({ ok: true, callId });
        } catch (err) {
            console.error('call-user error', err);
            if (cb) cb({ ok: false });
        }
    });

    socket.on('accept-call', ({ callId, to }) => {
        // callee accepted: notify caller
        io.to(to).emit('accept-call', { callId, from: user._id });
    });

    socket.on('reject-call', ({ callId, to }) => {
        io.to(to).emit('reject-call', { callId, from: user._id });
    });

    // WebRTC signaling passthrough
    socket.on('offer', ({ to, offer, callId }) => {
        io.to(to).emit('offer', { from: user._id, offer, callId });
    });

    socket.on('answer', ({ to, answer, callId }) => {
        io.to(to).emit('answer', { from: user._id, answer, callId });
    });

    socket.on('ice-candidate', ({ to, candidate, callId }) => {
        io.to(to).emit('ice-candidate', { from: user._id, candidate, callId });
    });

    // end call: status can be 'completed'|'missed'|'rejected' with duration seconds
    socket.on('end-call', async ({ callId, to, status = 'completed', duration = 0, startedAt, endedAt, callType, otherUser }) => {
        // notify peer
        if (to) io.to(to).emit('end-call', { callId, from: user._id, status, duration });

        // persist call history if data provided
        try {
            if (otherUser) {
                await CallHistory.create({
                    caller: user._id,
                    receiver: otherUser,
                    callType: callType || 'voice',
                    status,
                    duration,
                    startedAt: startedAt ? new Date(startedAt) : undefined,
                    endedAt: endedAt ? new Date(endedAt) : undefined,
                });
            }
        } catch (err) {
            console.error('Failed to persist call history', err);
        }
    });



    socket.join(user._id.toString());

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id);
        io.emit("online-users", Array.from(onlineUsers.keys()))
        console.log(`socket disconnected: ${socket.id}`);
    })
});

export {io, app , server};