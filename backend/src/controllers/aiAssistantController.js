import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { chatWithElderlyAssistant } from '../services/geminiService.js';
import { User, AiConversation } from '../models/index.js';
import { getTodaySchedulesService } from '../services/medicationService.js';

export const askAssistant = catchAsync(async (req, res, next) => {
    const { elderlyId, message } = req.body;

    if (!elderlyId || !message) {
        return next(new AppError('Vui lòng cung cấp elderlyId và câu hỏi (message).', 400));
    }

    const elderlyUser = await User.findById(elderlyId);
    if (!elderlyUser) {
        return next(new AppError('Không tìm thấy tài khoản người cao tuổi.', 404));
    }

    const todaySchedules = await getTodaySchedulesService(elderlyId);

    const elderlyContext = {
        fullName: elderlyUser.fullName,
        nickname: elderlyUser.nickname,
        dateOfBirth: elderlyUser.dateOfBirth,
        todayMedications: todaySchedules,
    };

    const replyText = await chatWithElderlyAssistant(elderlyContext, message.trim());

    await AiConversation.create({
        elderlyId,
        userMessage: message.trim(),
        aiReply: replyText,
    });

    res.status(200).json({
        status: 'success',
        data: {
            replyText,
        },
    });
});
