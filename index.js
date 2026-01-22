require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const meetingRoutes = require('./routes/meetings');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');



const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5175",
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
app.use(cors({
  origin: "http://localhost:5175",
  credentials: true
}));
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
app.use('/api/ai', aiRoutes);



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

// Waiting Room tracking
const waitingRooms = new Map(); // roomId -> [{ socketId, userName }]
const roomHosts = new Map();    // roomId -> hostSocketId (first user becomes host)

io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  // Waiting Room: Participant requests to join
  socket.on('join-request', ({ roomId, userName }) => {
    console.log(`[Waiting Room] Join request from ${userName} (${socket.id}) for room ${roomId}`);

    // Check if room has a host
    const hostSocketId = roomHosts.get(roomId);

    // If no host exists, this user becomes the host and is auto-approved
    if (!hostSocketId) {
      console.log(`[Waiting Room] No host yet. ${userName} becomes the host.`);
      roomHosts.set(roomId, socket.id);
      socket.emit('user-approved', { roomId, isHost: true });
      return;
    }

    // Get or create waiting list for this room
    if (!waitingRooms.has(roomId)) {
      waitingRooms.set(roomId, []);
    }

    // Add user to waiting room
    waitingRooms.get(roomId).push({ socketId: socket.id, userName });

    // Join a notification channel for this room
    socket.join(`waiting-${roomId}`);

    // Notify host about new join request
    io.to(hostSocketId).emit('new-join-request', {
      socketId: socket.id,
      userName,
      waitingUsers: waitingRooms.get(roomId)
    });

    // Acknowledge the request
    socket.emit('join-request-received', { message: 'Waiting for host approval...' });
  });

  // Host approves a user
  socket.on('approve-user', ({ roomId, targetSocketId }) => {
    console.log(`[Waiting Room] Host approved user ${targetSocketId} for room ${roomId}`);

    // Remove user from waiting room
    if (waitingRooms.has(roomId)) {
      const waiting = waitingRooms.get(roomId).filter(u => u.socketId !== targetSocketId);
      waitingRooms.set(roomId, waiting);
    }

    // Notify the approved user
    io.to(targetSocketId).emit('user-approved', { roomId });

    // Update host with new waiting list
    socket.emit('waiting-list-update', { waitingUsers: waitingRooms.get(roomId) || [] });
  });

  // Host rejects a user
  socket.on('reject-user', ({ roomId, targetSocketId }) => {
    console.log(`[Waiting Room] Host rejected user ${targetSocketId} for room ${roomId}`);

    // Remove user from waiting room
    if (waitingRooms.has(roomId)) {
      const waiting = waitingRooms.get(roomId).filter(u => u.socketId !== targetSocketId);
      waitingRooms.set(roomId, waiting);
    }

    // Notify the rejected user
    io.to(targetSocketId).emit('user-rejected', { roomId, message: 'Host denied entry' });

    // Update host with new waiting list
    socket.emit('waiting-list-update', { waitingUsers: waitingRooms.get(roomId) || [] });
  });

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} (Socket: ${socket.id}) joined room ${roomId}`);

    // First user to join becomes the host
    if (!roomHosts.has(roomId)) {
      roomHosts.set(roomId, socket.id);
      socket.emit('you-are-host', { isHost: true });
      console.log(`[Waiting Room] User ${socket.id} is now host of room ${roomId}`);

      // Send any pending waiting users to the new host
      if (waitingRooms.has(roomId) && waitingRooms.get(roomId).length > 0) {
        socket.emit('waiting-list-update', { waitingUsers: waitingRooms.get(roomId) });
      }
    } else {
      socket.emit('you-are-host', { isHost: false });
    }

    // Get all other users in the room
    const clients = io.sockets.adapter.rooms.get(roomId);
    const otherUsers = Array.from(clients || []).filter(id => id !== socket.id);

    // Notify others that a new user joined, providing the newcomer's socket ID
    socket.to(roomId).emit('user-connected', { userId, socketId: socket.id });

    // Send the list of existing users to the newcomer
    socket.emit('all-users', otherUsers);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Notify others that user left
      socket.to(roomId).emit('user-disconnected', socket.id);

      // If this user was the host, clear it so someone else (likely this user re-joining) can become host
      if (roomHosts.get(roomId) === socket.id) {
        console.log(`[Waiting Room] Host ${socket.id} disconnected from room ${roomId}`);
        roomHosts.delete(roomId);

        // Also notify the waiting room participants that the host is gone (optional but clean)
        io.to(`waiting-${roomId}`).emit('host-disconnected');
      }
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
