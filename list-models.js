require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The listModels method might not be directly on genAI in all versions, 
        // but let's try to see if we can find it.
        // Actually, let's just try to call gemini-pro which is usually safer.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-pro:", result.response.text());
    } catch (err) {
        console.error("Error with gemini-pro:", err);
    }
}

listModels();
