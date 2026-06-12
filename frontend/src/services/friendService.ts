import api from "@/lib/axios";

export const friendService = {
        async searchByUsername(username: string) {
                const res = await api.get(`/users/search?username=${username}`);
                return res.data.user;
        },

        async sendFriendRequest(to: string, message?: string) {
                const res = await api.post('/friends/requests', { to, message });
                return res.data.message;
        },

        async getAllFriendRequest() {
                try {
                        const res = await api.get('/friends/requests');
                        const { sent, received } = res.data;
                        return { sent, received };
                } catch (error) {
                        console.error("Lỗi khi lấy friend request:", error);

                }
        },

        async acceptRequest(requestId: string) {
                try {
                        const res = await api.post(`/friends/requests/${requestId}/accept`);
                        return res.data.requestAcceptBy;
                } catch (error) {
                        console.error("Lỗi khi chấp nhận yêu cầu kết bạn:", error);
                }
        },

        async refuseRequest(requestId: string) { 
                try {
                        await api.post(`/friends/requests/${requestId}/refuse`);
                } catch (error) {
                        console.error("Lỗi khi từ chối yêu cầu kết bạn:", error);
                }
        },

        async getFriendList() {
                const res = await api.get('/friends');
                return res.data.friends;
        }
}  