import { CaregiverLink, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import jwt from 'jsonwebtoken';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '365d',
    });
};

export const generatePairingCode = async (caregiverId) => {
    // Tạo mã 6 chữ số ngẫu nhiên
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Có hiệu lực trong 24 giờ

    let link = await CaregiverLink.findOne({ caregiverId, status: 'pending' });

    if (link) {
        link.pairingCode = pairingCode;
        link.pairingCodeExpiresAt = expiresAt;
        await link.save();
    } else {
        link = await CaregiverLink.create({
            caregiverId,
            pairingCode,
            pairingCodeExpiresAt: expiresAt,
            status: 'pending',
        });
    }

    return {
        pairingCode: link.pairingCode,
        expiresAt: link.pairingCodeExpiresAt,
        status: link.status,
    };
};

export const connectDeviceWithCode = async (pairingCode, nickname, currentUser) => {
    const cleanCode = pairingCode.trim();

    const link = await CaregiverLink.findOne({
        pairingCode: cleanCode,
        pairingCodeExpiresAt: { $gt: new Date() },
    });

    if (!link) {
        throw new AppError('Mã kết nối không chính xác hoặc đã hết hạn (hạn 24h).', 400);
    }

    let elderlyUser;

    if (currentUser && currentUser.role === 'elderly') {
        elderlyUser = currentUser;
        if (nickname) elderlyUser.nickname = nickname;
        await elderlyUser.save();
    } else {
        // Tạo tài khoản người cao tuổi mới cho thiết bị này
        elderlyUser = await User.create({
            role: 'elderly',
            fullName: nickname ? `Bà ${nickname}` : 'Người cao tuổi',
            nickname: nickname || 'Ông/Bà',
        });
    }

    link.elderlyId = elderlyUser._id;
    link.status = 'active';
    link.linkedAt = new Date();
    await link.save();

    const token = signToken(elderlyUser._id);

    return {
        token,
        elderly: {
            id: elderlyUser._id,
            fullName: elderlyUser.fullName,
            nickname: elderlyUser.nickname,
            role: elderlyUser.role,
        },
        caregiverId: link.caregiverId,
        emergencyPhone: link.emergencyPhone,
    };
};

export const getLinkedElderlyList = async (caregiverId) => {
    const links = await CaregiverLink.find({ caregiverId, status: 'active' })
        .populate('elderlyId', 'fullName nickname avatarUrl phone dateOfBirth isActive')
        .sort({ linkedAt: -1 });

    return links;
};

export const updateElderlyProfileService = async (caregiverId, elderlyId, updateData) => {
    const link = await CaregiverLink.findOne({ caregiverId, elderlyId, status: 'active' });

    if (!link) {
        throw new AppError('Không tìm thấy liên kết với người cao tuổi này.', 404);
    }

    if (updateData.emergencyPhone) {
        link.emergencyPhone = updateData.emergencyPhone;
        await link.save();
    }

    const elderlyUser = await User.findById(elderlyId);
    if (elderlyUser) {
        if (updateData.nickname) elderlyUser.nickname = updateData.nickname;
        if (updateData.fullName) elderlyUser.fullName = updateData.fullName;
        if (updateData.dateOfBirth) elderlyUser.dateOfBirth = updateData.dateOfBirth;
        await elderlyUser.save();
    }

    return {
        link,
        elderly: elderlyUser,
    };
};
