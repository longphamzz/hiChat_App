import express from 'express';
import { refreshToken, signIn, SignOut, signUp } from '../controllers/authController.js';


const router = express.Router();

router.post('/signup', signUp);

router.post('/signin', signIn);

router.post('signout', SignOut);

router.post("/refresh", refreshToken)

export default router;