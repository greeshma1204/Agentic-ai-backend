require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function listAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const meetings = await Meeting.find().sort({ createdAt: -1 });
        console.log(`Found ${meetings.length} meetings:`);
        meetings.forEach(m => {
            console.log(`- Title: ${m.title}, ID: ${m.meetingId}, Status: ${m.status}, AI Joined: ${m.aiJoined}`);
        });
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

listAll();
