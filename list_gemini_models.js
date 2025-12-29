require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

async function listModels() {
    try {
        console.log('--- Listing Gemini Models ---');
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const res = await axios.get(url);
        console.log('Available Models:');
        res.data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (err) {
        console.error('Failed to list models:', err.message);
        if (err.response) console.error('Status:', err.response.status, 'Data:', JSON.stringify(err.response.data));
    }
}

listModels();
