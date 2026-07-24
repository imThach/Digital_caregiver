import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as authService from '../services/authService.js';

export const redirectToGoogle = (req, res, next) => {
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3001/api/v1/auth/google/callback';
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
};

export const handleGoogleCallback = catchAsync(async (req, res, next) => {
    const code = req.query.code;

    if (!code) {
        return next(new AppError('Đăng nhập Google thất bại. Không tìm thấy mã xác thực.', 401));
    }

    const token = await authService.loginOrRegisterGoogleUser(code);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
});

export const sendOtp = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Vui lòng nhập địa chỉ email.', 400));
    }

    await authService.generateAndSendOtp(email);

    res.status(200).json({
        status: 'success',
        message: 'Mã OTP đã được gửi đến email của bạn.',
    });
});

export const verifyOtp = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return next(new AppError('Vui lòng nhập email và mã OTP.', 400));
    }

    const result = await authService.verifyOtpAndLogin(email, otp);

    res.status(200).json({
        status: 'success',
        message: 'Đăng nhập thành công.',
        data: result,
    });
});
