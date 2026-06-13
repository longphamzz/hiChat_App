import express from 'express' ;

import { createConversation, getConversations , getMessages, markAsSeen, addMembers, removeMembers } from '../controllers/conversationController.js';

import { checkFriendship } from '../middlewares/friendMiddleware.js';

const router = express.Router();

router.post("/" , createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch('/:conversationId/seen', markAsSeen);
router.post('/:conversationId/add-members', addMembers);
router.post('/:conversationId/remove-members', removeMembers);

export default router;