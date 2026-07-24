import express from 'express';
import * as emergencyController from '../controllers/emergencyController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Emergency
 *   description: API Cảnh báo khẩn cấp SOS và Vị trí GPS
 */

router.use(protect);

/**
 * @swagger
 * /api/v1/emergency/sos:
 *   post:
 *     summary: Kích hoạt tín hiệu khẩn cấp SOS (nút bấm hoặc giọng nói 'Cứu tôi với')
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [elderlyId]
 *             properties:
 *               elderlyId:
 *                 type: string
 *               triggeredBy:
 *                 type: string
 *                 enum: [button, voice]
 *                 default: button
 *               latitude:
 *                 type: number
 *                 example: 10.7769
 *               longitude:
 *                 type: number
 *                 example: 106.7009
 *     responses:
 *       200:
 *         description: Đã phát tín hiệu SOS và tự động gửi Email kèm link Google Maps cho Caregiver
 */
router.post('/sos', emergencyController.triggerSOS);

/**
 * @swagger
 * /api/v1/emergency/history:
 *   get:
 *     summary: Caregiver xem lịch sử tín hiệu cảnh báo khẩn cấp
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách các sự kiện SOS
 */
router.get('/history', restrictTo('caregiver'), emergencyController.getEmergencyHistory);

/**
 * @swagger
 * /api/v1/emergency/{id}/acknowledge:
 *   patch:
 *     summary: Caregiver xác nhận hoặc xử lý xong sự kiện khẩn cấp
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [acknowledged, resolved]
 *     responses:
 *       200:
 *         description: Đã cập nhật trạng thái sự kiện SOS
 */
router.patch('/:id/acknowledge', restrictTo('caregiver'), emergencyController.acknowledgeEmergency);

export default router;
