import express from 'express';

import {
    acceptFriendRequest,
    sendFriendRequest,
    refuseFriendRequest,
    getAllFriend,
    getFriendRequest,
} from '../controllers/friendController.js';

const router = express.Router();

router.post('/requests', sendFriendRequest);

router.post('/requests/:requestId/accept', acceptFriendRequest);

router.post('/requests/:requestId/refuse', refuseFriendRequest);



router.get("/",getAllFriend);

router.get("/requests", getFriendRequest);

export default router;