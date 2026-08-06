import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing GEMINI_API_KEY prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

    const ai = new GoogleGenAI({ apiKey });

    try {
        console.log('Listing available models for this key...');
        const modelsPager = await ai.models.list();
        for await (const m of modelsPager) {
            console.log(`Model: ${m.name} | Display: ${m.displayName}`);
        }
    } catch (err) {
        console.error('List models failed:', err.message);
    }
}

checkModels();
