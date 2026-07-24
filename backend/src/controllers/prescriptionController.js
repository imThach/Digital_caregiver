import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { analyzePrescriptionImage } from '../services/geminiService.js';
import { Prescription, Medication, MedicationSchedule, CaregiverLink } from '../models/index.js';

export const analyzePrescription = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Vui lòng tải lên tập tin hình ảnh đơn thuốc.', 400));
    }

    const extractedMedications = await analyzePrescriptionImage(req.file.buffer, req.file.mimetype);

    const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.status(200).json({
        status: 'success',
        message: 'Đã trích xuất thông tin đơn thuốc thành công từ Gemini AI.',
        data: {
            imageUrl: imageBase64,
            extractedMedications,
        },
    });
});

export const confirmPrescription = catchAsync(async (req, res, next) => {
    const { elderlyId, medications, imageUrl } = req.body;

    if (!elderlyId || !medications || !Array.isArray(medications) || medications.length === 0) {
        return next(new AppError('Vui lòng cung cấp elderlyId và danh sách thuốc hợp lệ.', 400));
    }

    const link = await CaregiverLink.findOne({
        caregiverId: req.user._id,
        elderlyId,
        status: 'active',
    });

    if (!link) {
        return next(new AppError('Bạn không có quyền quản lý đơn thuốc cho người cao tuổi này.', 403));
    }

    const prescription = await Prescription.create({
        elderlyId,
        uploadedBy: req.user._id,
        imageUrl: imageUrl || 'https://placeholder.co/600x400?text=Prescription+Image',
        rawAiResponse: medications,
        status: 'confirmed',
        confirmedAt: new Date(),
    });

    const createdMedications = [];

    for (const medData of medications) {
        const medication = await Medication.create({
            elderlyId,
            prescriptionId: prescription._id,
            name: medData.name,
            usageNote: medData.instructions || medData.purpose || '',
            dosage: medData.dosage || '1 viên',
            isActive: true,
        });

        const schedules = [];
        const times = medData.scheduleTimes && medData.scheduleTimes.length > 0 ? medData.scheduleTimes : ['08:00'];

        for (const timeOfDay of times) {
            const schedule = await MedicationSchedule.create({
                medicationId: medication._id,
                timeOfDay,
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Mặc định hàng ngày
                isActive: true,
            });
            schedules.push(schedule);
        }

        createdMedications.push({
            medication,
            schedules,
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'Đã lưu đơn thuốc và thiết lập lịch uống thuốc thành công.',
        data: {
            prescription,
            medications: createdMedications,
        },
    });
});

export const getElderlyPrescriptions = catchAsync(async (req, res, next) => {
    const { elderlyId } = req.params;

    const prescriptions = await Prescription.find({ elderlyId })
        .sort({ createdAt: -1 });

    const medications = await Medication.find({ elderlyId, isActive: true });

    const medicationsWithSchedules = await Promise.all(
        medications.map(async (med) => {
            const schedules = await MedicationSchedule.find({ medicationId: med._id, isActive: true });
            return {
                ...med.toObject(),
                schedules,
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: {
            prescriptions,
            medications: medicationsWithSchedules,
        },
    });
});
