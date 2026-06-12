import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

export const useFriendStore = create<FriendState>()((set, get) => ({
    friends: [],
    loading: false,
    receivedList: [],
    sentList: [],

    searchByUsername: async (username) => {
        try {
            set({ loading: true });
            const user = await friendService.searchByUsername(username);
            return user;
        } catch (error) {
            console.error("Lỗi khi tìm bằng username:", error);
            return null;
        } finally {
            set({ loading: false });
        }
    },

    addFriend: async (to, message) => {
        try {
            set({ loading: true });
            const resultMessage = await friendService.sendFriendRequest(to, message);
            return resultMessage;
        } catch (error) {
            console.error("Lỗi xảy ra khi addFriend", error);
            return "Lỗi xảy ra khi gửi kết bạn. Hãy thử lại";
        } finally {
            set({ loading: false });
        }
    },

    getAllFriendRequests: async () => {
        try {
            set({ loading: true });
            const result = await friendService.getAllFriendRequest();

            if (!result) return;
            const { received, sent } = result;
            set({ receivedList: received, sentList: sent });
        } catch (error) {
            console.error("Lỗi xảy ra khi lấy yêu cầu kết bạn", error);
        } finally {
            set({ loading: false });
        }
    },

    acceptRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId)
             }))
        } catch (error) {
            console.error("Lỗi xảy ra khi chấp nhận yêu cầu kết bạn", error);
        }
    },

    refuseRequest: async (requestId) => {
            try {
                set({loading: true});
                await friendService.refuseRequest(requestId);

                set((state) => ({ 
                    receivedList: state.receivedList.filter((r) => r._id !== requestId)
                }))
            } catch (error) {
                console.error("Lỗi xảy ra khi từ chối yêu cầu kết bạn", error);
            } finally {
                set({loading: false});
            }
    },

    getFriends: async () => {
        try {
            set({ loading: true });
            const friends = await friendService.getFriendList();
            set({ friends: friends });
        } catch (error) {
            console.error("Lỗi xảy ra khi lấy danh sách bạn bè", error);
        } finally {
            set({ loading: false });
        }
    }


}))