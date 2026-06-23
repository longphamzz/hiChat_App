import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadFileFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;

    let conversation;
    let createdNew = false;

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc file" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
      createdNew = true;
    }

    const messagePayload = {
      conversationId: conversation._id,
      senderId,
    };

    if (content) messagePayload.content = content;
    if (imgUrl) messagePayload.imgUrl = imgUrl;

    const message = await Message.create(messagePayload);

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    // If this conversation was just created, notify the other participant
    if (createdNew) {
      await conversation.populate([
        { path: 'participants.userId', select: 'displayName avatarUrl' },
        { path: 'seenBy', select: 'displayName avatarUrl' },
        { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },
      ]);

      const participants = (conversation.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      const formatted = { ...conversation.toObject(), participants };

      // emit new-group (used by clients to add convo and join room)
      (conversation.participants || []).forEach((p) => {
        let memberId;
        if (p && p.userId) {
          if (p.userId._id) memberId = p.userId._id.toString();
          else memberId = p.userId.toString();
        } else {
          memberId = p.toString();
        }

        if (memberId !== senderId.toString()) {
          io.to(memberId).emit('new-group', formatted);
          console.log(`emit new-group to ${memberId} for convo ${conversation._id}`);
        }
      });
    }

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;
    if (!content && !imgUrl) {
      return res.status(400).json("Thiếu nội dung hoặc file");
    }

    const messagePayload = { conversationId, senderId };
    if (content) messagePayload.content = content;
    if (imgUrl) messagePayload.imgUrl = imgUrl;

    const message = await Message.create(messagePayload);

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await uploadFileFromBuffer(req.file.buffer, {
      public_id: `${Date.now()}`,
    });

    return res.status(201).json({ url: result.secure_url, raw: result });
  } catch (error) {
    console.error("Lỗi khi upload file", error);
    return res.status(500).json({ message: "Lỗi upload" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content required' });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    // If this message was the last message of the conversation, update conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.lastMessage?._id?.toString() === message._id.toString()) {
      conversation.lastMessage.content = message.content;
      await conversation.save();
    }

    // emit to conversation room
    io.to(message.conversationId.toString()).emit('message:edited', { message });

    return res.json({ message });
  } catch (error) {
    console.error('Error editing message', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Add to deletedBy if not already
    const already = (message.deletedBy || []).some((id) => id.toString() === userId.toString());
    if (!already) {
      message.deletedBy = [...(message.deletedBy || []), userId];
      await message.save();
    }

    // notify only the requesting user (personal room)
    io.to(userId.toString()).emit('message:deletedForMe', { messageId, conversationId: message.conversationId });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting message for me', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const unsendMessageForEveryone = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    message.content = 'Tin nhắn đã bị xóa';
    message.unsent = true;
    message.edited = false;
    message.editedAt = undefined;

    await message.save();

    // update conversation lastMessage if needed
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.lastMessage?._id?.toString() === message._id.toString()) {
      conversation.lastMessage.content = message.content;
      await conversation.save();
    }

    // broadcast to all participants in conversation
    io.to(message.conversationId.toString()).emit('message:unsent', { message });

    return res.json({ message });
  } catch (error) {
    console.error('Error unsending message', error);
    return res.status(500).json({ message: 'Server error' });
  }
};