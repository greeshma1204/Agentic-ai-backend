const axios = require('axios');

async function verifyFlow() {
    const baseUrl = 'http://localhost:5000/api/meetings';

    try {
        console.log('--- Step 1: Create Meeting ---');
        const createRes = await axios.post(`${baseUrl}/create`, {
            title: "Full Flow Test Meeting",
            allowAI: true
        });
        const meeting = createRes.data;
        if (!meeting._id) throw new Error("No ID returned");
        console.log(`Created Meeting ID: ${meeting._id}`);
        console.log(`Initial Summary: '${meeting.summary}'`);

        console.log('\n--- Step 2: Verify Summary Empty ---');
        if (meeting.summary !== '') throw new Error("Summary should be empty initially");
        console.log("Confirmed: Summary is empty.");

        console.log('\n--- Step 3: Generate Summary (Gemini) ---');
        const summaryRes = await axios.post(`${baseUrl}/${meeting.meetingId}/summary`);
        console.log("Generate Response:", summaryRes.data);

        console.log('\n--- Step 4: Fetch Meeting Again ---');
        const getRes = await axios.get(`${baseUrl}/${meeting.meetingId}`);
        const updatedMeeting = getRes.data;
        console.log(`Updated Summary Length: ${updatedMeeting.summary.length}`);

        if (!updatedMeeting.summary || updatedMeeting.summary.length < 10) {
            throw new Error("Summary was not updated in DB");
        }
        console.log("Confirmed: Summary saved to DB.");
        console.log("Sample:", updatedMeeting.summary.substring(0, 50) + "...");

        console.log('\n✅ VERIFICATION SUCCESSFUL: Backend flow supports proper frontend integration.');

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

verifyFlow();
