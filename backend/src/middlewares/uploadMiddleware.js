import multer from 'multer';
import AppError from '../utils/appError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Chỉ chấp nhận tập tin hình ảnh (jpg, png, webp, etc.).', 400), false);
    }
};

export const uploadSingleImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');
