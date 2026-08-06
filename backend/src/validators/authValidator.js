import { z } from 'zod';
import AppError from '../utils/appError.js';

export const sendOtpSchema = z.object({
    email: z.string({ required_error: 'Vui lòng nhập địa chỉ email.' })
        .trim()
        .min(1, 'Vui lòng nhập địa chỉ email.')
        .email('Địa chỉ email không hợp lệ.'),
});

export const verifyOtpSchema = z.object({
    email: z.string({ required_error: 'Vui lòng nhập địa chỉ email.' })
        .trim()
        .min(1, 'Vui lòng nhập địa chỉ email.')
        .email('Địa chỉ email không hợp lệ.'),
    otp: z.string({ required_error: 'Vui lòng nhập mã OTP.' })
        .trim()
        .length(6, 'Mã OTP phải gồm đúng 6 chữ số.')
        .regex(/^\d+$/, 'Mã OTP chỉ bao gồm chữ số.'),
});

export const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.issues.map((e) => e.message).join(' ');
            return next(new AppError(errorMessage, 400));
        }
        next(error);
    }
};
