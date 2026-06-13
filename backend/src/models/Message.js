import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        reqired: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    imgUrl: {
        type: String,
    },
    // new fields for message actions
    edited: {
        type: Boolean,
        default: false,
    },
    editedAt: {
        type: Date,
    },
    // users who deleted this message for themselves
    deletedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // message was unsent (content replaced for everyone)
    unsent: {
        type: Boolean,
        default: false,
    },
    // system message (e.g. "X added Y to the group")
    system: {
        type: Boolean,
        default: false,
    },
} ,  {
    timestamps: true
}

);

messageSchema.index({conversationId: 1, createdAt: -1})


const Message = mongoose.model("Message", messageSchema);

export default Message;