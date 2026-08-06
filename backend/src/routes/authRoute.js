import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate, sendOtpSchema, verifyOtpSchema } from '../validators/authValidator.js';

const router = express.Router();

const rateLimitMessage = (message) => ({
    status: 'fail',
    message,
});

const emailAwareKey = (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${email || 'no-email'}`;
};

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: rateLimitMessage('Too many login attempts. Please try again in 15 minutes.'),
    standardHeaders: true,
    legacyHeaders: false,
});

const sendOtpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: emailAwareKey,
    message: rateLimitMessage('Too many OTP requests. Please try again in 15 minutes.'),
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyOtpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: emailAwareKey,
    message: rateLimitMessage('Too many OTP verification attempts. Please try again in 15 minutes.'),
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Các API liên quan đến đăng nhập và xác thực
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RateLimitError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         message:
 *           type: string
 *           example: Vượt quá số lần cho phép. Vui lòng thử lại sau 15 phút.
 */

// ==========================================
// ROUTES
// ==========================================

/**
 * @swagger
 * /google:
 *   get:
 *     summary: Chuyển hướng đến Google OAuth
 *     description: Khởi tạo luồng đăng nhập Google OAuth 2.0. Giới hạn 20 yêu cầu / 15 phút.
 *     tags: [Auth]
 *     responses:
 *       '302':
 *         description: Chuyển hướng thành công đến trang đăng nhập của Google.
 *       '429':
 *         description: Vượt quá giới hạn gọi API (Rate Limit).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.get('/google', loginRateLimiter, authController.redirectToGoogle);

/**
 * @swagger
 * /google/callback:
 *   get:
 *     summary: Google OAuth Callback
 *     description: Xử lý callback từ Google sau khi người dùng xác thực thành công. Giới hạn 20 yêu cầu / 15 phút.
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: Xác thực Google thành công.
 *       '429':
 *         description: Vượt quá giới hạn gọi API (Rate Limit).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.get('/google/callback', loginRateLimiter, authController.handleGoogleCallback);

/**
 * @swagger
 * /send-otp:
 *   post:
 *     summary: Gửi mã OTP
 *     description: Gửi mã OTP đến email của người dùng. Giới hạn 5 yêu cầu / 15 phút dựa trên IP và Email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của người dùng cần nhận OTP.
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: OTP đã được gửi thành công.
 *       '429':
 *         description: Vượt quá giới hạn gửi OTP (Rate Limit).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post('/send-otp', sendOtpRateLimiter, validate(sendOtpSchema), authController.sendOtp);

/**
 * @swagger
 * /verify-otp:
 *   post:
 *     summary: Xác thực mã OTP
 *     description: Kiểm tra mã OTP người dùng nhập vào. Giới hạn 10 yêu cầu / 15 phút dựa trên IP và Email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 description: Mã OTP 6 số.
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: Xác thực OTP thành công.
 *       '400':
 *         description: Mã OTP không hợp lệ hoặc đã hết hạn.
 *       '429':
 *         description: Vượt quá giới hạn thử xác thực OTP (Rate Limit).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post('/verify-otp', verifyOtpRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: Lấy thông tin tài khoản thành công.
 *       '401':
 *         description: Chưa đăng nhập hoặc cookie hết hạn.
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Đăng xuất người dùng và xoá Auth Cookie
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: Đăng xuất thành công.
 */
router.post('/logout', authController.logout);

export default router;