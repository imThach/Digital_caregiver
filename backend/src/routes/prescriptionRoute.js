import express from 'express';
import * as prescriptionController from '../controllers/prescriptionController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: API Quản lý đơn thuốc & Phân tích bằng Gemini AI
 */

router.use(protect);

/**
 * @swagger
 * /api/v1/prescriptions/analyze:
 *   post:
 *     summary: Tải ảnh đơn thuốc/sổ khám bệnh và trích xuất bằng Gemini AI Vision
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Trả về dữ liệu danh mục thuốc trích xuất dưới dạng JSON
 */
router.post('/analyze', restrictTo('caregiver'), uploadSingleImage, prescriptionController.analyzePrescription);

/**
 * @swagger
 * /api/v1/prescriptions/confirm:
 *   post:
 *     summary: Xác nhận lưu đơn thuốc và tạo lịch uống thuốc tự động
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [elderlyId, medications]
 *             properties:
 *               elderlyId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     purpose:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     instructions:
 *                       type: string
 *                     scheduleTimes:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Đã lưu đơn thuốc và thiết lập lịch uống thuốc
 */
router.post('/confirm', restrictTo('caregiver'), prescriptionController.confirmPrescription);

/**
 * @swagger
 * /api/v1/prescriptions/elderly/{elderlyId}:
 *   get:
 *     summary: Lấy danh sách đơn thuốc và thuốc đang sử dụng của người cao tuổi
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: elderlyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách đơn thuốc và thuốc active
 */
router.get('/elderly/:elderlyId', prescriptionController.getElderlyPrescriptions);

/**
 * @swagger
 * /api/v1/prescriptions/{id}:
 *   delete:
 *     summary: Xóa đơn thuốc và toàn bộ lịch uống thuốc liên quan
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa đơn thuốc thành công
 */
router.delete('/:id', restrictTo('caregiver'), prescriptionController.deletePrescription);

export default router;
