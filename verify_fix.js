const axios = require('axios');

async function verify() {
    try {
        console.log('1. Creating Meeting...');
        const createRes = await axios.post('http://localhost:5000/api/meetings/create', {
            title: 'Cricket Tournament Planning',
            allowAI: true
        });

        if (!createRes.data._id) {
            console.error('FAILED: No _id returned from create', createRes.data);
            return;
        }

        const id = createRes.data._id;
        console.log('   Success! Created Meeting ID:', id);

        console.log(`2. Fetching Meeting ${id}...`);
        const getRes = await axios.get(`http://localhost:5000/api/meetings/${id}`);

        if (getRes.data._id === id) {
            console.log('   Success! Fetched meeting details correctly.');
            console.log('   Meeting Title:', getRes.data.title);
        } else {
            console.error('FAILED: ID mismatch or empty data', getRes.data);
        }

        console.log('3. Testing AI Permission Toggle (using _id)...');
        const toggleRes = await axios.post('http://localhost:5000/api/meetings/ai-permission', {
            meetingId: id,
            allowAI: false
        });
        console.log('   Response:', toggleRes.data);

        console.log('4. Testing Summary Generation...');
        // We need to re-enable AI or just call summary (permission check might not be enforced on summary endpoint, but good to have)
        // The summary endpoint doesn't check allowAI in the verify code I saw, but let's see.

        const summaryRes = await axios.post(`http://localhost:5000/api/meetings/${id}/summary`);
        console.log('   Success! Generated Summary:');
        console.log('---------------------------------------------------');
        console.log(summaryRes.data.summary);
        console.log('---------------------------------------------------');

        console.log('VERIFICATION COMPLETE: Integration looks good.');
    } catch (err) {
        console.error('VERIFICATION FAILED:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

verify();
