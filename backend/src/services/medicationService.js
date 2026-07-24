import { Medication, MedicationSchedule, MedicationLog, CaregiverLink, User } from '../models/index.js';
import AppError from '../utils/appError.js';
import { sendOtpEmail } from './emailService.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const getTodaySchedulesService = async (elderlyId) => {
    const activeMedications = await Medication.find({ elderlyId, isActive: true });
    const medIds = activeMedications.map(m => m._id);

    const schedules = await MedicationSchedule.find({
        medicationId: { $in: medIds },
        isActive: true,
    }).populate('medicationId', 'name usageNote dosage imageUrl');

    // Xác định đầu ngày và cuối ngày theo giờ địa phương
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await MedicationLog.find({
        elderlyId,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const logMap = new Map();
    logs.forEach(log => {
        logMap.set(log.scheduleId.toString(), log);
    });

    const result = schedules.map(sch => {
        const existingLog = logMap.get(sch._id.toString());
        return {
            scheduleId: sch._id,
            medicationId: sch.medicationId?._id,
            medicationName: sch.medicationId?.name || 'Thuốc',
            usageNote: sch.medicationId?.usageNote || '',
            dosage: sch.medicationId?.dosage || '1 viên',
            imageUrl: sch.medicationId?.imageUrl || '',
            timeOfDay: sch.timeOfDay,
            status: existingLog ? existingLog.status : 'pending',
            respondedAt: existingLog ? existingLog.respondedAt : null,
            snoozeUntil: existingLog ? existingLog.snoozeUntil : null,
        };
    });

    // Sắp xếp theo thứ tự giờ uống trong ngày (08:00, 12:00, 19:00...)
    result.sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));

    return result;
};

export const logMedicationStatusService = async (elderlyId, scheduleId, status, snoozeMinutes = 10) => {
    const schedule = await MedicationSchedule.findById(scheduleId);
    if (!schedule) {
        throw new AppError('Không tìm thấy lịch uống thuốc này.', 404);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let log = await MedicationLog.findOne({
        scheduleId,
        scheduledAt: { $gte: startOfDay },
    });

    const now = new Date();

    if (!log) {
        log = new MedicationLog({
            scheduleId,
            medicationId: schedule.medicationId,
            elderlyId,
            scheduledAt: now,
            status,
        });
    } else {
        log.status = status;
    }

    if (status === 'taken') {
        log.respondedAt = now;
        log.snoozeUntil = null;
    } else if (status === 'snoozed') {
        log.snoozeUntil = new Date(now.getTime() + snoozeMinutes * 60 * 1000);
    }

    await log.save();
    return log;
};

export const getCaregiverDashboardStatusService = async (caregiverId) => {
    const links = await CaregiverLink.find({ caregiverId, status: 'active' }).populate('elderlyId');

    const result = await Promise.all(
        links.map(async (link) => {
            const elderly = link.elderlyId;
            if (!elderly) return null;

            const todaySchedules = await getTodaySchedulesService(elderly._id);

            const takenCount = todaySchedules.filter(s => s.status === 'taken').length;
            const snoozedCount = todaySchedules.filter(s => s.status === 'snoozed').length;
            const pendingCount = todaySchedules.filter(s => s.status === 'pending').length;

            return {
                elderly: {
                    id: elderly._id,
                    fullName: elderly.fullName,
                    nickname: elderly.nickname,
                    emergencyPhone: link.emergencyPhone,
                },
                summary: {
                    total: todaySchedules.length,
                    taken: takenCount,
                    snoozed: snoozedCount,
                    pending: pendingCount,
                },
                schedules: todaySchedules,
            };
        })
    );

    return result.filter(Boolean);
};

export const checkOverdueMedicationsAndNotify = async () => {
    const links = await CaregiverLink.find({ status: 'active' }).populate('caregiverId elderlyId');

    const now = new Date();

    for (const link of links) {
        const caregiver = link.caregiverId;
        const elderly = link.elderlyId;
        if (!caregiver || !elderly || !caregiver.email) continue;

        const todaySchedules = await getTodaySchedulesService(elderly._id);

        for (const sch of todaySchedules) {
            if (sch.status === 'taken') continue;

            const [hours, minutes] = sch.timeOfDay.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // Kiểm tra nếu đã quá 30 phút so với giờ hẹn
            const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);

            if (diffMinutes >= 30) {
                // Kiểm tra xem đã gửi mail chưa
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                let log = await MedicationLog.findOne({
                    scheduleId: sch.scheduleId,
                    scheduledAt: { $gte: startOfDay },
                });

                if (!log) {
                    log = await MedicationLog.create({
                        scheduleId: sch.scheduleId,
                        medicationId: sch.medicationId,
                        elderlyId: elderly._id,
                        scheduledAt: scheduledTime,
                        status: 'missed',
                        caregiverNotifiedAt: now,
                    });
                    await sendMissedMedicationEmail(caregiver.email, elderly.nickname || elderly.fullName, sch.medicationName, sch.timeOfDay);
                } else if (!log.caregiverNotifiedAt) {
                    log.status = 'missed';
                    log.caregiverNotifiedAt = now;
                    await log.save();
                    await sendMissedMedicationEmail(caregiver.email, elderly.nickname || elderly.fullName, sch.medicationName, sch.timeOfDay);
                }
            }
        }
    }
};

const sendMissedMedicationEmail = async (caregiverEmail, elderlyName, medName, timeOfDay) => {
    const fromAddress = process.env.EMAIL_FROM || `Digital Caregiver <${process.env.EMAIL_USER}>`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #f0a0a0; border-radius: 12px; background-color: #fff8f8;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #d9381e; margin: 0;">⚠️ CẢNH BÁO UỐNG THUỐC</h2>
                <p style="color: #62705f; font-size: 14px; margin-top: 4px;">Digital Caregiver Alert</p>
            </div>
            <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #d9381e;">
                <p style="color: #182317; font-size: 15px; margin: 0 0 8px 0;">Xin chào,</p>
                <p style="color: #182317; font-size: 15px; line-height: 1.5; margin: 0;">
                    Hệ thống ghi nhận <strong>${elderlyName}</strong> vẫn <strong>CHƯA XÁC NHẬN UỐNG THUỐC</strong>:
                </p>
                <div style="margin: 14px 0; padding: 12px; background-color: #f7f9f5; border-radius: 6px;">
                    <p style="margin: 4px 0; font-weight: bold; color: #176c3a;">Thuốc: ${medName}</p>
                    <p style="margin: 4px 0; color: #62705f;">Lịch hẹn: ${timeOfDay} (Đã quá 30 phút)</p>
                </div>
                <p style="color: #62705f; font-size: 13px; margin: 0;">Vui lòng liên hệ nhắc nhở người thân để đảm bảo sức khỏe.</p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: caregiverEmail,
            subject: `[Cảnh báo] ${elderlyName} chưa uống thuốc ${medName} (${timeOfDay})`,
            html: htmlContent,
        });
        console.log(`Đã gửi email cảnh báo bỏ lỡ thuốc cho ${caregiverEmail}`);
    } catch (error) {
        console.error('Lỗi gửi email cảnh báo thuốc:', error);
    }
};
