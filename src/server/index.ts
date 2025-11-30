// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';
import { registerSocketHandlers } from './SocketHandlersEnhanced.js';
import { ScriptRoomManager } from './scriptmurder/ScriptRoomManager.js';
import { registerScriptSocketHandlers } from './scriptmurder/ScriptSocketHandlers.js';
import jubenshaRoutes from './jubensha/JubenshaHandlers.js';
import { WebSocketServer } from 'ws';

const app = express();
const httpServer = createServer(app);

// CORS configuration for Vite dev server
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const allowedOrigins = [
  'http://127.0.0.1:5200',
  'http://localhost:5200',
  'https://127.0.0.1:5200',
  'https://localhost:5200',
  FRONTEND_ORIGIN,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Dev fallback: allow localhost/127.0.0.1 any port
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize room managers
const roomManager = new RoomManager(io);
const scriptRoomManager = new ScriptRoomManager(io);

// Register Socket.io handlers
registerSocketHandlers(io, roomManager);
registerScriptSocketHandlers(io, scriptRoomManager);

// Register Jubensha routes
app.use('/api/jubensha', jubenshaRoutes);

// WebSocket for Jubensha
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname.startsWith('/jubensha/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      const pathParts = pathname.split('/');
      const roomId = pathParts[2];
      const playerId = pathParts[3] || 'unknown';

      // 处理Jubensha WebSocket连接（稍后实现）
      console.log(`Jubensha WS: room=${roomId}, player=${playerId}`);
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Game Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 Frontend: http://127.0.0.1:5200`);
  console.log(`🔐 CORS allowed origins: ${allowedOrigins.join(', ') || 'default localhost/127.0.0.1'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
