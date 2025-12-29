const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAudioUpload() {
    const meetingId = 'test-upload-' + Date.now();
    const apiUrl = 'http://localhost:5000/api/meetings';

    try {
        console.log('1. Creating test meeting...');
        const createRes = await axios.post(apiUrl, {
            title: 'Upload Test Meeting',
            description: 'Testing manually triggered upload'
        });
        const mId = createRes.data.meetingId;
        console.log(`Meeting created: ${mId}`);

        console.log('2. Preparing dummy audio...');
        const dummyPath = path.join(__dirname, 'test_audio_dummy.webm');
        if (!fs.existsSync(dummyPath)) {
            fs.writeFileSync(dummyPath, 'This is a dummy webm data for testing.');
        }

        const form = new FormData();
        form.append('audio', fs.createReadStream(dummyPath), {
            filename: `${mId}.webm`,
            contentType: 'audio/webm',
        });

        console.log(`3. Uploading audio to ${apiUrl}/${mId}/audio ...`);
        const uploadRes = await axios.post(`${apiUrl}/${mId}/audio`, form, {
            headers: form.getHeaders(),
        });
        console.log('Upload Success:', uploadRes.data);

        console.log('4. Waiting for 10 seconds to check status...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        const statusRes = await axios.get(`${apiUrl}/${mId}/summary`);
        console.log('Final Status:', statusRes.data);

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
    }
}

testAudioUpload();
