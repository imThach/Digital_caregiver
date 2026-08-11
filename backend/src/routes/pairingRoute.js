import express from 'express';
import rateLimit from 'express-rate-limit';
import * as pairingController from '../controllers/pairingController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Rate limiter cho route /connect (không yêu cầu auth)
// Mã pairing chỉ có 900.000 khả năng → cần chặn brute-force
const connectRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5,                    // Tối đa 5 lần thử mỗi IP
    message: {
        status: 'fail',
        message: 'Quá nhiều lần thử kết nối. Vui lòng đợi 15 phút rồi thử lại.',
    },
    standardHeaders: true,
    legacyHeaders: false,
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
 *       400:
 *         description: Mã kết nối không chính xác hoặc đã hết hạn
 *       429:
 *         description: Quá nhiều lần thử, bị giới hạn tốc độ
 */
router.post('/connect', connectRateLimiter, pairingController.connectDevice);

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
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
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
 *         description: Trả về danh sách người cao tuổi đã liên kết thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/my-elderly', restrictTo('caregiver'), pairingController.getMyElderly);

/**
 * @swagger
 * /api/v1/pairing/family-profile:
 *   get:
 *     summary: Caregiver lấy thông tin hồ sơ gia đình và trạng thái hoàn thiện
 *     tags: [Pairing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin Caregiver, Elderly liên kết và danh sách các trường chưa điền (missingFields)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/family-profile', restrictTo('caregiver'), pairingController.getFamilyProfile);

/**
 * @swagger
 * /api/v1/pairing/family-profile:
 *   patch:
 *     summary: Caregiver cập nhật hồ sơ gia đình (thông tin bản thân, người cao tuổi & ảnh đại diện)
 *     tags: [Pairing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caregiverFullName:
 *                 type: string
 *               caregiverPhone:
 *                 type: string
 *               elderlyFullName:
 *                 type: string
 *               elderlyNickname:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *               relationship:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               caregiverAvatar:
 *                 type: string
 *                 format: binary
 *               elderlyAvatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Đã cập nhật hồ sơ gia đình thành công
 *       400:
 *         description: Dữ liệu nhập vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
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
 *               fullName:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *               relationship:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Đã cập nhật hồ sơ người cao tuổi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy liên kết với người cao tuổi
 */
router.patch('/elderly-profile', restrictTo('caregiver'), pairingController.updateElderlyProfile);

/**
 * @swagger
 * /api/v1/pairing/generate-relogin:
 *   post:
 *     summary: Caregiver tạo mã đăng nhập lại 6 chữ số (Hiệu lực 1h) cho elderly đã có
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
 *     responses:
 *       200:
 *         description: Trả về mã reloginCode 6 chữ số
 *       400:
 *         description: Thiếu elderlyId
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy liên kết
 * 
 */
router.post('/generate-relogin', restrictTo('caregiver'), pairingController.generateReloginCode);

export default router;
