const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure Multer for Avatar Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Get profile and settings
router.get('/:userId', async (req, res) => {
    try {
        let user = await User.findOne({ userId: req.params.userId });
        if (!user) {
            // Create default user if not exists
            user = new User({ userId: req.params.userId });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile/identity
router.patch('/:userId/profile', async (req, res) => {
    try {
        const { fullName, email, phone, rank, specialization, affiliation } = req.body;
        const user = await User.findOneAndUpdate(
            { userId: req.params.userId },
            { fullName, email, phone, rank, specialization, affiliation },
            { new: true, upsert: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update settings/protocols
router.patch('/:userId/settings', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { userId: req.params.userId },
            { settings: req.body },
            { new: true, upsert: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Password
router.put('/:userId/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({ userId: req.params.userId });

        // Simple password check (In real app, hash this!)
        if (user.password !== currentPassword && user.password !== 'password123') { // Default fallback
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Avatar
router.post('/:userId/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // In a real production app, you would upload this to S3/Cloudinary.
        // For local dev, we serve from /uploads
        const avatarUrl = `/uploads/${req.file.filename}`;

        const user = await User.findOneAndUpdate(
            { userId: req.params.userId },
            { avatar: avatarUrl },
            { new: true, upsert: true }
        );
        res.json({ avatar: avatarUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
