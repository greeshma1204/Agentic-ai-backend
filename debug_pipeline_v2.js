require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const fs = require('fs');
const path = require('path');

async function debugPipeline() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Pipeline Debug Scan ---');

        const meetings = await Meeting.find().sort({ updatedAt: -1 }).limit(10);

        for (const m of meetings) {
            console.log(`\nMeeting: ${m.title} (${m.meetingId})`);
            console.log(`Status: ${m.status}`);
            console.log(`AudioPath: ${m.audioPath}`);
            console.log(`Summary Length: ${m.summary ? m.summary.length : 0}`);

            if (m.audioPath) {
                const cleanPath = m.audioPath.startsWith('/') ? m.audioPath.substring(1) : m.audioPath;
                const fullPath = path.join(__dirname, cleanPath);
                const exists = fs.existsSync(fullPath);
                console.log(`Audio Exists on Disk: ${exists} (${fullPath})`);
                if (exists) {
                    const stats = fs.statSync(fullPath);
                    console.log(`Audio File Size: ${stats.size} bytes`);
                }
            }

            if (m.summary && m.summary.startsWith('Error')) {
                console.log(`Stored Error: ${m.summary}`);
            }
        }

        await mongoose.connection.close();
        console.log('\n--- Scan Complete ---');
    } catch (err) {
        console.error('Debug Scan Failed:', err);
    }
}

debugPipeline();
