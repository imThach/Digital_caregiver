import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as emergencyService from '../services/emergencyService.js';

export const triggerSOS = catchAsync(async (req, res, next) => {
    const { elderlyId, triggeredBy, latitude, longitude } = req.body;

    if (!elderlyId) {
        return next(new AppError('Vui lòng cung cấp elderlyId.', 400));
    }

    const data = await emergencyService.triggerSosService(elderlyId, triggeredBy, latitude, longitude);

    const io = req.app.get('io');
    if (io) {
        console.log('🚨 Broadcasting Socket.io SOS Alert Event...');
        io.emit('receive_sos', data.event);
        io.emit('emergency_sos_alert', data.event);
    }

    res.status(200).json({
        status: 'success',
        message: 'Đang kết nối tín hiệu khẩn cấp đến người thân của bà...',
        data,
    });
});

export const getEmergencyHistory = catchAsync(async (req, res, next) => {
    const { page, limit } = req.query;
    const result = await emergencyService.getEmergencyHistoryService(req.user._id, page, limit);

    res.status(200).json({
        status: 'success',
        data: result.events,
        pagination: result.pagination,
    });
});

export const acknowledgeEmergency = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const data = await emergencyService.acknowledgeEmergencyService(req.user._id, id, status);

    const io = req.app.get('io');
    if (io) {
        io.emit('sos_acknowledged', { id, status });
    }

    res.status(200).json({
        status: 'success',
        message: 'Đã cập nhật trạng thái sự kiện khẩn cấp.',
        data,
    });
});
