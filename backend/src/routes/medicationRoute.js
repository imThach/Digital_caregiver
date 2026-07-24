import express from 'express';
import * as medicationController from '../controllers/medicationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Medications
 *   description: API Lịch uống thuốc, ghi nhận trạng thái và Báo cáo Caregiver
 */

router.use(protect);

/**
 * @swagger
 * /api/v1/medications/today/{elderlyId}:
 *   get:
 *     summary: Lấy lịch uống thuốc hôm nay của người cao tuổi
 *     tags: [Medications]
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
 *         description: "Danh sách lịch uống thuốc trong ngày"
 */
router.get('/today/:elderlyId', medicationController.getTodaySchedules);

/**
 * @swagger
 * /api/v1/medications/log:
 *   post:
 *     summary: Người cao tuổi bấm ĐÃ UỐNG hoặc NHẮC LẠI SAU 10P
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [elderlyId, scheduleId, status]
 *             properties:
 *               elderlyId:
 *                 type: string
 *               scheduleId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [taken, snoozed]
 *               snoozeMinutes:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: "Đã ghi nhận phản hồi thành công"
 */
router.post('/log', medicationController.logMedicationStatus);

/**
 * @swagger
 * /api/v1/medications/dashboard-status:
 *   get:
 *     summary: Báo cáo tổng hợp tuân thủ uống thuốc realtime cho Caregiver Dashboard
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Báo cáo trạng thái theo màu sắc (Xanh - Đã uống, Vàng - Hoãn, Đỏ - Bỏ lỡ)"
 */
router.get('/dashboard-status', restrictTo('caregiver'), medicationController.getCaregiverDashboardStatus);

export default router;
