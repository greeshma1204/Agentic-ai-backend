const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        default: 'default_operator'
    },
    fullName: {
        type: String,
        default: 'Alex Johnson'
    },
    password: {
        type: String,
        default: 'password123'
    },
    avatar: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: 'alex.johnson@company.com'
    },
    phone: {
        type: String,
        default: '+1 (555) 123-4567'
    },
    rank: {
        type: String,
        default: 'Lead Intelligence Architect'
    },
    specialization: {
        type: String,
        default: 'Strategic Strategy'
    },
    affiliation: {
        type: String,
        default: 'The Tech Syndicate'
    },
    settings: {
        emailNotifications: { type: Boolean, default: true },
        taskReminders: { type: Boolean, default: true },
        summaryAlerts: { type: Boolean, default: true },
        autoJoinMeetings: { type: Boolean, default: false },
        timezone: { type: String, default: 'America/New_York' }
    },
    metrics: {
        sessionCount: { type: Number, default: 47 },
        objectivesNeutralized: { type: Number, default: 28 },
        intelligenceExtractions: { type: Number, default: 42 },
        missionEfficiency: { type: Number, default: 92 }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
