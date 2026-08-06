import { EmergencyEvent, CaregiverLink, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const triggerSosService = async (elderlyId, triggeredBy, latitude, longitude) => {
    let mapsLink = null;
    if (latitude && longitude) {
        mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }

    const event = await EmergencyEvent.create({
        elderlyId,
        triggeredBy: triggeredBy || 'button',
        latitude,
        longitude,
        mapsLink,
        status: 'active',
    });

    const link = await CaregiverLink.findOne({ elderlyId, status: 'active' }).populate('caregiverId elderlyId');

    if (link && link.caregiverId && link.caregiverId.email) {
        const caregiverEmail = link.caregiverId.email;
        const elderlyName = link.elderlyId?.nickname || link.elderlyId?.fullName || 'Người thân của bạn';

        await sendEmergencyEmail(caregiverEmail, elderlyName, mapsLink, link.emergencyPhone, triggeredBy);
    }

    return {
        event,
        emergencyPhone: link ? link.emergencyPhone : null,
    };
};

const sendEmergencyEmail = async (caregiverEmail, elderlyName, mapsLink, emergencyPhone, triggeredBy) => {
    const fromAddress = process.env.EMAIL_FROM || `Digital Caregiver <${process.env.EMAIL_USER}>`;

    const locationSection = mapsLink
        ? `<div style="margin: 16px 0; text-align: center;">
            <a href="${mapsLink}" target="_blank" style="display: inline-block; padding: 14px 24px; background-color: #d9381e; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">📍 Mở vị trí GPS trên Google Maps</a>
           </div>`
        : `<p style="color: #888;">(Không có thông tin tọa độ GPS)</p>`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 2px solid #d9381e; border-radius: 12px; background-color: #fff0f0;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #d9381e; margin: 0; font-size: 24px;">🚨 CẢNH BÁO KHẨN CẤP (SOS) 🚨</h1>
                <p style="color: #62705f; font-size: 14px; margin-top: 4px;">Digital Caregiver Emergency Alert</p>
            </div>
            <div style="padding: 20px; background-color: #ffffff; border-radius: 8px;">
                <p style="color: #182317; font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">
                    ${elderlyName} vừa kích hoạt tín hiệu KHẨN CẤP!
                </p>
                <p style="color: #444; font-size: 14px; margin: 4px 0;">
                    <strong>Phương thức kích hoạt:</strong> ${triggeredBy === 'voice' ? 'Giọng nói ("Cứu tôi với")' : 'Nút bấm SOS'}
                </p>
                <p style="color: #444; font-size: 14px; margin: 4px 0;">
                    <strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}
                </p>
                ${emergencyPhone ? `<p style="color: #444; font-size: 14px; margin: 4px 0;"><strong>SĐT khẩn cấp:</strong> ${emergencyPhone}</p>` : ''}
                
                ${locationSection}

                <p style="color: #d9381e; font-size: 14px; font-weight: bold; margin-top: 16px; text-align: center;">
                    VUI LÒNG KIỂM TRA VÀ LIÊN HỆ NGAY LẬP TỨC!
                </p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: caregiverEmail,
            subject: `🚨 [KHẨN CẤP SOS] ${elderlyName} vừa kích hoạt tín hiệu trợ giúp!`,
            html: htmlContent,
        });
        console.log(`Đã gửi email SOS khẩn cấp tới ${caregiverEmail}`);
    } catch (error) {
        console.error('Lỗi gửi email SOS khẩn cấp:', error);
    }
};

export const getEmergencyHistoryService = async (caregiverId, page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const links = await CaregiverLink.find({ caregiverId, status: 'active' });
    const elderlyIds = links.map(l => l.elderlyId).filter(Boolean);

    const filter = { elderlyId: { $in: elderlyIds } };

    const total = await EmergencyEvent.countDocuments(filter);
    const events = await EmergencyEvent.find(filter)
        .populate('elderlyId', 'fullName nickname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        events,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
        },
    };
};

export const acknowledgeEmergencyService = async (caregiverId, eventId, status) => {
    const event = await EmergencyEvent.findById(eventId);
    if (!event) {
        throw new AppError('Không tìm thấy sự kiện khẩn cấp.', 404);
    }

    event.status = status || 'acknowledged';
    if (status === 'acknowledged') event.acknowledgedAt = new Date();
    if (status === 'resolved') event.resolvedAt = new Date();

    await event.save();
    return event;
};
