import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as medicationService from '../services/medicationService.js';

export const getTodaySchedules = catchAsync(async (req, res, next) => {
    const { elderlyId } = req.params;

    const schedules = await medicationService.getTodaySchedulesService(elderlyId);

    res.status(200).json({
        status: 'success',
        data: schedules,
    });
});

export const logMedicationStatus = catchAsync(async (req, res, next) => {
    const { elderlyId, scheduleId, status, snoozeMinutes } = req.body;

    if (!elderlyId || !scheduleId || !status) {
        return next(new AppError('Vui lòng cung cấp elderlyId, scheduleId và status (taken/snoozed).', 400));
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
