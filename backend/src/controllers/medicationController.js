import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as medicationService from '../services/medicationService.js';
import { CaregiverLink } from '../models/index.js';

export const getTodaySchedules = catchAsync(async (req, res, next) => {
    let { elderlyId } = req.params;

    if (!elderlyId || elderlyId === 'undefined' || elderlyId === 'null' || elderlyId === 'demo-elderly-id' || elderlyId === 'my-elderly') {
        const link = await CaregiverLink.findOne({
            caregiverId: req.user._id,
            status: { $in: ['active', 'pending'] },
        }).sort({ linkedAt: -1, createdAt: -1 });

        if (link) {
            elderlyId = link.elderlyId;
        }
    }

    const schedules = await medicationService.getTodaySchedulesService(elderlyId);

    res.status(200).json({
        status: 'success',
        data: schedules,
    });
});

export const logMedicationStatus = catchAsync(async (req, res, next) => {
    let { elderlyId, scheduleId, status, snoozeMinutes } = req.body;

    if (!scheduleId || !status) {
        return next(new AppError('Vui lòng cung cấp scheduleId và status (taken/snoozed).', 400));
    }

    if (!elderlyId || elderlyId === 'undefined' || elderlyId === 'null' || elderlyId === 'demo-elderly-id' || elderlyId === 'my-elderly') {
        const link = await CaregiverLink.findOne({
            caregiverId: req.user._id,
            status: { $in: ['active', 'pending'] },
        }).sort({ linkedAt: -1, createdAt: -1 });

        if (link) {
            elderlyId = link.elderlyId;
        }
    }

    if (!['taken', 'snoozed'].includes(status)) {
        return next(new AppError('Trạng thái không hợp lệ. Chỉ chấp nhận taken hoặc snoozed.', 400));
    }

    const log = await medicationService.logMedicationStatusService(elderlyId, scheduleId, status, snoozeMinutes);

    res.status(200).json({
        status: 'success',
        message: status === 'taken' ? 'Đã ghi nhận uống thuốc thành công!' : `Đã hẹn nhắc lại sau ${snoozeMinutes || 10} phút.`,
        data: log,
    });
});

export const getCaregiverDashboardStatus = catchAsync(async (req, res, next) => {
    const data = await medicationService.getCaregiverDashboardStatusService(req.user._id);

    res.status(200).json({
        status: 'success',
        data,
    });
});
