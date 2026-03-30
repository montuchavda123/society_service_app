require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Global Mongoose Configuration - must be at the very top
mongoose.set('bufferCommands', false); // Disable buffering entirely to prevent timeouts if DB is disconnected

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io accessible globally across all controllers via req.app.get('io')
app.set('io', io);

// Socket.IO Room Management Logic
io.on('connection', (socket) => {
  console.log('🟢 New Client Connected:', socket.id);
  
  // Admins/Secretaries join society-wide alert rooms
  socket.on('join_society', (societyId) => {
    socket.join(`society_${societyId}`);
    console.log(`🏢 Socket ${socket.id} joined society_${societyId}`);
  });

  // Individual users (Members/Mechanics) join private direct-notification rooms
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Socket ${socket.id} joined user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client Disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to check Database connection before any API calls
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) { // 1 = connected
    return res.status(503).json({ 
      success: false, 
      message: 'Database connection is not established. Please ensure MongoDB is running or check your MONGO_URI.' 
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/society', require('./routes/society'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/ai', require('./routes/ai'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('Society Service API is running...');
});

// Database Connection
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // Reduced timeout for faster failure
    });
    console.log('MongoDB Connected Successfully to', process.env.MONGO_URI);
  } catch (err) {
    if (
      err.name === 'MongooseServerSelectionError' || 
      err.message.includes('ECONNREFUSED') ||
      err.message.toLowerCase().includes('bad auth') ||
      err.message.toLowerCase().includes('authentication')
    ) {
      console.log(`⚠️ MongoDB Connection Failed: ${err.message}`);
      console.log('🔄 Starting In-Memory MongoDB automatically for development...');
      try {
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log(`✅ In-Memory MongoDB Connected Successfully at ${uri}`);
      } catch (memErr) {
        console.error('CRITICAL: Failed to start In-Memory MongoDB:', memErr.message);
      }
    } else {
      console.error('CRITICAL: MongoDB Connection Error:', err.message);
    }
  }
}

connectDB();

/**
 * 🛠️ RESILIENT SERVER STARTUP
 * Automated Port-Switching & Error Handling
 */
const startServer = (port) => {
  server.listen(port, () => {
    console.log(`\n🚀 [BACKEND] Society Service Server is LIVE`);
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`------------------------------------\n`);
  });

  // 🛡️ Error Handling (EADDRINUSE Prevention)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`\n⚠️  [CONFLICT] Port ${port} is currently busy.`);
      console.log(`🔄 [RETRYING] Searching for next available port: ${port + 1}...\n`);
      
      // Stop listening to avoid multiple error triggers on one instance
      server.close();
      
      // Recursive retry with the next port
      setTimeout(() => {
        startServer(Number(port) + 1);
      }, 500);
    } else {
      console.error(`❌ [SERVER ERROR] ${err.message}`);
    }
  });
};

const INITIAL_PORT = process.env.PORT || 5000;
startServer(INITIAL_PORT);
