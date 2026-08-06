import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testGeminiModels() {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    console.log('Testing with GOOGLE_SEARCH_API_KEY prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

    const ai = new GoogleGenAI({ apiKey });

    const modelsToTest = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro'
    ];

    for (const model of modelsToTest) {
        try {
            console.log(`Testing model: ${model}...`);
            const res = await ai.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: 'Hello, respond with OK' }] }]
            });
            console.log(`SUCCESS [${model}]:`, res.text ? res.text.trim() : 'No text');
            return model;
        } catch (err) {
            console.log(`FAILED [${model}]:`, err.message);
        }
    }
}

testGeminiModels();
