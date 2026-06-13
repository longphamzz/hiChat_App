import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";


export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Tên nhóm và thành viên là bắt buộc" })
        }

        let conversation;

        if (type === 'direct') {
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({ type: 'direct', "participants.userId": { $all: [userId, participantId] } })

            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date()
                })

                await conversation.save()
            }
        }

        if (type === "group") {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    { userId },
                    ...memberIds.map((id) => ({ userId: id }))
                ],
                group: {
                    name,
                    createdBy: userId,
                    admins: [userId]
                },
                lastMessageAt: new Date()
            })

            await conversation.save()
        }

        if (!conversation) {
            return res.status(400).json({ message: "Có lỗi xảy ra " })
        }

        await conversation.populate([
            { path: 'participants.userId', select: 'displayName avatarUrl' },
            { path: "seenBy", select: "displayName avatarUrl" },
            { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = {...conversation.toObject(), participants};

        if(type === 'group') {
            const { io } = await import('../socket/index.js');
            memberIds.forEach((userId) => {
                io.to(userId).emit("new-group", formatted)
            })
        }

        return res.status(201).json({ conversation: formatted });


    } catch (error) {
        console.error("Lỗi khi tạo conversation", error);
        return res.status(500).json({ message: 'Lỗi hệ thống' })

    }

}

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({ 'participants.userId': userId })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({
                path: 'participants.userId', select: 'displayName avatarUrl'
            })
            .populate({
                path: 'lastMessage.senderId', select: 'displayName avatarUrl'
            })
            .populate({
                path: 'seenBy', select: 'displayName avatarUrl'
            });

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            return {
                ...convo.toObject(),
                unreadCounts: convo.unreadCounts || {},
                participants,
            }
        });

        return res.status(200).json({ conversations: formatted })

    } catch (error) {
        console.error("Có lỗi khi lấy conversations", error);
        return res.status(500).json({ message: 'Lỗi hệ thống' })

    }


}


export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;

        const userId = req.user._id;
        const query = { conversationId };

        // Exclude messages that were deleted by this user
        query.deletedBy = { $ne: userId };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };

        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1);

        let nextCursor = null;

        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop();
        }

        messages = messages.reverse();

        return res.status(200).json({ messages, nextCursor })

    } catch (error) {
        console.error('Có lỗi khi lấy messages', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' })
    }

}

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            { "participants.userId": userId },
            { _id: 1 }

        )

        return conversations.map((c) => c._id.toString())
    } catch (error) {
        console.error("Lỗi khi fetch conversations:", error)
        return [];

    }
}

export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" })
        }

        const last = conversation.lastMessage;

        if (!last) {
            return res.status(400).json({ message: "Cuộc trò chuyện chưa có tin nhắn " })
        }

        if (last.senderId.toString() === userId) {
            return res.status(400).json({ message: "Bạn không thể đánh dấu tin nhắn của chính mình là đã xem" })
        }

        const updated = await Conversation.findByIdAndUpdate(conversationId, {
            $addToSet: { seenBy: userId },
            $set: { [`unreadCounts.${userId}`]: 0 }
        }, { new: true })

        const { io } = await import('../socket/index.js');
        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated.lastMessage._id,
                content: updated.lastMessage.content,
                createdAt: updated.lastMessage.createdAt,
                senderId: {
                    _id: updated.lastMessage.senderId._id,

                }

            }
        })

        return res.status(200).json({ message: "Đã đánh dấu là đã xem", seenBy: updated.seenBy || [], myUnreadCount: updated?.unreadCounts[userId] || 0, })

    } catch (error) {
        console.error("Lỗi khi đánh dấu đã xem", error);
        return res.status(500).json({ message: "Lỗi hệ thống" })


    }
}


