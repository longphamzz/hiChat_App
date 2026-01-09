import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
    },
    avatarURL: {
        type: String
    },
    avatarID: {
        type: String
    },
    phone: {
        type: String,
        sparse: true
    },

}, {
    timestamps: true,

})

const User = mongoose.model("User", userSchema);
export default User;