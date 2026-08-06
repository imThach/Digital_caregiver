import { GoogleGenAI } from '@google/genai';
import AppError from '../utils/appError.js';

const getAiInstance = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
    if (!apiKey) {
        throw new AppError('Chưa cấu hình GEMINI_API_KEY trong tệp .env', 500);
    }
    return new GoogleGenAI({ apiKey });
};

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const generateContentWithFallback = async (ai, contentPayload) => {
    const modelsToTry = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini AI] Executing model: ${modelName}`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: contentPayload,
            });
            return response;
        } catch (err) {
            console.warn(`[Gemini AI] Model ${modelName} call failed: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError || new Error('Tất cả các phiên bản Gemini AI model đều không phản hồi.');
};

/**
 * Phân tích ảnh đơn thuốc sử dụng Gemini Vision AI mới nhất
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 */
export const analyzePrescriptionImage = async (imageBuffer, mimeType = 'image/jpeg') => {
    const ai = getAiInstance();

    const prompt = `
Bạn là bác sĩ chuyên khoa và dược sĩ giỏi. Hãy đọc và phân tích kỹ hình ảnh đơn thuốc hoặc sổ khám bệnh này để trích xuất chính xác danh sách các loại thuốc.
Yêu cầu trả về DUY NHẤT một chuỗi JSON thuần túy theo định dạng mảng đối tượng:
[
  {
    "name": "Tên thuốc chính xác",
    "purpose": "Công dụng chính (ví dụ: Giảm đau, Hạ huyết áp, Kháng sinh)",
    "dosage": "Liều lượng uống mỗi lần (ví dụ: 1 viên/lần)",
    "instructions": "Hướng dẫn chi tiết (ví dụ: Uống sau khi ăn sáng, Trước khi đi ngủ)",
    "scheduleTimes": ["07:00", "18:00"],
    "totalQuantity": 20,
    "durationDays": 10
  }
]

Chú ý:
- Phân tích cẩn thận chữ viết hoặc chữ in trong hình ảnh để lấy đúng tên thuốc, liều lượng, số lần uống, tổng số lượng viên được kê (totalQuantity) và số ngày dùng thuốc (durationDays).
- Quy đổi giờ uống theo các khung buổi cố định sinh hoạt:
  + Buổi Sáng: "07:00"
  + Buổi Trưa: "11:00"
  + Buổi Tối: "18:00"
  + Buổi Đêm / Đi ngủ: "21:00"
- Nếu ghi "uống 1 lần/ngày vào buổi sáng": "scheduleTimes": ["07:00"]
- Nếu ghi "uống 2 lần/ngày (sáng, tối)": "scheduleTimes": ["07:00", "18:00"]
- Nếu ghi "uống 3 lần/ngày (sáng, trưa, tối)": "scheduleTimes": ["07:00", "11:00", "18:00"]
- Nếu ghi "uống trước khi đi ngủ": "scheduleTimes": ["21:00"]
- Chuỗi JSON trả về phải hợp lệ 100%. Không đính kèm ký tự markdown hay lời giải thích thừa.
`;

    try {
        const payload = [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType || 'image/jpeg',
                            data: imageBuffer.toString('base64'),
                        },
                    },
                    { text: prompt },
                ],
            },
        ];

        const response = await generateContentWithFallback(ai, payload);
        const textResponse = response.text || '';
        console.log('Gemini AI Raw OCR Response:', textResponse);

        const arrayMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!arrayMatch) {
            if (textResponse.trim() === '[]') {
                return [];
            }
            throw new AppError('Gemini AI không thể trích xuất thông tin đơn thuốc hợp lệ từ hình ảnh.', 422);
        }

        const parsedData = JSON.parse(arrayMatch[0]);
        return parsedData;
    } catch (error) {
        console.error('Gemini Vision Error:', error.message);
        if (error instanceof AppError) throw error;
        throw new AppError(`Lỗi phân tích đơn thuốc với Gemini AI: ${error.message}`, 500);
    }
};

/**
 * Trợ lý ảo AI trả lời thắc mắc của người cao tuổi qua giọng nói / văn bản
 * @param {Object} elderlyContext - Hồ sơ và lịch uống thuốc
 * @param {string} userMessage - Câu hỏi từ người cao tuổi
 */
export const chatWithElderlyAssistant = async (elderlyContext, userMessage) => {
    const ai = getAiInstance();

    const promptText = `
Hồ sơ sức khỏe & lịch uống thuốc hiện tại của người dùng:
${JSON.stringify(elderlyContext, null, 2)}

Dựa trên hồ sơ sức khỏe hiện tại của người dùng, hãy trả lời câu hỏi: "${userMessage}".
Yêu cầu trả lời: Xưng "cháu" và gọi "bà" (hoặc "ông"), trả lời lễ phép, ân cần, ngắn gọn (tối đa 2-3 câu) để phát âm qua giọng đọc Text-to-Speech.
`;

    try {
        const payload = [
            {
                role: 'user',
                parts: [{ text: promptText }],
            },
        ];

        const response = await generateContentWithFallback(ai, payload);
        return response.text ? response.text.trim() : 'Dạ cháu nghe chưa rõ, bà có thể nói lại giúp cháu được không ạ?';
    } catch (error) {
        console.error('Gemini Chat Error:', error.message);
        return 'Dạ cháu nghe rõ rồi ạ. Bà nhớ giữ gìn sức khỏe và uống thuốc đúng giờ nhé!';
    }
};
