import { CaregiverLink, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import jwt from 'jsonwebtoken';
import { uploadImageBuffer } from '../configs/cloudinary.js';

const signToken = (id, role = 'elderly') => {
    const expiresIn = role === 'elderly' ? '3650d' : (process.env.JWT_EXPIRES_IN || '30d');
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn,
    });
};

export const generatePairingCode = async (caregiverId) => {
    let link = await CaregiverLink.findOne({ caregiverId, status: { $ne: 'revoked' } });

    if (link && link.pairingCode) {
        return {
            pairingCode: link.pairingCode,
            status: link.status,
        };
    }

    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (link) {
        link.pairingCode = pairingCode;
        await link.save();
    } else {
        link = await CaregiverLink.create({
            caregiverId,
            pairingCode,
            status: 'pending',
        });
    }

    return {
        pairingCode: link.pairingCode,
        status: link.status,
    };
};

export const connectDeviceWithCode = async (pairingCode, nickname, currentUser, io = null) => {
    const cleanCode = pairingCode.trim();

    const link = await CaregiverLink.findOne({
        pairingCode: cleanCode,
        status: { $ne: 'revoked' },
    });

    if (!link) {
        throw new AppError('Mã kết nối 6 chữ số không chính xác.', 400);
    }

    let elderlyUser;

    if (link.elderlyId) {
        elderlyUser = await User.findById(link.elderlyId);
    }

    if (!elderlyUser) {
        if (currentUser && currentUser.role === 'elderly') {
            elderlyUser = currentUser;
            if (nickname) elderlyUser.nickname = nickname;
            await elderlyUser.save();
        } else {
            elderlyUser = await User.create({
                role: 'elderly',
                fullName: nickname ? `Bà ${nickname}` : 'Người cao tuổi',
                nickname: nickname || 'Ông/Bà',
            });
        }
    }

    link.elderlyId = elderlyUser._id;
    link.status = 'active';
    link.linkedAt = new Date();
    await link.save();

    const caregiverUser = await User.findById(link.caregiverId);
    const token = signToken(elderlyUser._id);

    if (io) {
        io.emit('pairing_success', {
            caregiverId: String(link.caregiverId),
            elderlyId: String(elderlyUser._id),
            caregiverName: caregiverUser?.fullName || 'Người thân',
            elderlyName: elderlyUser.fullName || elderlyUser.nickname || 'Người cao tuổi',
            linkedAt: link.linkedAt,
        });
    }

    return {
        token,
        elderly: {
            id: elderlyUser._id,
            fullName: elderlyUser.fullName,
            nickname: elderlyUser.nickname,
            role: elderlyUser.role,
        },
        caregiver: {
            id: caregiverUser?._id,
            fullName: caregiverUser?.fullName,
            phone: caregiverUser?.phone,
        },
        caregiverId: link.caregiverId,
        emergencyPhone: link.emergencyPhone,
    };
};

export const getLinkedElderlyList = async (caregiverId) => {
    const links = await CaregiverLink.find({ caregiverId, status: 'active' })
        .populate('elderlyId', 'fullName nickname avatarUrl phone dateOfBirth isActive')
        .sort({ linkedAt: -1 });

    return links.map(formatElderlyLink).filter(Boolean);
};

const isFilled = (value) => String(value || '').trim().length > 0;

const formatUser = (user) => {
    if (!user) return null;
    return {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
    };
};

const formatElderlyLink = (link) => {
    if (!link || !link.elderlyId) return null;
    const elderly = link.elderlyId;
    return {
        linkId: link._id,
        elderlyId: elderly._id,
        _id: elderly._id,
        fullName: elderly.fullName,
        nickname: elderly.nickname,
        phone: elderly.phone,
        avatarUrl: elderly.avatarUrl,
        dateOfBirth: elderly.dateOfBirth,
        emergencyPhone: link.emergencyPhone,
        relationship: link.relationship,
        status: link.status,
    };
};

export const getFamilyProfileStatus = async (caregiverId) => {
    const caregiver = await User.findById(caregiverId);
    let link = await CaregiverLink.findOne({
        caregiverId,
        status: { $in: ['active', 'pending'] },
    })
        .populate('elderlyId', 'fullName nickname avatarUrl phone dateOfBirth isActive')
        .sort({ linkedAt: -1, createdAt: -1 });

    let elderly = link?.elderlyId;

    if (!elderly) {
        const anyLink = await CaregiverLink.findOne({ caregiverId }).sort({ createdAt: -1 });
        if (anyLink && anyLink.elderlyId) {
            link = anyLink;
            elderly = await User.findById(anyLink.elderlyId);
        }
    }

    const missingFields = [];

    if (!isFilled(caregiver?.fullName)) missingFields.push('caregiverFullName');
    if (!isFilled(caregiver?.phone)) missingFields.push('caregiverPhone');
    if (!elderly) {
        missingFields.push('elderlyProfile');
    } else {
        if (!isFilled(elderly.fullName)) missingFields.push('elderlyFullName');
        if (!isFilled(elderly.nickname)) missingFields.push('elderlyNickname');
        if (!elderly.dateOfBirth) missingFields.push('elderlyDateOfBirth');
        if (!isFilled(link?.emergencyPhone)) missingFields.push('elderlyEmergencyPhone');
        if (!isFilled(link?.relationship)) missingFields.push('elderlyRelationship');
    }

    return {
        isComplete: missingFields.length === 0,
        missingFields,
        caregiver: formatUser(caregiver),
        elderly: formatElderlyLink(link),
        pairingCode: link?.pairingCode || null,
        pairingCodeExpiresAt: link?.pairingCodeExpiresAt || null,
        pairingStatus: link?.status || 'pending',
    };
};

const generateInternalPairingCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const updateFamilyProfileService = async (caregiverId, profileData, files = {}) => {
    const caregiver = await User.findById(caregiverId);
    if (!caregiver) {
        throw new AppError('Không tìm thấy tài khoản caregiver.', 404);
    }

    const caregiverFullName = String(profileData.caregiverFullName || '').trim();
    const caregiverPhone = String(profileData.caregiverPhone || '').trim();
    const elderlyFullName = String(profileData.elderlyFullName || '').trim();
    const elderlyNickname = String(profileData.elderlyNickname || '').trim();
    const emergencyPhone = String(profileData.emergencyPhone || '').trim();
    const relationship = String(profileData.relationship || '').trim();
    const dateOfBirth = profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null;

    if (!caregiverFullName || !caregiverPhone || !elderlyFullName || !elderlyNickname || !dateOfBirth || Number.isNaN(dateOfBirth.getTime()) || !emergencyPhone || !relationship) {
        throw new AppError('Vui lòng nhập đầy đủ thông tin bản thân và người cao tuổi.', 400);
    }

    caregiver.fullName = caregiverFullName;
    caregiver.phone = caregiverPhone;

    if (files.caregiverAvatar?.[0]) {
        const file = files.caregiverAvatar[0];
        try {
            const result = await uploadImageBuffer(file.buffer, 'digital-caregiver/caregivers');
            caregiver.avatarUrl = result.secure_url;
        } catch {
            const mime = file.mimetype || 'image/jpeg';
            caregiver.avatarUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
        }
    }

    await caregiver.save();

    let link = null;
    if (profileData.elderlyId) {
        link = await CaregiverLink.findOne({
            caregiverId,
            elderlyId: profileData.elderlyId,
        });
    }

    if (!link) {
        link = await CaregiverLink.findOne({ caregiverId }).sort({ createdAt: -1 });
    }

    let elderlyUser = link?.elderlyId ? await User.findById(link.elderlyId) : null;

    if (!elderlyUser) {
        elderlyUser = await User.create({
            role: 'elderly',
            fullName: elderlyFullName,
            nickname: elderlyNickname,
            dateOfBirth,
        });
    } else {
        elderlyUser.fullName = elderlyFullName;
        elderlyUser.nickname = elderlyNickname;
        elderlyUser.dateOfBirth = dateOfBirth;
    }

    if (files.elderlyAvatar?.[0]) {
        const file = files.elderlyAvatar[0];
        try {
            const result = await uploadImageBuffer(file.buffer, 'digital-caregiver/elderly');
            elderlyUser.avatarUrl = result.secure_url;
        } catch {
            const mime = file.mimetype || 'image/jpeg';
            elderlyUser.avatarUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
        }
    }

    await elderlyUser.save();

    const pairingCode = generateInternalPairingCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!link) {
        link = await CaregiverLink.create({
            caregiverId,
            elderlyId: elderlyUser._id,
            pairingCode,
            pairingCodeExpiresAt: expiresAt,
            status: 'pending',
            emergencyPhone,
            relationship,
        });
    } else {
        link.elderlyId = elderlyUser._id;
        link.emergencyPhone = emergencyPhone;
        link.relationship = relationship;
        if (link.status !== 'active') {
            if (!link.pairingCode || (link.pairingCodeExpiresAt && link.pairingCodeExpiresAt < new Date())) {
                link.pairingCode = pairingCode;
                link.pairingCodeExpiresAt = expiresAt;
            }
            link.status = 'pending';
        }
        await link.save();
    }

    const statusData = await getFamilyProfileStatus(caregiverId);
    return {
        ...statusData,
        pairingCode: link.pairingCode,
        pairingCodeExpiresAt: link.pairingCodeExpiresAt,
        pairingStatus: link.status,
    };
};

export const updateElderlyProfileService = async (caregiverId, elderlyId, updateData) => {
    const link = await CaregiverLink.findOne({ caregiverId, elderlyId, status: 'active' });

    if (!link) {
        throw new AppError('Không tìm thấy liên kết với người cao tuổi này.', 404);
    }

    if (updateData.emergencyPhone) {
        link.emergencyPhone = updateData.emergencyPhone;
    }
    if (updateData.relationship) {
        link.relationship = updateData.relationship;
    }
    await link.save();

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
