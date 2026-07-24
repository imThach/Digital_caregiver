import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Rate Limiter cho các API Xác thực để chống tấn công Brute-force & Spam Email
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 15, // Tối đa 15 lần thử trong 15 phút
    message: {
        status: 'fail',
        message: 'Bạn đã thực hiện quá nhiều yêu cầu gửi mã/đăng nhập. Vui lòng thử lại sau 15 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API Quản lý đăng nhập và xác thực (Google OAuth & Email OTP)
 */

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Đăng nhập bằng tài khoản Google (OAuth 2.0)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Chuyển hướng đến trang đăng nhập Google
 */
router.get('/google', authController.redirectToGoogle);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Callback trao đổi mã Google lấy JWT token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Chuyển hướng về trang Frontend với JWT token
 */
router.get('/google/callback', authController.handleGoogleCallback);

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Gửi mã OTP 6 chữ số qua Email (Nodemailer)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Đã gửi mã OTP thành công
 *       429:
 *         description: Bị giới hạn số lần gửi (Rate Limit)
 */
router.post('/send-otp', authRateLimiter, authController.sendOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Xác thực mã OTP và nhận JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT Token
 *       400:
 *         description: Mã OTP sai hoặc đã hết hạn
 */
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);

export default router;
