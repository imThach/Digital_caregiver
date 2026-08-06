import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { analyzePrescriptionImage } from '../services/geminiService.js';
import { Prescription, Medication, MedicationSchedule, CaregiverLink } from '../models/index.js';
import { uploadImageBuffer } from '../configs/cloudinary.js';
import { searchMedicationImage, enrichMedicationsWithImages } from '../services/googleSearchService.js';

export const analyzePrescription = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Vui lòng tải lên tập tin hình ảnh đơn thuốc.', 400));
    }

    let imageUrl = '';
    try {
        const cloudResult = await uploadImageBuffer(req.file.buffer, 'digital-caregiver/prescriptions');
        imageUrl = cloudResult.secure_url;
    } catch {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const rawExtractedMeds = await analyzePrescriptionImage(req.file.buffer, req.file.mimetype);
    const extractedMedications = await enrichMedicationsWithImages(rawExtractedMeds);

    res.status(200).json({
        status: 'success',
        message: 'Đã trích xuất thông tin đơn thuốc và tìm hình ảnh minh họa thành công.',
        data: {
            imageUrl,
            extractedMedications,
        },
    });
});

export const confirmPrescription = catchAsync(async (req, res, next) => {
    const { prescriptionId, elderlyId, medications, imageUrl, title, startDate } = req.body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
        return next(new AppError('Vui lòng cung cấp danh sách thuốc hợp lệ.', 400));
    }

    let targetElderlyId = elderlyId;
    let link = null;

    if (targetElderlyId && targetElderlyId !== 'demo-elderly-id' && targetElderlyId !== 'undefined') {
        link = await CaregiverLink.findOne({
            caregiverId: req.user._id,
            elderlyId: targetElderlyId,
            status: { $in: ['active', 'pending'] },
        });
    }

    if (!link) {
        link = await CaregiverLink.findOne({
            caregiverId: req.user._id,
            status: { $in: ['active', 'pending'] },
        }).sort({ linkedAt: -1, createdAt: -1 });

        if (link && link.elderlyId) {
            targetElderlyId = link.elderlyId;
        }
    }

    if (!link || !targetElderlyId) {
        return next(new AppError('Không tìm thấy liên kết người cao tuổi để lưu đơn thuốc.', 400));
    }

    let prescription = null;

    if (prescriptionId) {
        prescription = await Prescription.findById(prescriptionId);
        if (prescription) {
            prescription.title = title || prescription.title;
            if (imageUrl) prescription.imageUrl = imageUrl;
            prescription.rawAiResponse = medications;
            prescription.updatedAt = new Date();
            await prescription.save();

            // Clear previous medications & schedules associated with this prescription
            const oldMeds = await Medication.find({ prescriptionId: prescription._id });
            const oldMedIds = oldMeds.map((m) => m._id);
            await MedicationSchedule.deleteMany({ medicationId: { $in: oldMedIds } });
            await Medication.deleteMany({ prescriptionId: prescription._id });
        }
    }

    if (!prescription) {
        prescription = await Prescription.create({
            elderlyId: targetElderlyId,
            uploadedBy: req.user._id,
            imageUrl: imageUrl || 'https://placeholder.co/600x400?text=Prescription+Image',
            title: title || 'Đơn thuốc khám bệnh',
            rawAiResponse: medications,
            status: 'confirmed',
            confirmedAt: new Date(),
        });
    }

    const createdMedications = [];

    for (const medData of medications) {
        let medImageUrl = medData.imageUrl;
        if (!medImageUrl && medData.name) {
            medImageUrl = await searchMedicationImage(medData.name);
        }

        const totalQty = Number(medData.totalQuantity || medData.quantity || 30);
        const remainingQty = Number(medData.remainingQuantity !== undefined ? medData.remainingQuantity : totalQty);
        const durationDays = Number(medData.durationDays || Math.ceil(totalQty / (medData.scheduleTimes?.length || 1)));

        let calculatedStartDate = new Date();
        if (startDate) {
            calculatedStartDate = new Date(startDate);
        } else if (medData.startDate) {
            calculatedStartDate = new Date(medData.startDate);
        }
        calculatedStartDate.setHours(0, 0, 0, 0);

        const medication = await Medication.create({
            elderlyId: targetElderlyId,
            prescriptionId: prescription._id,
            name: medData.name,
            usageNote: medData.instructions || medData.purpose || '',
            dosage: medData.dosage || '1 viên',
            totalQuantity: totalQty,
            remainingQuantity: remainingQty,
            durationDays: durationDays,
            imageUrl: medImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(medData.name || 'Thuốc')}&background=0058be&color=fff&size=256`,
            startDate: calculatedStartDate,
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
    let { elderlyId } = req.params;

    if (!elderlyId || elderlyId === 'undefined' || elderlyId === 'null' || elderlyId === 'demo-elderly-id') {
        const link = await CaregiverLink.findOne({
            caregiverId: req.user._id,
            status: { $in: ['active', 'pending'] },
        }).sort({ linkedAt: -1, createdAt: -1 });

        if (link) {
            elderlyId = link.elderlyId;
        }
    }

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

export const deletePrescription = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return next(new AppError('Không tìm thấy đơn thuốc cần xóa.', 404));
    }

    // Tìm và xóa tất cả các thuốc + lịch uống liên quan đến đơn thuốc này
    const medications = await Medication.find({ prescriptionId: prescription._id });
    const medIds = medications.map((m) => m._id);

    await MedicationSchedule.deleteMany({ medicationId: { $in: medIds } });
    await Medication.deleteMany({ prescriptionId: prescription._id });
    await Prescription.findByIdAndDelete(id);

    res.status(200).json({
        status: 'success',
        message: 'Đã xóa đơn thuốc và các thuốc liên quan thành công.',
    });
});
