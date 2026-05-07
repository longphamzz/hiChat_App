
import User from '../models/User.js';

import Friend from '../models/Friend.js';
import FriendRequest from '../models/FriendRequest.js';



export const sendFriendRequest = async (req, res) => {
    try {
        const {to, message} = req.body;

        const from = req.user._id;

        if(from === to) {

            return res.status(400).json({ message : "Đây là bạn"})
        }

        const userExists = await User.exists({_id: to});

        if(!userExists) {
            return res.status(404).json({message: "người dùng không tồn tại"})

        }

        let userA = from.toString();
        let userB = to.toString();

        if (userA > userB) {
                [userA, userB] = [userB, userA];
        }

            const [alreadyFriends, existingRequest] = await Promise.all([
                Friend.findOne({userA, userB}),
                FriendRequest.findOne({
                    $or: [
                        {from, to},
                        {from: to, to: from}
                    ]
                })
            ])

            if(alreadyFriends) {
                return res.status(400).json({message: "Hai người đã là bạn"})
            }

            if(existingRequest) {
                return res.status(400).json({message: "Đã có lời mời kết bạn đang chờ"})
            }


            const request = await FriendRequest.create({
                from,
                to,
                message
            });

            return res.status(201).json({message: "Gửi lời mời kết bạn thành công", request }); 

    } catch (error) {
        console.error("Lỗi khi gửi yêu cầu kết bạn", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const acceptFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if(!request) {
            return res.status(404).json({message: "Không tìm thấy lời mời kết bạn"})
        }

        if(request.to.toString() !== userId.toString()) {
            return res.status(403).json({message: "Bạn không có quyền chấp nhận lời mời"})
        }

        const friend = await Friend.create({
            userA: request.from,
            userB: request.to
        })

        await FriendRequest.findByIdAndDelete(requestId);

        const from = await User.findById(request.from).select(
            "_Id displayName avatarUrl"
        ).lean();

        return res.status(200).json({
            message: "Chấp nhận lời mời kết bạn thành công",
            newfiend: {
                _id: from?._id,
                díplayName: from?.displayName,
                avatarUrl: from?.avatarURL,
            }
        })

        
    } catch (error) {
        console.error("Lỗi khi chấp nhận lời mời kết bạn ", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const refuseFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if(!request) {
            return res.status(404).json({message: "Không tìm thấy lời mời kết bạn"})
        }

        if(request.to.toString() !== userId.toString()) {
            return res.status(403).json({message: "Bạn không có quyền từ chối lời mời này"})
        }

        await FriendRequest.findByIdAndDelete(requestId);

        return res.sendStatus(204);



    } catch (error) {
        console.error("Lỗi khi từ chối lời mời kết bạn ", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const getAllFriend = async (req, res) => {
    try {
        const userId = req.user._id;

        const friendships = await Friend.find({
            $or: [{
                userA: userId
            }, {
                userB: userId
            },
        ],
        }).populate("userA", "_id displayName avatarUrl")
        .populate("userB", "_id displayName avatarUrl")
        .lean();

        if(!friendships.length) {
            return res.status(200).json({friends: []})
        }

        const friends = friendships.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA)

        return res.status(200).json({ friends })

    } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè ", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const getFriendRequest = async (req, res) => {
    try {
        const userId = req.user._id;

        const populateFields = '_id username displayName avatarUrl';

        const [sent, received] = await Promise.all([
            FriendRequest.find({from : userId}).populate("to", populateFields),
            FriendRequest.find({to: userId}).populate("from", populateFields)
        ])
        
        res.status(200).json({sent , received})
        
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lời mời kết bạn ", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};