import api from "@/lib/axios";

export const userService = {
    uploadAvatar: async (formData: FormData) => {
        try {
            const res = await api.post("/users/uploadAvatar", formData);
            return res.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Upload thất bại";
            throw new Error(message);
        }
    },
};