const axios = require('axios');

async function testGetMeeting(meetingId) {
    const API_URL = `http://localhost:5000/api/meetings/${meetingId}`;
    console.log(`\nFetching meeting: ${API_URL}`);

    try {
        const start = Date.now();
        const response = await axios.get(API_URL);
        const end = Date.now();

        console.log('Status:', response.status);
        console.log('Time taken:', end - start, 'ms');
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    // Let's find a valid meeting ID first
    try {
        const meetings = await axios.get('http://localhost:5000/api/meetings');
        if (meetings.data.length > 0) {
            const id = meetings.data[0].meetingId;
            await testGetMeeting(id);
        } else {
            console.log('No meetings found to test with.');
        }
    } catch (e) {
        console.error('Failed to list meetings:', e.message);
    }
}

runTests();
