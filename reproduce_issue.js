const axios = require('axios');

async function testCreateMeeting(dateStr) {
    const API_URL = 'http://localhost:5000/api/meetings';
    const payload = {
        title: 'Test Meeting ' + dateStr,
        description: 'Test Description',
        date: dateStr,
        allowAI: true
    };

    console.log(`\nTesting with date: "${dateStr}"`);

    try {
        const response = await axios.post(API_URL, payload);
        console.log('Status:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    await testCreateMeeting('2025-12-20T18:30'); // Valid YYYY-MM-DD
    await testCreateMeeting('20-12-2025T18:30'); // Invalid DD-MM-YYYY
}

runTests();
