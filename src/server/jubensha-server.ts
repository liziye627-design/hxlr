// 独立的剧本杀服务器 - 用于测试
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { JubenshaRoomManager } from './jubensha/JubenshaRoomManager.js';
import { registerJubenshaSocketHandlers } from './jubensha/JubenshaSocketHandlers.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://127.0.0.1:5200',
  'http://localhost:5200',
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jubensha', timestamp: new Date().toISOString() });
});

// 初始化剧本杀房间管理器
const jubenshaRoomManager = new JubenshaRoomManager(io);

// 注册Socket处理器
registerJubenshaSocketHandlers(io, jubenshaRoomManager);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎭 剧本杀服务器已启动`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
process.on('SIGINT', () => httpServer.close(() => process.exit(0)));
