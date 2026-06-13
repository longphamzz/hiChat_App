export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt
        }

    });

    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender? 0 : prevCount + 1)
    })
}

export const emitNewMessage = (io, conversation, message) => {

    const payload = {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    }

    // Emit to conversation room (for users who already joined)
    io.to(conversation._id.toString()).emit("new-message", payload);
    console.log(`emit new-message to convo room ${conversation._id}`);

    // Also emit to each participant personal room to ensure users who haven't
    // joined the conversation yet (e.g., first message) still receive update.
    (conversation.participants || []).forEach((p) => {
        // p.userId may be an ObjectId or a populated user document
        let memberId;
        if (p && p.userId) {
            if (p.userId._id) memberId = p.userId._id.toString();
            else memberId = p.userId.toString();
        } else {
            memberId = p.toString();
        }

        // send to personal room
        const room = io.sockets.adapter.rooms.get(memberId);
        console.log(`personal room ${memberId} has sockets: ${room ? room.size : 0}`);
        io.to(memberId).emit('new-message', payload);
        console.log(`emit new-message to personal room ${memberId}`);
    })
}