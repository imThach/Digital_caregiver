import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as authController from '../controllers/authController.js';

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

router.get('/google', loginRateLimiter, authController.redirectToGoogle);
router.get('/google/callback', loginRateLimiter, authController.handleGoogleCallback);
router.post('/send-otp', sendOtpRateLimiter, authController.sendOtp);
router.post('/verify-otp', verifyOtpRateLimiter, authController.verifyOtp);

export default router;
