// 剧本杀后端集成
// Jubensha Backend Integration for Node.js Server

import express, { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import { WebSocketServer, WebSocket } from 'ws';
import { agentLoader } from '../services/AgentLoader';
import { scriptRepository } from '../repositories/ScriptRepository';

const router = Router();

// FastAPI后端地址 (保留用于某些功能)
const FASTAPI_BASE = 'http://localhost:8000';

// 配置上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/scripts/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// 获取房间列表
router.get('/rooms', async (req, res) => {
    try {
        // 🆕 Get scripts from database instead of Python backend
        const scripts = await scriptRepository.getAllScripts();
        res.json({ success: true, rooms: scripts });
    } catch (error: any) {
        console.error('获取房间列表错误:', error.message);
        res.status(500).json({ success: false, error: '获取房间列表失败' });
    }
});

// 获取房间详情
router.get('/rooms/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;

        // 🆕 Load script and agents from database
        const script = await scriptRepository.getScriptById(roomId);
        if (!script) {
            // Fallback to Python backend if not found in DB (for legacy support)
            try {
                const response = await axios.get(`${FASTAPI_BASE}/api/rooms/${roomId}`);
                return res.json(response.data);
            } catch (e) {
                return res.status(404).json({ success: false, error: '剧本不存在' });
            }
        }

        const agents = await agentLoader.loadAgentsByScript(roomId);

        res.json({
            success: true,
            room: {
                room_id: script.id,
                title: script.title,
                description: script.description,
                max_players: script.playerCount,
                characters: Array.from(agents.values()).map(a => a.getCharacterInfo())
            }
        });
    } catch (error: any) {
        console.error('获取房间详情错误:', error.message);
        res.status(500).json({ success: false, error: '获取房间详情失败' });
    }
});

export default router;

// WebSocket 管理器
export class JubenshaWebSocketManager {
    private wss: WebSocketServer;
    private rooms: Map<string, Set<WebSocket>> = new Map();
    // 🆕 Store active agents for each room
    private roomAgents: Map<string, Map<string, any>> = new Map();

    constructor(wss: WebSocketServer) {
        this.wss = wss;
    }

    async handleConnection(ws: WebSocket, roomId: string, playerId: string) {
        console.log(`玩家 ${playerId} 连接到房间 ${roomId}`);

        // 添加到房间
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
            // 🆕 Initialize agents for the room
            try {
                const agents = await agentLoader.loadAgentsByScript(roomId);
                this.roomAgents.set(roomId, agents);
                console.log(`[Room ${roomId}] Loaded ${agents.size} agents`);
            } catch (e) {
                console.error(`[Room ${roomId}] Failed to load agents:`, e);
            }
        }
        this.rooms.get(roomId)!.add(ws);

        // 处理消息
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());

                if (message.type === 'message') {
                    // 检测是否是询问AI
                    const isAIQuery = message.target !== undefined;

                    if (isAIQuery) {
                        // 🆕 Use local AgentLoader agents first
                        const agents = this.roomAgents.get(roomId);
                        const targetAgent = agents?.get(message.targetId || message.target); // Support ID or Name

                        if (targetAgent) {
                            console.log(`[AI] Calling local agent ${targetAgent.character.name}`);
                            const response = await targetAgent.respond(message.content);

                            this.broadcast(roomId, {
                                type: 'message',
                                sender: targetAgent.character.name,
                                senderType: 'ai',
                                content: response.content,
                                avatar: targetAgent.character.avatar,
                                timestamp: Date.now()
                            });
                        } else {
                            // Fallback to Python backend
                            const response = await axios.post(`${FASTAPI_BASE}/api/chat`, {
                                room_id: roomId,
                                sender: message.sender || playerId,
                                content: message.content,
                                target: message.target
                            });

                            if (response.data.success) {
                                this.broadcast(roomId, {
                                    type: 'message',
                                    sender: message.target,
                                    senderType: 'ai',
                                    content: response.data.reply,
                                    avatar: response.data.avatar,
                                    timestamp: Date.now()
                                });
                            }
                        }
                    } else {
                        // 广播玩家消息
                        this.broadcast(roomId, {
                            type: 'message',
                            sender: message.sender || playerId,
                            senderType: 'player',
                            content: message.content,
                            timestamp: Date.now()
                        });
                    }
                }
            } catch (error: any) {
                console.error('处理消息错误:', error.message);
            }
        });

        // 发送欢迎消息
        ws.send(JSON.stringify({
            type: 'connected',
            message: '已连接到游戏房间'
        }));
    }

    broadcast(roomId: string, message: any) {
        const clients = this.rooms.get(roomId);
        if (clients) {
            const data = JSON.stringify(message);
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    }

    // 场景切换
    changeScene(roomId: string, scene: any) {
        this.broadcast(roomId, {
            type: 'scene_change',
            scene
        });
    }
}
