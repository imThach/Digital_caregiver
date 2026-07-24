import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as pairingService from '../services/pairingService.js';

export const generateCode = catchAsync(async (req, res, next) => {
    const data = await pairingService.generatePairingCode(req.user._id);

    res.status(200).json({
        status: 'success',
        message: 'Đã tạo mã kết nối thành công.',
        data,
    });
});

export const connectDevice = catchAsync(async (req, res, next) => {
    const { pairingCode, nickname } = req.body;

    if (!pairingCode) {
        return next(new AppError('Vui lòng nhập mã kết nối 6 chữ số.', 400));
    }

    const data = await pairingService.connectDeviceWithCode(pairingCode, nickname, req.user);

    res.status(200).json({
        status: 'success',
        message: 'Kết nối thiết bị thành công.',
        data,
    });
});

export const getMyElderly = catchAsync(async (req, res, next) => {
    const data = await pairingService.getLinkedElderlyList(req.user._id);

    res.status(200).json({
        status: 'success',
        data,
    });
});

export const updateElderlyProfile = catchAsync(async (req, res, next) => {
    const { elderlyId, nickname, fullName, emergencyPhone, dateOfBirth } = req.body;

    if (!elderlyId) {
        return next(new AppError('Vui lòng cung cấp elderlyId.', 400));
    }

    const data = await pairingService.updateElderlyProfileService(req.user._id, elderlyId, {
        nickname,
        fullName,
        emergencyPhone,
        dateOfBirth,
    });

    res.status(200).json({
        status: 'success',
        message: 'Đã cập nhật thông tin thành công.',
        data,
    });
});
