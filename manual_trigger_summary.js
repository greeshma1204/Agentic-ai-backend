const axios = require('axios');

async function triggerSummary() {
    try {
        const BASE_URL = 'http://localhost:5000/api';

        // 1. Find all meetings
        const res = await axios.get(`${BASE_URL}/meetings`);
        const meetings = res.data;

        // 2. Find one with audioPath but no summary
        const target = meetings.find(m => m.audioPath && !m.summary);

        if (!target) {
            console.log('No meetings found with audioPath and no summary.');
            // Let's at least show what we have
            const ended = meetings.find(m => m.status === 'ended');
            if (ended) console.log(`Found an ended meeting: ${ended.meetingId}, but summary is: ${ended.summary}`);
            return;
        }

        console.log(`Triggering summary for meeting: ${target.meetingId} (${target.title})`);
        const summaryRes = await axios.post(`${BASE_URL}/meetings/${target.meetingId}/summary`);
        console.log('Summary Result:', summaryRes.data);

    } catch (err) {
        console.error('Trigger failed:', err.message);
        if (err.response) console.error('Data:', err.response.data);
    }
}

triggerSummary();
