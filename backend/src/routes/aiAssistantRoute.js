import express from 'express';
import * as aiAssistantController from '../controllers/aiAssistantController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Assistant
 *   description: API Trợ lý ảo Gemini hỗ trợ giọng nói cho Người cao tuổi
 */

router.use(protect);

/**
 * @swagger
 * /api/v1/ai-assistant/chat:
 *   post:
 *     summary: Gửi câu hỏi giọng nói/văn bản tới Trợ lý ảo Gemini (kèm ngữ cảnh sức khỏe)
 *     tags: [AI Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [elderlyId, message]
 *             properties:
 *               elderlyId:
 *                 type: string
 *               message:
 *                 type: string
 *                 example: "Thuốc này uống trước hay sau ăn vậy cháu?"
 *     responses:
 *       200:
 *         description: Trả về câu trả lời ngắn gọn (2-3 câu) của Gemini dùng cho TTS
 */
router.post('/chat', aiAssistantController.askAssistant);

export default router;
