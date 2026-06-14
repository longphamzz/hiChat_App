import type { Socket } from "socket.io-client";
import type { Conversation, Message, TypingUser } from "./chat";
import type { Friend, FriendRequest, User } from "./user";


export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;


    setAccessToken: (accessToken: string) => void;
    setUser:(user: User) => void; 
    clearState: () => void;


    signUp: (username: string, password: string, email: string, firstName: string, lastName: string) => Promise<void>;

    signIn: (username: string, password: string) => Promise<boolean>;

    signOut: () => Promise<void>;

    fetchMe: () => Promise<void>;

    refresh: () => Promise<void>;
}

export interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (dark: boolean) => void;
}

export interface ChatState {
    conversations: Conversation[];
    messages: Record<string, {
        items: Message[],
        hasMore: boolean,
        nextCursor?: string | null,
    }>;
    activeConversationId: string | null;
    convoLoading: boolean;
    messageLoading: boolean;
    loading: boolean;
    typingUsers: Record<string, TypingUser[]>; // key = conversationId
    reset: () => void;

    setActiveConversation: (id: string | null) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (ConversationId?: string) => Promise<void>;
    sendDirectMessage: (
        recipientId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;
    sendGroupMessage: (
        conversationId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>
    //add message
    addMessage: (message: Message) => Promise<void>;
    updateMessage: (message: Message) => void;
    removeMessageForUser: (conversationId: string, messageId: string) => void;

    //update convo
    updateConversation: (conversation: unknown) => void;

    markAsSeen: () => Promise<void>;

    addConvo:(convo: Conversation) => void;
    createConversation: (type: 'group' | 'direct', name: string, memberIds: string[]) => Promise<void>; 

    //typing indicator
    setTypingUser: (conversationId: string, user: TypingUser) => void;
    removeTypingUser: (conversationId: string, userId: string) => void;
}

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export interface FriendState { 
    friends: Friend[];
    loading: boolean;
    receivedList: FriendRequest[];
    sentList: FriendRequest[];
    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    refuseRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
}

export interface UserState {
    updateAvatarUrl: (formData: FormData) => Promise<void>;
}