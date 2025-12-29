require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require('path');
const fs = require('fs');

// Initialize Gemini (same as routes/meetings.js)
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function recoverStuckSummaries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const meetings = await Meeting.find({
            status: 'ended',
            audioPath: { $exists: true, $ne: '' },
            summary: { $in: ['', null] }
        });

        console.log(`Found ${meetings.length} stuck meetings.`);

        for (const meeting of meetings) {
            console.log(`Processing recovery for: ${meeting.meetingId} (${meeting.title})`);
            await generateAISummary(meeting.meetingId);
        }

        await mongoose.connection.close();
        console.log('Recovery finished.');
    } catch (err) {
        console.error('Recovery failed:', err);
    }
}

async function generateAISummary(meetingId) {
    let meeting;
    try {
        console.log(`[AI] Starting summary generation for: ${meetingId}`);
        meeting = await Meeting.findOne({ meetingId });

        if (!meeting) {
            console.error(`[AI] Meeting ${meetingId} not found in DB`);
            return;
        }

        // Robust path joining: handles both absolute-style (/uploads) and relative (uploads) paths
        const cleanAudioPath = meeting.audioPath.startsWith('/') ? meeting.audioPath.substring(1) : meeting.audioPath;
        const audioPath = path.join(__dirname, cleanAudioPath);

        console.log(`[AI] Checking audio file at: ${audioPath}`);

        if (!fs.existsSync(audioPath)) {
            console.error(`[AI] Audio file NOT found on disk: ${audioPath}`);
            meeting.summary = "Error: Audio file not found on server.";
            meeting.status = "failed";
            await meeting.save();
            return;
        }

        const ext = path.extname(audioPath).toLowerCase();
        const mimeType = ext === '.ogg' ? 'audio/ogg' : 'audio/webm';

        console.log(`[AI] Uploading to Gemini...`);

        let promptParts = [];
        const meetingDate = meeting.date ? new Date(meeting.date).toDateString() : "Not specified";
        const meetingTime = meeting.date ? new Date(meeting.date).toLocaleTimeString() : "Not specified";

        const textPrompt = `
You are an AI meeting assistant.

Meeting Title: ${meeting.title}
Meeting Description: ${meeting.description || "No description provided"}
Date: ${meetingDate}
Time: ${meetingTime}

Based on the meeting recording, generate:
1. Key discussion points
2. Final decisions
3. Action items using the format: - [Assignee] Task description
`;
        promptParts.push(textPrompt);

        const uploadResponse = await fileManager.uploadFile(audioPath, {
            mimeType: mimeType,
            displayName: `Meeting ${meeting.title}`,
        });

        promptParts.push({
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri
            }
        });

        console.log(`[AI] Gemini API called. Generating content...`);
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const text = response.text();

        console.log(`[AI] Summary generated successfully for: ${meetingId}`);

        meeting.summary = text;
        meeting.status = "summarized";
        await meeting.save();

        console.log(`[AI] Summary saved to DB for: ${meetingId}`);

    } catch (err) {
        console.error(`[AI] Gemini Generation Failed for ${meetingId}:`, err);
        if (meeting) {
            meeting.summary = "Error generating summary: " + err.message;
            meeting.status = "failed";
            await meeting.save();
            console.log(`[AI] Marked meeting as failed in DB due to error.`);
        }
    }
}

recoverStuckSummaries();
