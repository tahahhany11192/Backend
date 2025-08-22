require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const http = require('http');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const ChatRoom = require('./models/ChatRoom');
const searchRoutes = require("./routes/searchRoutes");

// Configuration
const PORT = process.env.PORT || 8080;
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'https://www.orycom.com';
const MONGO_URI = process.env.MONGO_URI || '*';

// Initialize Server
const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_ORIGIN, 'https://www.orycom.com'],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 120000
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: [FRONTEND_ORIGIN, 'https://www.orycom.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => req.url.startsWith('/uploads')
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads", express.static(path.join(__dirname, "uploads", "admins")));

// Database Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Enhanced Socket.IO Middleware
io.use((socket, next) => {
  try {
    // Development bypass
    if (process.env.NODE_ENV !== 'production') {
      if (socket.handshake.query.teacherId) {
        socket.user = { id: socket.handshake.query.teacherId, role: 'teacher' };
        return next();
      }
      if (socket.handshake.query.studentId) {
        socket.user = { id: socket.handshake.query.studentId, role: 'student' };
        return next();
      }
    }

    // Production authentication
    const token = socket.handshake.auth?.token ||
                  socket.handshake.query?.token ||
                  (socket.handshake.headers.authorization || '').replace('Bearer ','');
    if (!token) return next(new Error('Authentication required'));
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      
      socket.user = {
        id: decoded.userId || decoded.adminId || decoded.instructorId || decoded._id || decoded.id,
        role: decoded.role || decoded.userRole || decoded.type || 'user',
        ...decoded
      };
      
      next();
    });
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Room Management
const activeRooms = {};
app.set('activeRooms', activeRooms);
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`⚡ ${socket.user?.role} connected [${socket.id}] via ${socket.conn.transport.name}`);

  // ========== Live Classroom Functionality ==========
  // Teacher creates room
  socket.on('create-room', (data, callback) => {
    try {
      const { roomId, courseId } = data;
      const teacherId = socket.user?.id;

      if (!roomId || !courseId || !teacherId) {
        throw new Error('Missing required fields');
      }

      if (activeRooms[roomId]) {
        throw new Error('Room already exists');
      }

      activeRooms[roomId] = {
        courseId,
        teacherId,
        teacherSocket: socket.id,
        students: {},
        createdAt: new Date(),
        status: 'active'
      };

      socket.join(roomId);
      console.log(`🏫 Room created: ${roomId} by teacher ${teacherId}`);

      callback?.({ status: 'success', roomId });
      socket.emit('room-created', { roomId, courseId, teacherId });

    } catch (err) {
      console.error('Room creation error:', err);
      callback?.({ error: err.message });
    }
  });

  // Student joins room
  socket.on('join-room', (data, callback) => {
    try {
      const { roomId } = data;
      const studentId = socket.user?.id || data.studentId;

      if (!activeRooms[roomId]) {
        return callback?.({ error: 'Room does not exist or has ended' });
      }

      if (activeRooms[roomId].students[studentId]) {
        return callback?.({ error: 'You are already in this room' });
      }

      socket.join(roomId);
      
      // Add student to room
      activeRooms[roomId].students[studentId] = socket.id;
      
      // Notify teacher and other students
      io.to(roomId).emit('user-joined', studentId);
      console.log(`🎓 Student ${studentId} joined room ${roomId}`);

      callback?.({ status: 'success', roomId });

    } catch (err) {
      console.error('Join room error:', err);
      callback?.({ error: err.message });
    }
  });

  // WebRTC Signaling
  // Teacher sends offer to specific student
  socket.on('webrtc-offer', (data) => {
    try {
      const { roomId, studentId, sdp } = data;
      const room = activeRooms[roomId];
      
      if (!room || !room.students[studentId]) {
        throw new Error('Invalid room or student');
      }

      io.to(room.students[studentId]).emit('webrtc-offer', {
        from: socket.id,   // teacher's socket ID
        sdp,
        roomId
      });

    } catch (e) {
      console.error('webrtc-offer error', e);
    }
  });

  // Student sends answer to teacher
  socket.on('webrtc-answer', (data) => {
    try {
      const { roomId, sdp } = data;
      const room = activeRooms[roomId];
      
      if (!room) {
        throw new Error('Room not found');
      }

      io.to(room.teacherSocket).emit('webrtc-answer', {
        from: socket.id,   // student's socket ID
        sdp,
        roomId,
        studentId: socket.user?.id
      });

    } catch (e) {
      console.error('webrtc-answer error', e);
    }
  });

  // ICE candidates
  socket.on('ice-candidate', (data) => {
    try {
      const { roomId, candidate, studentId } = data;
      const room = activeRooms[roomId];
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Determine target (teacher or student)
      let targetSocket;
      if (studentId) {
        // Teacher sending to student
        targetSocket = room.students[studentId];
      } else {
        // Student sending to teacher
        targetSocket = room.teacherSocket;
      }

      if (targetSocket) {
        io.to(targetSocket).emit('ice-candidate', {
          from: socket.id,
          candidate,
          roomId,
          studentId: studentId || socket.user?.id
        });
      }

    } catch (e) {
      console.error('ice-candidate error', e);
    }
  });

  // Chat messages
  socket.on('send-message', (roomId, userId, message) => {
    if (activeRooms[roomId]) {
      io.to(roomId).emit('new-message', userId, message);
    }
  });

  // Teacher controls
  socket.on('teacher-mute-student', ({ roomId, targetId, mute }) => {
    const room = activeRooms[roomId];
    if (!room || room.teacherSocket !== socket.id) return;
    
    const studentSocket = room.students[targetId];
    if (!studentSocket) return;
    
    io.to(studentSocket).emit(mute ? 'force-mute' : 'force-unmute');
    console.log(`Teacher ${socket.user?.id} ${mute ? 'muted' : 'unmuted'} student ${targetId}`);
  });

  socket.on('teacher-kick-student', ({ roomId, targetId }) => {
    const room = activeRooms[roomId];
    if (!room || room.teacherSocket !== socket.id) return;
    
    const studentSocket = room.students[targetId];
    if (!studentSocket) return;
    
    // Notify student
    io.to(studentSocket).emit('force-kick');
    
    // Remove from room
    delete room.students[targetId];
    
    // Notify others
    io.to(roomId).emit('user-left', targetId);
    console.log(`Teacher ${socket.user?.id} kicked student ${targetId}`);
  });

  // Leave room
  socket.on('leave-room', (roomId) => {
    if (!activeRooms[roomId]) return;
    
    if (socket.user?.role === 'teacher' && 
        activeRooms[roomId]?.teacherSocket === socket.id) {
      // Teacher leaving - end room
      io.to(roomId).emit('room-ended');
      delete activeRooms[roomId];
      console.log(`🚪 Room ${roomId} ended by teacher`);
    } else {
      // Student leaving
      const studentId = socket.user?.id;
      if (studentId && activeRooms[roomId]?.students[studentId]) {
        delete activeRooms[roomId].students[studentId];
        io.to(roomId).emit('user-left', studentId);
        console.log(`🎓 Student ${studentId} left room ${roomId}`);
      }
    }
  });

  // Emoji reactions
  socket.on('send-emoji', (roomId, emoji) => {
    if (activeRooms[roomId]) {
      const sender = socket.user?.id || 'anonymous';
      io.to(roomId).emit('receive-emoji', sender, emoji);
    }
  });

  // Hand raising
  socket.on('raise-hand', (roomId) => {
    if (activeRooms[roomId]) {
      const studentId = socket.user?.id;
      if (studentId) {
        io.to(activeRooms[roomId].teacherSocket).emit('student-raised-hand', studentId);
      }
    }
  });

  // Lower hand
  socket.on('lower-hand', (roomId) => {
    if (activeRooms[roomId]) {
      const studentId = socket.user?.id;
      if (studentId) {
        io.to(activeRooms[roomId].teacherSocket).emit('student-lowered-hand', studentId);
      }
    }
  });

  // Task distribution
  socket.on('send-task', (roomId, taskData) => {
    if (activeRooms[roomId] && socket.id === activeRooms[roomId].teacherSocket) {
      io.to(roomId).emit('receive-task', taskData);
    }
  });

  // Task submission
  socket.on('submit-task', (roomId, submissionData) => {
    if (activeRooms[roomId]) {
      const studentId = socket.user?.id;
      if (studentId) {
        io.to(activeRooms[roomId].teacherSocket).emit('task-submitted', {
          studentId,
          submission: submissionData
        });
      }
    }
  });

  // ========== Chat Functionality ==========
  socket.on('chat:join', async (roomId) => {
    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) return;
      socket.join(roomId);
      socket.emit('chat:joined', roomId);
      console.log(`💬 User ${socket.user?.id} joined chat room ${roomId}`);
    } catch (err) {
      console.error('Chat join error:', err);
    }
  });

  socket.on('chat:leave', (roomId) => {
    socket.leave(roomId);
    console.log(`💬 User ${socket.user?.id} left chat room ${roomId}`);
  });

  socket.on('chat:message', async ({ roomId, message }) => {
    try {
      if (!socket.rooms.has(roomId)) {
        return socket.emit('chat:error', 'Not in this room');
      }

      // Save message to database (implement in your ChatRoom model)
      const chatRoom = await ChatRoom.findByIdAndUpdate(
        roomId,
        { $push: { messages: { sender: socket.user.id, content: message } } },
        { new: true }
      );

      if (!chatRoom) {
        return socket.emit('chat:error', 'Room not found');
      }

      // Broadcast to all in room except sender
      socket.to(roomId).emit('chat:message', {
        sender: socket.user,
        message,
        timestamp: new Date()
      });

      // Send back to sender with success
      socket.emit('chat:message:sent', {
        sender: socket.user,
        message,
        timestamp: new Date()
      });

    } catch (err) {
      console.error('Chat message error:', err);
      socket.emit('chat:error', 'Failed to send message');
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`⚠️ ${socket.user?.role} disconnected [${socket.id}]`);
    
    // Clean up rooms
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      
      // Teacher disconnected - end room
      if (room.teacherSocket === socket.id) {
        io.to(roomId).emit('room-ended');
        delete activeRooms[roomId];
        console.log(`🚪 Room ${roomId} ended (teacher disconnected)`);
        continue;
      }
      
      // Student disconnected
      for (const studentId in room.students) {
        if (room.students[studentId] === socket.id) {
          delete room.students[studentId];
          io.to(roomId).emit('user-left', studentId);
          console.log(`🎓 Student ${studentId} disconnected from ${roomId}`);
          break;
        }
      }
      
      // Clean up empty rooms
      if (Object.keys(room.students).length === 0 && 
          room.teacherSocket !== socket.id) {
        delete activeRooms[roomId];
        console.log(`🧹 Cleaned up empty room ${roomId}`);
      }
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/user', require('./routes/user'));
app.use('/api/instructors', require('./routes/instructorRoutes'));
app.use('/api/instructor-auth', require('./routes/instructorAuthRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/course-content', require('./routes/courseContentRoutes'));
app.use('/api/content', require('./routes/contentRoutes')); 
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/live', require('./routes/liveRoutes'));
app.use('/api/live-sessions', require('./routes/liveSessionRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/payment-requests', require('./routes/paymentRequestRoutes'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stream', require('./routes/streamingRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); // Chat routes
app.use("/api/help", require("./routes/helpRoutes"));


// Additional routes
app.use("/api", searchRoutes);
app.use('/api', require('./routes/courseContentRoutes'));
app.use('/api', require('./routes/stats'));
app.use('/api', require('./routes/lessonRoutes'));


// Active rooms endpoint
app.get('/api/active-rooms', (req, res) => {
  res.json({
    status: 'success',
    data: Object.keys(activeRooms).map(roomId => ({
      roomId,
      courseId: activeRooms[roomId].courseId,
      teacherId: activeRooms[roomId].teacherId,
      studentCount: Object.keys(activeRooms[roomId].students).length,
      createdAt: activeRooms[roomId].createdAt
    }))
  });
});

// Chat rooms endpoint
app.get('/api/chat-rooms', async (req, res) => {
  try {
    const rooms = await ChatRoom.find().populate('participants');
    res.json({ status: 'success', data: rooms });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend is working 🎉');
});

// PeerJS Server with enhanced configuration
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs',
  proxied: true,
  alive_timeout: 60000,
  concurrent_limit: 5000,
  allow_discovery: true
});

app.use('/peerjs', peerServer);

// WebRTC status endpoint
app.get('/api/webrtc-status', (req, res) => {
  res.json({
    status: 'active',
    activeRooms: Object.keys(activeRooms).length,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 100MB' 
      });
    }
  }
  
  res.status(500).json({ 
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
server.listen(PORT,'0.0.0.0',() => {
  console.log(`
    🚀 Server running on http://0.0.0.0:${PORT}
    📡 Socket.IO: ws://0.0.0.0:${PORT}/socket.io/
    🎮 PeerJS: http://0.0.0.0:${PORT}/peerjs
    💬 Chat: ws://0.0.0.0:${PORT}
    🌐 CORS Origin: ${FRONTEND_ORIGIN}
    🏫 Active rooms: ${Object.keys(activeRooms).length}
  `);
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔴 MongoDB connection closed');
      process.exit(0);
    });
  });
});