export const addMembers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: 'memberIds is required' });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        if (conversation.type !== 'group') return res.status(400).json({ message: 'Not a group conversation' });

        // check admin: createdBy or in admins
        const createdBy = conversation.group?.createdBy?.toString();
        const admins = (conversation.group?.admins || []).map((a) => a.toString());
        const isAdmin = (createdBy === userId.toString()) || admins.includes(userId.toString());

        if (!isAdmin) return res.status(403).json({ message: 'Only group admins can add members' });

        const existingIds = (conversation.participants || []).map((p) => p.userId.toString());

        // validate and filter
        const validToAdd = [];
        for (const id of memberIds) {
            if (existingIds.includes(id)) continue;
            const u = await User.findById(id).select('displayName avatarUrl');
            if (!u) continue;
            validToAdd.push({ userId: id });
        }

        if (validToAdd.length === 0) return res.status(400).json({ message: 'No valid members to add' });

        // push new participants
        await Conversation.findByIdAndUpdate(conversationId, {
            $push: { participants: { $each: validToAdd } },
            $set: { lastMessageAt: new Date() }
        }, { new: true });

        // create system message
        const adminUser = await User.findById(userId).select('displayName');
        const addedUsers = await User.find({ _id: { $in: validToAdd.map(v => v.userId) } }).select('displayName avatarUrl');

        // format names: "A, B and C"
        const displayNames = addedUsers.map(u => u.displayName || u.username || 'Unknown');
        let namesStr = '';
        if (displayNames.length === 1) namesStr = displayNames[0];
        else if (displayNames.length === 2) namesStr = `${displayNames[0]} and ${displayNames[1]}`;
        else namesStr = `${displayNames.slice(0, -1).join(', ')} and ${displayNames.slice(-1)}`;

        const systemContent = `${adminUser.displayName} added ${namesStr} to the group`;

        const sysMsg = await Message.create({
            conversationId,
            senderId: userId,
            content: systemContent,
            system: true
        });

        // populate conversation to send to clients
        const updatedConversation = await Conversation.findById(conversationId)
            .populate({ path: 'participants.userId', select: 'displayName avatarUrl' })
            .populate({ path: 'lastMessage.senderId', select: 'displayName avatarUrl' })
            .populate({ path: 'seenBy', select: 'displayName avatarUrl' });

        const participants = (updatedConversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...updatedConversation.toObject(), participants };

        // emit to conversation room that members were added
        const { io } = await import('../socket/index.js');
        io.to(conversationId).emit('group-member-added', { conversation: formatted, added: addedUsers });

        // notify each new user so they see the group in their sidebar
        validToAdd.forEach((t) => {
            io.to(t.userId.toString()).emit('new-group', formatted);
        });

        // also emit system message to room in the same shape frontend expects
        io.to(conversationId).emit('new-message', {
            message: sysMsg,
            conversation: formatted,
            unreadCounts: updatedConversation.unreadCounts || {}
        });

        return res.status(200).json({ conversation: formatted, added: addedUsers });

    } catch (error) {
        console.error('Error adding members', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}


export const removeMembers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: 'memberIds is required' });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        if (conversation.type !== 'group') return res.status(400).json({ message: 'Not a group conversation' });

        // check admin: createdBy or in admins
        const createdBy = conversation.group?.createdBy?.toString();
        const admins = (conversation.group?.admins || []).map((a) => a.toString());
        const isAdmin = (createdBy === userId.toString()) || admins.includes(userId.toString());

        if (!isAdmin) return res.status(403).json({ message: 'Only group admins can remove members' });

        // ensure target users exist and are participants
        const existingIds = (conversation.participants || []).map((p) => p.userId.toString());
        const toRemove = memberIds.filter((id) => existingIds.includes(id));

        if (toRemove.length === 0) return res.status(400).json({ message: 'No valid members to remove' });

        await Conversation.findByIdAndUpdate(conversationId, {
            $pull: { participants: { userId: { $in: toRemove } } },
            $set: { lastMessageAt: new Date() }
        }, { new: true });

        const adminUser = await User.findById(userId).select('displayName');
        const removedUsers = await User.find({ _id: { $in: toRemove } }).select('displayName avatarUrl');

        const displayNames = removedUsers.map(u => u.displayName || u.username || 'Unknown');
        let namesStr = '';
        if (displayNames.length === 1) namesStr = displayNames[0];
        else if (displayNames.length === 2) namesStr = `${displayNames[0]} and ${displayNames[1]}`;
        else namesStr = `${displayNames.slice(0, -1).join(', ')} and ${displayNames.slice(-1)}`;

        const systemContent = `${adminUser.displayName} removed ${namesStr} from the group`;

        const sysMsg = await Message.create({
            conversationId,
            senderId: userId,
            content: systemContent,
            system: true
        });

        const updatedConversation = await Conversation.findById(conversationId)
            .populate({ path: 'participants.userId', select: 'displayName avatarUrl' })
            .populate({ path: 'lastMessage.senderId', select: 'displayName avatarUrl' })
            .populate({ path: 'seenBy', select: 'displayName avatarUrl' });

        const participants = (updatedConversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...updatedConversation.toObject(), participants };

        io.to(conversationId).emit('group-member-removed', { conversation: formatted, removed: removedUsers });

        // notify removed users so they can remove group from their sidebar
        toRemove.forEach((id) => {
            io.to(id.toString()).emit('group-removed', { conversationId });
        });

        io.to(conversationId).emit('new-message', {
            message: sysMsg,
            conversation: formatted,
            unreadCounts: updatedConversation.unreadCounts || {}
        });

        return res.status(200).json({ conversation: formatted, removed: removedUsers });

    } catch (error) {
        console.error('Error removing members', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}