require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const meetingRoutes = require('./routes/meetings');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');


const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
  });


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);


// Base route
app.get('/', (req, res) => {
  res.send('Agentic AI Backend Running 🚀');
});

// Ensure recordings directory exists
const RECORDINGS_DIR = path.join(__dirname, 'temp', 'recordings');
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'meetings');

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Socket.IO Signaling
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} (Socket: ${socket.id}) joined room ${roomId}`);

    // Get all other users in the room
    const clients = io.sockets.adapter.rooms.get(roomId);
    const otherUsers = Array.from(clients || []).filter(id => id !== socket.id);

    // Notify others that a new user joined, providing the newcomer's socket ID
    socket.to(roomId).emit('user-connected', { userId, socketId: socket.id });

    // Send the list of existing users to the newcomer
    socket.emit('all-users', otherUsers);

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  // Audio Streaming Handlers
  socket.on('audio-chunk', (payload) => {
    // payload: { roomId, chunk (binary) }
    const { roomId, chunk } = payload;
    if (!roomId || !chunk) return;

    const filePath = path.join(RECORDINGS_DIR, `${roomId}.webm`);

    // Append chunk to file
    fs.appendFile(filePath, chunk, (err) => {
      if (err) console.error(`Error writing audio for room ${roomId}:`, err);
    });
  });

  // Signaling events
  socket.on('offer', (payload) => {
    // payload: { target (socketId), offer, caller (socketId) }
    io.to(payload.target).emit('offer', {
      offer: payload.offer,
      caller: socket.id
    });
  });

  socket.on('answer', (payload) => {
    // payload: { target (socketId), answer }
    io.to(payload.target).emit('answer', {
      answer: payload.answer,
      caller: socket.id
    });
  });

  socket.on('ice-candidate', (payload) => {
    // payload: { target (socketId), candidate }
    io.to(payload.target).emit('ice-candidate', {
      candidate: payload.candidate,
      caller: socket.id
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
