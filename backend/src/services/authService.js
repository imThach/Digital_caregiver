import jwt from 'jsonwebtoken';
import { User, Otp } from '../models/index.js';
import AppError from '../utils/appError.js';
import { sendOtpEmail } from './emailService.js';

const signToken = (id, role) => {
    // Thiết bị người cao tuổi sử dụng token vĩnh viễn (10 năm) để không bao giờ bắt nhập lại mã OTP
    const expiresIn = role === 'elderly' ? '3650d' : (process.env.JWT_EXPIRES_IN || '30d');
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn,
    });
};

export const loginOrRegisterGoogleUser = async (code) => {
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3001/api/v1/auth/google/callback';

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Google Token Exchange Error:', tokenData);
        throw new AppError(tokenData.error_description || 'Không thể lấy access token từ Google.', 500);
    }

    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const userInfoResponse = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || !userInfo.email) {
        throw new AppError('Không thể lấy thông tin email từ hồ sơ Google.', 400);
    }

    if (userInfo.email_verified === false) {
        throw new AppError('Your Google email is not verified.', 401);
    }

    const {
        sub: googleId,
        email: rawEmail,
        name: fullName,
        picture: avatarUrl,
    } = userInfo;
    const email = rawEmail.trim().toLowerCase();

    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
        user = await User.findOne({ email });
        if (user) {
            user.googleId = googleId;
            user.avatarUrl = user.avatarUrl || avatarUrl;
            await user.save();
        } else {
            user = await User.create({
                role: 'caregiver',
                googleId,
                email,
                fullName: fullName || email.split('@')[0],
                avatarUrl,
            });
            isNewUser = true;
        }
    }

    const token = signToken(user._id, user.role);

    return {
        token,
        isNewUser,
        authProvider: 'google',
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            avatarUrl: user.avatarUrl,
        },
    };
};

export const generateAndSendOtp = async (email) => {
    const cleanEmail = email.trim().toLowerCase();

    const userExists = (await User.findOne({ email: cleanEmail })) !== null;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
        { email: cleanEmail },
        { otp, failedAttempts: 0, createdAt: new Date() },
        { upsert: true, new: true }
    );

    await sendOtpEmail(cleanEmail, otp);

    return { userExists };
};

export const verifyOtpAndLogin = async (email, otp) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const otpRecord = await Otp.findOne({ email: cleanEmail });

    if (!otpRecord) {
        throw new AppError('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.', 400);
    }

    if (otpRecord.otp !== cleanOtp) {
        otpRecord.failedAttempts = (otpRecord.failedAttempts || 0) + 1;
        if (otpRecord.failedAttempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError('Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy. Vui lòng yêu cầu mã mới.', 400);
        } else {
            await otpRecord.save();
            throw new AppError(`Mã OTP không chính xác. Bạn còn ${5 - otpRecord.failedAttempts} lần thử.`, 400);
        }
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (!user) {
        user = await User.create({
            role: 'caregiver',
            email: cleanEmail,
            fullName: cleanEmail.split('@')[0],
        });
        isNewUser = true;
    }

    const token = signToken(user._id, user.role);

    return {
        token,
        isNewUser,
        authProvider: 'email_otp',
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            avatarUrl: user.avatarUrl,
        },
    };
};
