import { create } from 'zustand'
import { toast } from 'sonner'
import type { AuthState } from '@/types/store'
import { authService } from '@/services/authService'
import { fi } from 'zod/v4/locales'
import {persist} from 'zustand/middleware';
import { useChatStore } from './useChatStore'

export const useAuthStore = create<AuthState>()(
    persist((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken) => {
        set({accessToken})
    },

    clearState: () => {
        set({ accessToken: null, user: null, loading: false })
        localStorage.clear();
        useChatStore.getState().reset();
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({ loading: true })
            // call api 
            await authService.signUp(username, password, email, firstName, lastName)

            toast.success('Đăng ký thành công! Vui lòng đăng nhập')
        } catch (error) {
            console.error(error);
            toast.error('Đăng ký không thành công')
        } finally {
            set({ loading: false });
        }
    },

    signIn: async (username, password) => {
        try {
            set({ loading: true })

            localStorage.clear();
            useChatStore.getState().reset();

            const { accessToken } = await authService.signIn(username, password)
            get().setAccessToken(accessToken)

            await get().fetchMe();
            useChatStore.getState().fetchConversations();  

            toast.success("Chào mừng bạn trở lại")
        } catch (error) {
            console.error(error);
            toast.error('Đăng nhập không thành công')
        } finally {
            set({ loading: false })
        }
    },

    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success("Bạn đã đăng xuất!")
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xảy ra, vui lòng thử lại")

        }
    },

    fetchMe: async () => {
        try {
            set({ loading: true })
            const user = await authService.fetchMe();

            set({ user });

        } catch (error) {
            console.error(error)
            set({ user: null, accessToken: null })
            toast.error('Lỗi xảy ra khi lấy dữ liệu người dùng')
        } finally {
            set({ loading: false });
        }
    },

    refresh: async () => {
        try {
            set({ loading: true })
            const { user, fetchMe, setAccessToken } = get();
            const accessToken = await authService.refresh();

            // set({accessToken})
            setAccessToken(accessToken);
            if (!user) {
                await fetchMe()
            }
        } catch (error) {
            console.error();
            toast.error("Phiên đăng nhập đã hết hạn")
            get().clearState();

        } finally {
            set({ loading: false })
        }
    }

}), {
    name: 'auth-storage',
    partialize: (state) => ({user: state.user})
})
)