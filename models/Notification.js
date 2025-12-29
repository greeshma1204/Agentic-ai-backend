const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['summary', 'task', 'reminder', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: ''
    },
    unread: {
        type: Boolean,
        default: true
    },
    metadata: {
        meetingId: String,
        taskId: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
