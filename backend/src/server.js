import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import coookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


//middlewares
app.use(express.json());
app.use(coookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}))

//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);


connectDB().then(() => {
    app.listen(PORT, () => {
    console.log(`sever bắt đầu tại cổng localhost:${PORT}`);
    });
});
  