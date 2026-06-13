import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import type { SocketState } from '@/types/store';
import { useChatStore } from './useChatStore';
import { use } from 'react';

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    onlineUsers: [],
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        if (existingSocket) return;

        const socket: Socket = io(baseURL, {
            auth: { token: accessToken },
            transports: ["websocket"]
        })
        set({ socket });

        socket.on("connect", () => {
            console.log("Kết nối socket thành công")
        });

        //onl users
        socket.on("online-users", (userIds) => {
            set({ onlineUsers: userIds });
        })

        // new mess
        socket.on("new-message", async ({message, conversation, unreadCounts}) => {
            useChatStore.getState().addMessage(message);

            const lastMessage = {
                _id: conversation.lastMessage._id,
                content: conversation.lastMessage.content,
                createdAt: conversation.lastMessage.createdAt,
                sender: {
                    _id: conversation.lastMessage.senderId,
                    displayName: "",
                    avatarUrl: null
                }
            }

            const updatedConversation = {
                ...conversation, lastMessage, unreadCounts
            }

            const exists = useChatStore.getState().conversations.some((c) => c._id === conversation._id);

            if (!exists) {
                // If this client doesn't have the conversation yet, re-fetch conversations
                // so the UI gets the full conversation data (participants, names, avatars).
                try {
                    await useChatStore.getState().fetchConversations();
                } catch (err) {
                    console.error('Failed to refresh conversations on new-message', err);
                }

                // ensure the socket joins the conversation room so future emits arrive in the room
                socket.emit('join-conversation', conversation._id);
            }

            if (useChatStore.getState().activeConversationId === message.conversationId){
                //danh dau da doc
                useChatStore.getState().markAsSeen();
            }

            useChatStore.getState().updateConversation(updatedConversation);
        })
       

        //read mess
        socket.on('read-messages', ({ conversation, lastMessage }) => {
            const updated = {
                _id: conversation._id,
                lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCounts: conversation.unreadCounts,
                seenBy: conversation.seenBy,
            };

            useChatStore.getState().updateConversation(updated);
        })

        // new group chat
        socket.on("new-group", (conversation) => {
            useChatStore.getState().addConvo(conversation);
            socket.emit('join-conversation', conversation._id);
        })

    },
    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null })
        }
    }

})) 