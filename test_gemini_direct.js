require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require('path');
const fs = require('fs');

async function testGemini() {
    try {
        console.log('--- Testing Gemini Audio Summary ---');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY missing');

        const fileManager = new GoogleAIFileManager(apiKey);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Create a tiny dummy audio file if not exists
        const dummyAudio = path.join(__dirname, 'test_audio_dummy.webm');
        if (!fs.existsSync(dummyAudio)) {
            // Write a tiny bit of data - enough to be a valid-ish file for Gemini?
            // Actually, we should use a real small webm if possible, or just see if it rejects it
            fs.writeFileSync(dummyAudio, Buffer.from([0x1A, 0x45, 0xDF, 0xA3])); // EBML header
        }

        console.log('1. Uploading file...');
        const uploadResponse = await fileManager.uploadFile(dummyAudio, {
            mimeType: 'audio/webm',
            displayName: 'Test Audio',
        });
        console.log(`   Uploaded: ${uploadResponse.file.uri}`);

        console.log('2. Generating summary...');
        const result = await model.generateContent([
            "Summarize this audio.",
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            }
        ]);
        const response = await result.response;
        console.log('   Response received!');
        console.log('   Text:', response.text());

        console.log('--- Test Complete ---');
    } catch (err) {
        console.error('Test Failed:', err);
        if (err.response) console.error('Data:', err.response.data);
    }
}

testGemini();
