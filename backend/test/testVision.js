import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testAllActiveModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const models = [
        'gemini-flash-latest',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-pro-latest',
        'gemini-2.0-flash-lite'
    ];

    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    for (const model of models) {
        try {
            console.log(`Testing model: ${model}...`);
            const res = await ai.models.generateContent({
                model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: 'image/png', data: sampleBase64 } },
                            { text: 'Hello, reply OK' }
                        ]
                    }
                ]
            });
            console.log(`SUCCESS [${model}]:`, res.text ? res.text.trim() : 'No text');
        } catch (err) {
            console.log(`FAILED [${model}]:`, err.message);
        }
    }
}

testAllActiveModels();
