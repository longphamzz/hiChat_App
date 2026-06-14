import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import type { SocketState } from '@/types/store';
import { useChatStore } from './useChatStore';
import { useFriendStore } from './useFriendStore';


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

            // a user who just sent a message is no longer typing
            useChatStore.getState().removeTypingUser(message.conversationId, message.senderId);

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
       
        // message edited
        socket.on('message:edited', ({ message }) => {
            useChatStore.getState().updateMessage(message);
        })

        // message unsent for everyone
        socket.on('message:unsent', ({ message }) => {
            useChatStore.getState().updateMessage(message);
        })

        // message deleted for me (targeted to personal room)
        socket.on('message:deletedForMe', ({ messageId, conversationId }) => {
            // remove locally for current user
            useChatStore.getState().removeMessageForUser(conversationId, messageId);
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

        // group members added
        socket.on('group-member-added', ({ conversation, added }) => {
            // update conversation participants and metadata
            useChatStore.getState().updateConversation(conversation);

            const user = useAuthStore.getState().user;
            const amAdded = Array.isArray(added) && added.some((u: any) => u._id === user?._id);

            if (amAdded) {
                // if current user was added, ensure conversation appears and join room
                useChatStore.getState().addConvo(conversation);
                socket.emit('join-conversation', conversation._id);
            }
        })

        // group members removed
        socket.on('group-member-removed', ({ conversation }) => {
            useChatStore.getState().updateConversation(conversation);
        })

        // group removed (for users removed from group)
        socket.on('group-removed', ({ conversationId }) => {
            // remove conversation from store if present
            const exists = useChatStore.getState().conversations.some((c) => c._id === conversationId);
            if (exists) {
                useChatStore.setState((state) => ({
                    conversations: state.conversations.filter((c) => c._id !== conversationId),
                    activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
                }));
            }
        })

        // typing indicators
        socket.on('typing', ({ conversationId, user }) => {
            useChatStore.getState().setTypingUser(conversationId, user);
        })

        socket.on('stop-typing', ({ conversationId, user }) => {
            useChatStore.getState().removeTypingUser(conversationId, user._id);
        })

        // friend request
        socket.on('friend-request', async () => {
            // refresh friend requests list so UI updates
            try {
                await useFriendStore.getState().getAllFriendRequests();
            } catch (err) {
                console.error('Failed to refresh friend requests after friend-request event', err);
            }
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