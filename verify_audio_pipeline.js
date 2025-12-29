const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function verifyAudioPipeline() {
    const baseUrl = 'http://localhost:5000/api/meetings';
    const TEST_MEETING_ID = 'test-audio-' + Date.now();

    try {
        console.log('--- Step 1: Create Meeting ---');
        const createRes = await axios.post(`${baseUrl}/create`, {
            title: "Audio Pipeline Test Meeting",
            allowAI: true
        });
        const meeting = createRes.data;
        const meetingId = meeting.meetingId;
        console.log(`Created Meeting ID: ${meetingId}`);

        console.log('\n--- Step 2: Upload Dummy Audio ---');
        const dummyAudioPath = path.join(__dirname, 'test_audio.webm');
        // Create a dummy file if it doesn't exist
        if (!fs.existsSync(dummyAudioPath)) {
            fs.writeFileSync(dummyAudioPath, 'dummy audio content');
        }

        const form = new FormData();
        form.append('audio', fs.createReadStream(dummyAudioPath));

        const uploadRes = await axios.post(`${baseUrl}/${meetingId}/audio`, form, {
            headers: form.getHeaders()
        });
        console.log('Upload Result:', uploadRes.data);

        console.log('\n--- Step 3: Generate Summary ---');
        console.log('Sending summary request (this might take a while)...');
        const summaryRes = await axios.post(`${baseUrl}/${meetingId}/summary`);
        console.log('Summary Result:', summaryRes.data.summary.substring(0, 100) + '...');

        console.log('\n✅ AUDIO PIPELINE VERIFICATION SUCCESSFUL!');

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

verifyAudioPipeline();
