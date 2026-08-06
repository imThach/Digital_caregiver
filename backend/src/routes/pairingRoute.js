import express from 'express';
import * as pairingController from '../controllers/pairingController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import AppError from '../utils/appError.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new AppError('Chỉ chấp nhận tập tin hình ảnh.', 400), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * tags:
 *   name: Pairing
 *   description: API Quản lý kết nối thiết bị giữa Người thân và Người cao tuổi
 */

/**
 * @swagger
 * /api/v1/pairing/connect:
 *   post:
 *     summary: Thiết bị Người cao tuổi nhập mã 6 số để kết nối
 *     tags: [Pairing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pairingCode]
 *             properties:
 *               pairingCode:
 *                 type: string
 *                 example: "839201"
 *               nickname:
 *                 type: string
 *                 example: "Bà Nội"
 *     responses:
 *       200:
 *         description: Kết nối thiết bị thành công, trả về JWT Token của thiết bị
 */
router.post('/connect', pairingController.connectDevice);

router.use(protect);

/**
 * @swagger
 * /api/v1/pairing/generate:
 *   post:
 *     summary: Caregiver tạo mã kết nối 6 chữ số (Hiệu lực 24h)
 *     tags: [Pairing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về mã pairingCode 6 chữ số
 */
router.post('/generate', restrictTo('caregiver'), pairingController.generateCode);

/**
 * @swagger
 * /api/v1/pairing/my-elderly:
 *   get:
 *     summary: Caregiver lấy danh sách người cao tuổi đã liên kết
 *     tags: [Pairing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách người cao tuổi
 */
router.get('/my-elderly', restrictTo('caregiver'), pairingController.getMyElderly);

router.get('/family-profile', restrictTo('caregiver'), pairingController.getFamilyProfile);
router.patch(
    '/family-profile',
    restrictTo('caregiver'),
    upload.fields([
        { name: 'caregiverAvatar', maxCount: 1 },
        { name: 'elderlyAvatar', maxCount: 1 },
    ]),
    pairingController.updateFamilyProfile,
);

/**
 * @swagger
 * /api/v1/pairing/elderly-profile:
 *   patch:
 *     summary: Caregiver cập nhật thông tin người cao tuổi (Tên gọi, SĐT khẩn cấp...)
 *     tags: [Pairing]
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
 *               nickname:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã cập nhật hồ sơ thành công
 */
router.patch('/elderly-profile', restrictTo('caregiver'), pairingController.updateElderlyProfile);

export default router;
