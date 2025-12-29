const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['neutralization', 'system', 'auth'],
        required: true
    },
    action: String,
    userId: String,
    userName: String,
    taskId: String,
    meetingId: String,
    previousState: String,
    newState: String,
    agentOutput: String,
    tokenUsage: Number,
    status: {
        type: String,
        enum: ['success', 'failure']
    },
    error: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
