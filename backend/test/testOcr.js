import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testPrescriptionOcr() {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const prompt = `
Bạn là bác sĩ chuyên khoa và dược sĩ giỏi. Hãy phân tích kỹ hình ảnh đơn thuốc hoặc sổ khám bệnh này và trích xuất danh sách các loại thuốc.
Yêu cầu trả về DUY NHẤT một chuỗi JSON thuần túy theo định dạng mảng đối tượng:
[
  {
    "name": "Tên thuốc chính xác",
    "purpose": "Công dụng chính",
    "dosage": "Liều lượng uống mỗi lần",
    "instructions": "Hướng dẫn chi tiết",
    "scheduleTimes": ["08:00", "19:00"]
  }
]
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: sampleBase64 } },
                        { text: prompt }
                    ]
                }
            ]
        });

        console.log('OCR Output text:', response.text);
    } catch (err) {
        console.error('OCR test error:', err.message);
    }
}

testPrescriptionOcr();
