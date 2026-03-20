import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
 
const ACCESS_TOKEN_TTL = '30s';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
    try {
        const {username, password, email,firstName, lastName} = req.body;
    
        if(!username || !password || !email || !firstName || !lastName){
            return res.status(400).json({message: "Không thể thiếu username, password, email, firstName, và lastName"})
        }
    
         // kiểm tra username đã tồn tại chưa
        const duplicate = await User.findOne({username});

        if(duplicate){
            return res.status(409).json({message: "username đã tồn tại"})
        }
         
        //  mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);  // salt = 10 

        //  tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`
        })

        //  return
        return res.sendStatus(204);
    } catch (error) {
        console.error('Lỗi khi gọi Signup', error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const signIn = async (req, res) =>{
    try {
        // lấy inputs
        const {username, password} = req.body;

        if(!username || !password){
            return res.status(400).json({message: "Thiếu username hoặc password"})
        }

        // lấy hashedPassword trong db để so với password input
        const user = await User.findOne({username});

        if(!user){
            return res.status(401).json({message: 'thông tin đăng nhập không chính xác'})
        }
        // kiem tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordCorrect) {
            return res.status(401).json({message: "thông tin đăng nhập không chính xác"})
        }


        //nếu khớp , tạo accessToken với JWT
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL })

        //tạo refesh token
        const refreshToken = crypto.randomBytes(64).toString('hex');


        // tạo session mới để lưu refesh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });



        // trả refresh token về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL
        })

        // trả access token về trong res
        return res.status(200).json({message: `User ${user.displayName} đã đăng nhập! `,accessToken})

    } catch (error) {
        console.error('Lỗi khi gọi Signin', error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};

export const SignOut = async (req, res) => {
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;

        if(token){
        // xóa refresh token trong Session
            await Session.deleteOne({refreshToken: token});


        // xóa cookie
            res.clearCookie('refreshToken');
        }
        return res.sendStatus(204);
    } catch (error) {
           console.error('Lỗi khi gọi Signout', error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }
};


export const refreshToken = async (req, res) => {

    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;
        if(!token) {
            return res.status(401).json({message:"token không tồn tại"})
        }

        // so với refresh token trong db
        const session = await Session.findOne({refreshToken: token});

        if(!session) {
            return  res.status(403).json({message:" Token không hợp lệ hoặc đã hết hạn"})
        }

        // kiểm tra hết hạn token
        if(session.expiresAt < new Date()) {
            return res.status(403).json({message: "Token đã hết hạn"})
        }

        // tạo access token mới 
        const accessToken = jwt.sign({
            userId: session.userId
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL})

        // return 
        return res.status(200).json({accessToken});

    } catch (error) {
        console.error("Lỗi khi gọi refreshToken", error);
        return res.status(500).json({message: "Lỗi hệ thống"})
    }

}