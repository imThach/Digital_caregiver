import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { chatWithElderlyAssistant } from '../services/geminiService.js';
import { User, AiConversation, CaregiverLink } from '../models/index.js';
import { getTodaySchedulesService } from '../services/medicationService.js';

import googleTTS from 'google-tts-api';

export const generateTts = catchAsync(async (req, res, next) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return next(new AppError('Vui lòng cung cấp văn bản cần phát âm.', 400));
    }

    const cleanText = text.replace(/[*_#~`]/g, '').trim();

    try {
        const audioUrl = googleTTS.getAudioUrl(cleanText.slice(0, 300), {
            lang: 'vi',
            slow: false,
            host: 'https://translate.google.com',
        });

        res.status(200).json({
            status: 'success',
            data: {
                audioUrl,
            },
        });
    } catch (err) {
        console.error('Lỗi khi phát sinh giọng nói TTS:', err);
        return next(new AppError('Không thể tạo giọng đọc TTS lúc này.', 500));
    }
});

export const askAssistant = catchAsync(async (req, res, next) => {
    let { elderlyId, message } = req.body;

    if (!message || !message.trim()) {
        return next(new AppError('Vui lòng cung cấp câu hỏi (message).', 400));
    }

    let elderlyUser = null;

    if (elderlyId && elderlyId !== 'my-elderly' && elderlyId !== 'demo-elderly-id' && elderlyId !== 'undefined') {
        elderlyUser = await User.findById(elderlyId);
    }

    if (!elderlyUser) {
        if (req.user?.role === 'elderly') {
            elderlyUser = req.user;
            elderlyId = req.user._id;
        } else {
            const link = await CaregiverLink.findOne({
                caregiverId: req.user._id,
                status: { $in: ['active', 'pending'] },
            }).sort({ linkedAt: -1, createdAt: -1 });

            if (link && link.elderlyId) {
                elderlyId = link.elderlyId;
                elderlyUser = await User.findById(link.elderlyId);
            }
        }
    }

    const todaySchedules = elderlyId ? await getTodaySchedulesService(elderlyId) : [];

    const elderlyContext = {
        fullName: elderlyUser?.fullName || 'Người cao tuổi',
        nickname: elderlyUser?.nickname || elderlyUser?.fullName || 'Bà Lan',
        todayMedications: todaySchedules,
    };

    const replyText = await chatWithElderlyAssistant(elderlyContext, message.trim());

    if (elderlyId && elderlyId !== 'my-elderly') {
        await AiConversation.create({
            elderlyId,
            userMessage: message.trim(),
            aiReply: replyText,
        }).catch(() => {});
    }

    res.status(200).json({
        status: 'success',
        data: {
            replyText,
            reply: replyText,
        },
    });
});
