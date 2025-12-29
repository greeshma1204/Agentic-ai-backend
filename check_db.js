const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const Meeting = require('./models/Meeting');

async function checkRecentMeetings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const meetings = await Meeting.find({ createdAt: { $gt: today } }).sort({ createdAt: -1 });

        if (meetings.length === 0) {
            console.log('No meetings found created today.');
        } else {
            console.log(`Found ${meetings.length} meetings created today:`);
            meetings.forEach(m => {
                console.log(`- Title: ${m.title}, ID: ${m.meetingId}, Status: ${m.status}, AudioPath: ${m.audioPath || 'N/A'}`);
            });
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkRecentMeetings();
