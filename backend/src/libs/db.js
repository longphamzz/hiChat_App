import mongoose from "mongoose";
import dotenv from 'dotenv'
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("Liên kết CSDL thành công");
    } catch (error) {
        console.log("Lỗi khi kết nối CSDL",error);
        process.exit(1);
    }
}