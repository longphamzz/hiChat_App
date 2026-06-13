import express from 'express';

import {sendDirectMessage, sendGroupMessage, uploadAttachment } from '../controllers/messageController.js';
import { editMessage, deleteMessageForMe, unsendMessageForEveryone } from '../controllers/messageController.js';
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/direct', checkFriendship, sendDirectMessage);

router.post('/group', checkGroupMembership, sendGroupMessage);

// upload endpoint: expects multipart/form-data with field 'file'
router.post('/upload', upload.single('file'), uploadAttachment);

// edit message (owner only)
router.patch('/:id', editMessage);

// delete only for current user
router.post('/:id/delete-for-me', deleteMessageForMe);

// unsend (for everyone) - owner only
router.post('/:id/unsend', unsendMessageForEveryone);

export default router;  