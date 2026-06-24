import { chatService } from '@/services/chatService';
import type { ChatState } from '@/types/store';
import { create } from 'zustand';
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false, //convo loading
            messageLoading: false,
            loading: false,
            typingUsers: {},
            searchQuery: '',

            setActiveConversation: (id) => set({ activeConversationId: id }),
            reset: () => {
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    convoLoading: false,
                    messageLoading: false,
                    typingUsers: {},
                    searchQuery: '',
                });
            },
            fetchConversations: async () => {
                try {
                    set({ convoLoading: true });
                    const { conversations } = await chatService.fetchConversations();

                    set({ conversations, convoLoading: false });
                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchConversations:", error);
                    set({ convoLoading: false });
                }
            },

            fetchMessages: async (conversationId) => {
                const { activeConversationId, messages } = get();
                const { user } = useAuthStore.getState();

                const convoId = conversationId ?? activeConversationId;

                if (!convoId) return;

                const current = messages?.[convoId];
                const nextCursor =
                    current?.nextCursor === undefined ? "" : current?.nextCursor;

                if (nextCursor === null) return;

                set({ messageLoading: true });

                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(
                        convoId,
                        nextCursor
                    );

                    const processed = fetched.map((m) => ({
                        ...m,
                        isOwn: m.senderId === user?._id,
                    }));

                    set((state) => {
                        const prev = state.messages[convoId]?.items ?? [];
                        const merged = prev.length > 0 ? [...processed, ...prev] : processed;

                        // deduplicate by _id, preserve order (first occurrence wins)
                        const seen = new Set();
                        const unique = [];
                        for (const m of merged) {
                            if (!seen.has(m._id)) {
                                seen.add(m._id);
                                unique.push(m);
                            }
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: unique,
                                    hasMore: !!cursor,
                                    nextCursor: cursor ?? null,
                                },
                            },
                        };
                    });
                } catch (error) {

                    console.error("Loi khi fetchmessage", error);


                } finally {
                    set({ messageLoading: false })
                }
            },

            sendDirectMessage: async (recipientId, content, imgUrl) => {
                try {
                    const { activeConversationId } = get();
                    await chatService.sendDirectMessage(recipientId, content, imgUrl, activeConversationId || undefined)

                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === activeConversationId ? { ...c, seenBy: [] } : c)
                    }))
                } catch (error) {
                    console.error("Loi khi sendDirectMessage", error)

                }

            },

            sendGroupMessage: async (conversationId, content, imgUrl) => {
                try {
                    await chatService.sendGroupMessage(conversationId, content, imgUrl);
                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === get().activeConversationId ? { ...c, seenBy: [] } : c)

                    }))

                } catch (error) {
                    console.error("Loi khi sendGroupMessage", error)

                }

            },

            addMessage: async (message) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    // if this message was deleted for current user, ignore
                    if (message.deletedBy && Array.isArray(message.deletedBy) && message.deletedBy.includes(user?._id)) {
                        return;
                    }

                    message.isOwn = message.senderId === user?._id;

                    const convoId = message.conversationId;

                    let prevItems = get().messages[convoId]?.items ?? [];

                    if (prevItems.length === 0) {
                        await fetchMessages(message.conversationId);
                        prevItems = get().messages[convoId]?.items ?? [];
                    }

                    set((state) => {
                        // merge prevItems and new message, dedupe by _id
                        const combined = [...prevItems, message];
                        const seen = new Set();
                        const unique = [];
                        for (const m of combined) {
                            if (!seen.has(m._id)) {
                                seen.add(m._id);
                                unique.push(m);
                            }
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: unique,
                                    hasMore: state.messages[convoId]?.hasMore,
                                    nextCursor: state.messages[convoId]?.nextCursor ?? undefined,
                                }
                            }
                        }
                    })

                } catch (error) {
                    console.error("Lỗi xảy ra khi add mess", error)


                }
            },

            updateMessage: (message) => {
                const convoId = message.conversationId;
                set((state) => {
                    const items = state.messages[convoId]?.items ?? [];
                    const updated = items.map((m) => (m._id === message._id ? { ...m, ...message } : m));
                    return {
                        messages: {
                            ...state.messages,
                            [convoId]: {
                                ...state.messages[convoId],
                                items: updated,
                            },
                        },
                    };
                });
            },

            removeMessageForUser: (conversationId, messageId) => {
                set((state) => {
                    const items = state.messages[conversationId]?.items ?? [];
                    const filtered = items.filter((m) => m._id !== messageId);
                    return {
                        messages: {
                            ...state.messages,
                            [conversationId]: {
                                ...state.messages[conversationId],
                                items: filtered,
                            },
                        },
                    };
                });
            },

            updateConversation: (conversation) => {
                set((state) => {
                    const merged = state.conversations.map((c) =>
                        c._id === conversation._id ? { ...c, ...conversation } : c
                    );
                    // keep conversations ordered by most recent activity so a new
                    // message bumps its conversation to the top of the list
                    merged.sort(
                        (a, b) =>
                            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                    );
                    return { conversations: merged };
                });
            },

            markAsSeen: async () => {
                try {
                    const { user } = useAuthStore.getState();
                    const { activeConversationId, conversations } = get();
                    if (!activeConversationId || !user) return;

                    const convo = conversations.find((c) => c._id === activeConversationId);

                    if (!convo) return;

                    if ((convo.unreadCounts?.[user._id] ?? 0) === 0) return;

                    await chatService.markAsSeen(activeConversationId);

                    set((state) => ({
                        conversations: state.conversations.map((c) => (
                            c._id === activeConversationId && c.lastMessage ? {
                                ...c, unreadCounts: {
                                    ...c.unreadCounts,
                                    [user._id]: 0
                                }
                            }
                                : c
                        ))
                    }))

                } catch (error) {
                    console.error("Lỗi xảy ra khi markAsSeen", error)

                }
            },

            addConvo: async (convo) => {
                set((state) => {
                    const exists = state.conversations.some((c) => c._id.toString() === convo._id.toString());

                    return {
                        conversations: exists ? state.conversations : [convo, ...state.conversations],
                        activeConversationId: convo._id,
                    }
                })
            },

            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true })
                    const conversation = await chatService.createConversation(type, name, memberIds);

                    get().addConvo(conversation);

                    useSocketStore.getState().socket?.emit("join-conversation", conversation._id)
                } catch (error) {
                    console.error("Lỗi xảy ra khi tạo cuộc trò chuyện", error)
                } finally {
                    set({ loading: false })
                }
            },

            setTypingUser: (conversationId, typingUser) => {
                set((state) => {
                    const existing = state.typingUsers[conversationId] ?? [];
                    if (existing.some((u) => u._id === typingUser._id)) return {};

                    return {
                        typingUsers: {
                            ...state.typingUsers,
                            [conversationId]: [...existing, typingUser],
                        },
                    };
                });
            },

            removeTypingUser: (conversationId, userId) => {
                set((state) => {
                    const existing = state.typingUsers[conversationId];
                    if (!existing) return {};

                    return {
                        typingUsers: {
                            ...state.typingUsers,
                            [conversationId]: existing.filter((u) => u._id !== userId),
                        },
                    };
                });
            },

            setSearchQuery: (searchQuery) => set({ searchQuery }),

        }),
        {
            name: "chat-storage",
            partialize: (state) => ({ conversations: state.conversations }),
        }
    )
);