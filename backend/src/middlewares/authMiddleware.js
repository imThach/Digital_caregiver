import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt_token) {
        token = req.cookies.jwt_token;
    }

    if (!token) {
        return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('Tài khoản sở hữu token này không còn tồn tại.', 401));
    }

    if (!currentUser.isActive) {
        return next(new AppError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 403));
    }

    req.user = currentUser;
    next();
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Bạn không có quyền thực hiện hành động này.', 403));
        }
        next();
    };
};
