import { GoogleGenAI } from '@google/genai';
import AppError from '../utils/appError.js';

const getAiInstance = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new AppError('Chưa cấu hình GEMINI_API_KEY trong tệp .env', 500);
    }
    return new GoogleGenAI({ apiKey });
};


export const analyzePrescriptionImage = async (imageBuffer, mimeType = 'image/jpeg') => {
    const ai = getAiInstance();

    const prompt = `
Bạn là bác sĩ chuyên khoa và dược sĩ giỏi. Hãy phân tích kỹ hình ảnh đơn thuốc hoặc sổ khám bệnh này và trích xuất danh sách các loại thuốc.
Yêu cầu trả về DUY NHẤT một chuỗi JSON thuần túy theo định dạng mảng đối tượng:
[
  {
    "name": "Tên thuốc chính xác",
    "purpose": "Công dụng chính (ví dụ: Giảm đau, Hạ huyết áp, Kháng sinh)",
    "dosage": "Liều lượng uống mỗi lần (ví dụ: 1 viên/lần)",
    "instructions": "Hướng dẫn chi tiết (ví dụ: Uống sau khi ăn sáng, Trước khi đi ngủ)",
    "scheduleTimes": ["08:00", "19:00"]
  }
]

Chú ý:
- Nếu là thuốc uống 1 lần/ngày vào buổi sáng: "scheduleTimes": ["08:00"]
- Nếu là thuốc uống 2 lần/ngày (sáng, tối): "scheduleTimes": ["08:00", "19:00"]
- Nếu là thuốc uống 3 lần/ngày (sáng, trưa, tối): "scheduleTimes": ["08:00", "12:00", "19:00"]
- Chuỗi JSON trả về phải hợp lệ 100%.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
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
            ],
        });

        const textResponse = response.text || '';
        console.log('Gemini Raw Response:', textResponse);

        const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch) {
            throw new AppError('Gemini không thể trích xuất thông tin đơn thuốc hợp lệ từ hình ảnh.', 422);
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        return parsedData;
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        if (error instanceof AppError) throw error;
        throw new AppError(`Lỗi phân tích đơn thuốc với Gemini: ${error.message}`, 500);
    }
};

/**
 * Trợ lý ảo AI trả lời thắc mắc của người cao tuổi qua giọng nói / văn bản
 * @param {Object} elderlyContext - Hồ sơ và lịch uống thuốc
 * @param {string} userMessage - Câu hỏi từ người cao tuổi
 */
export const chatWithElderlyAssistant = async (elderlyContext, userMessage) => {
    const ai = getAiInstance();

    const systemPrompt = `
Bạn là 'Digital Caregiver' - trợ lý sức khỏe ân cần, lễ phép, ấm áp dành cho người cao tuổi.
Quy tắc trả lời:
- Luôn xưng "cháu" và gọi "bà" hoặc "ông" (dựa theo thông tin hồ sơ).
- Trả lời thật ngắn gọn (tối đa 2-3 câu), câu từ đơn giản, dễ nghe, dễ hiểu để dùng cho Text-to-Speech.
- Thể hiện sự quan tâm, ân cần.

Hồ sơ sức khỏe & lịch uống thuốc hiện tại:
${JSON.stringify(elderlyContext, null, 2)}

Câu hỏi của người cao tuổi: "${userMessage}"
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
            ],
        });

        return response.text ? response.text.trim() : 'Dạ cháu nghe chưa rõ, bà có thể nói lại giúp cháu được không ạ?';
    } catch (error) {
        console.error('Gemini Chat Error:', error);
        return 'Dạ cháu xin lỗi, hiện tại mạng bị gián đoạn. Bà nhớ giữ gìn sức khỏe nhé.';
    }
};
