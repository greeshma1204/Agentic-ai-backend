require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function checkMeetings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const meetings = await Meeting.find().sort({ createdAt: -1 }).limit(5);
        console.log('Recent Meetings:');
        meetings.forEach(m => {
            console.log(`- ID: ${m.meetingId}, Status: ${m.status}, Summary Length: ${m.summary ? m.summary.length : 0}, AudioPath: ${m.audioPath}`);
            if (m.summary && m.summary.startsWith('Error')) {
                console.log(`  Error: ${m.summary}`);
            }
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkMeetings();
