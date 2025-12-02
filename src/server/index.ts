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
import scriptUploadRoutes from './routes/scriptUpload.js';
import { JubenshaWebSocketManager } from './jubensha/JubenshaHandlers.js';
import { WebSocketServer } from 'ws';

const app = express();
const httpServer = createServer(app);

// CORS configuration for production and development
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const allowedOrigins = [
  'http://127.0.0.1:5200',
  'http://localhost:5200',
  'https://127.0.0.1:5200',
  'https://localhost:5200',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'https://hxlr.lzyupupup.online',
  'https://traeapp-7gn2vl8qe60xp2ip-2jligvwuq-liiziyes-projects.vercel.app',
  FRONTEND_ORIGIN,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/.*\.vercel\.app(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/.*\.lzyupupup\.online(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) return callback(null, true);
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
      if (/^https?:\/\/.*\.vercel\.app(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/.*\.lzyupupup\.online(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) return callback(null, true);
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
app.use('/api/jubensha', scriptUploadRoutes);

// WebSocket for Jubensha
const wss = new WebSocketServer({ noServer: true });
const jubenshaWSS = new JubenshaWebSocketManager(wss);

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname.startsWith('/jubensha/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      const pathParts = pathname.split('/');
      const roomId = pathParts[2];
      const playerId = pathParts[3] || 'unknown';
      jubenshaWSS.handleConnection(ws, roomId, playerId);
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
