const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    console.log('Testing connection to:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5 seconds
        });
        console.log('Successfully connected to MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        process.exit(1);
    }
}

test();
