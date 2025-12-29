require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSimple() {
    try {
        console.log('--- Testing Simple Gemini Text ---');
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try flash first
        console.log('Testing gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log('Response:', result.response.text());

        console.log('--- Success ---');
    } catch (err) {
        console.error('Failed:', err.message);
        if (err.response) console.error('Status:', err.response.status);
    }
}

testSimple();
