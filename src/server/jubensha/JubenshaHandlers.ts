// 剧本杀后端集成
// Jubensha Backend Integration for Node.js Server

import express, { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import { WebSocketServer, WebSocket } from 'ws';
import { agentLoader } from '../services/AgentLoader';
import fs from 'fs';
import path from 'path';
import { CharacterAgent } from './agents/CharacterAgent';
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
        const scripts = await scriptRepository.getAllScripts();
        if (scripts && scripts.length > 0) {
            return res.json({ success: true, rooms: scripts.map(s => ({ id: s.id, title: s.title, description: s.description, playerCount: s.playerCount })) });
        }
        const sourceDir = path.join(process.cwd(), 'source');
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true }).filter(d => d.isDirectory());
        const rooms = entries.slice(0, 5).map(d => {
            const id = `local_${Buffer.from(d.name).toString('hex').slice(0, 12)}`;
            const title = d.name.replace(/^[0-9\-\s]+/, '').replace(/[（）].*$/, '').trim() || d.name;
            const coverMap: Record<string, string> = {
                '第二十二条校规': '/source/63bc45524c4584a23494c66308f4af41.jpg',
                '病娇男孩的精分日记': '/source/2fadb9e28aab32ac3f245e3d8e9733a7.jpg'
            };
            return { id, title, description: '', playerCount: 7, cover_url: coverMap[title] };
        });
        res.json({ success: true, rooms });
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
            const sourceDir = path.join(process.cwd(), 'source');
            try {
                const entries = fs.readdirSync(sourceDir, { withFileTypes: true }).filter(d => d.isDirectory());
                const match = entries.find(d => roomId.startsWith('local_') ? roomId.includes(Buffer.from(d.name).toString('hex').slice(0, 12)) : d.name.includes(roomId));
                if (match) {
                    const title = match.name.replace(/^[0-9\-\s]+/, '').replace(/[（）].*$/, '').trim() || match.name;
                    const names = ['李萱萱', '皇甫青', '姚青峰', '吕思琦', '叶冷星', '谢雨晴', '白穆'];
                    const characters = names.map((n, i) => ({ id: `local_${i}_${n}`, name: n, role: '', avatar: '' }));
                    const bgMap: Record<string, string> = {
                        '病娇男孩的精分日记': '/source/2fadb9e28aab32ac3f245e3d8e9733a7.jpg',
                        '第二十二条校规': '/source/63bc45524c4584a23494c66308f4af41.jpg',
                        '午夜凶铃': '/source/63bc45524c4584a23494c66308f4af41.jpg',
                    };
                    return res.json({
                        success: true,
                        room: {
                            room_id: roomId,
                            title,
                            description: '',
                            max_players: 7,
                            characters,
                            scenes: [],
                            initial_scene: {
                                id: 'scene-1',
                                name: title,
                                description: '',
                                background: bgMap[title] || '/images/jubensha-default-bg.jpg',
                                bgm: '/audio/jubensha-default-bgm.mp3',
                            },
                        }
                    });
                }
            } catch {}
            try {
                const response = await axios.get(`${FASTAPI_BASE}/api/rooms/${roomId}`);
                return res.json(response.data);
            } catch (e) {
                return res.status(404).json({ success: false, error: '剧本不存在' });
            }
        }

        const agents = await agentLoader.loadAgentsByScript(roomId);

        const bgMap: Record<string, string> = {
            '病娇男孩的精分日记': '/source/2fadb9e28aab32ac3f245e3d8e9733a7.jpg',
            '午夜凶铃': '/source/63bc45524c4584a23494c66308f4af41.jpg',
            '第二十二条校规': '/source/0c6b8d63105a43b51646f3f7887247ca.jpg',
        };

        res.json({
            success: true,
            room: {
                room_id: script.id,
                title: script.title,
                description: script.description,
                max_players: script.playerCount,
                characters: Array.from(agents.values()).map(a => a.getCharacterInfo()),
                scenes: script.scenes || [],
                initial_scene: {
                    id: 'scene-1',
                    name: script.title,
                    description: script.description,
                    background: bgMap[script.title] || '/images/jubensha-default-bg.jpg',
                    bgm: '/audio/jubensha-default-bgm.mp3',
                },
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
                if (!agents || agents.size === 0) throw new Error('no agents');
                this.roomAgents.set(roomId, agents);
            } catch (e) {
                const agents = this.buildLocalAgents(roomId);
                this.roomAgents.set(roomId, agents);
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
    private buildLocalAgents(roomId: string): Map<string, any> {
        const gameState = { scriptId: roomId, scriptName: '第二十二条校规', phase: 'WAITING', players: [], scenes: [], discoveredClues: [], gameLog: [] };
        const p1 = `你现在扮演剧本杀《第二十二条校规》中的角色【李萱萱】。

角色设定：
1. 外表：18岁，戴眼镜，存在感低，看起来是一个性格内向、文静、有些自卑的单亲家庭高中女生。
2. 核心性格：表面温顺无害，内心却因极度的“恋父情结”而扭曲疯狂。你认为父亲是你一个人的，任何企图分享父亲爱的人都是敌人，必须被清除。
3. 秘密：你制造车祸杀死了陈阿姨；你亲手将皇甫青从天台推下致死。
4. 人际关系：李老师是你的父亲；谢雨晴是名义闺蜜；姚青峰是疏远的玩伴。

行为准则：
语气轻声细语，提到父亲时执着维护；在恐怖场景中表现柔弱以掩盖本性；绝不承认杀人，遭质疑时为父亲辩护。
当前情境：身处被诅咒的真相高中，害怕父亲秘密曝光。`;
        const p2 = `你现在扮演剧本杀《第二十二条校规》中的角色【皇甫青】。

角色设定：
1. 外表：18岁，冷酷神秘的转校生，极度俊美。
2. 秘密：双性人；双重人格，男性皇甫青与女性蒋温灵；你已死亡，现为思念体。
3. 性格：冷淡傲慢，渴望接纳又恐惧泄露。
4. 遭遇：被李老师窥探威胁。

行为准则：
语气简短冷漠；调查蒋温灵与学校怪异；禁忌涉及身体与性别话题。
当前情境：转入高二3班，人人遗忘蒋温灵，你在调查。`;
        const p3 = `你现在扮演剧本杀《第二十二条校规》中的角色【姚青峰】。

角色设定：
1. 外表：风水世家少爷，色厉内荏。
2. 背景：家传通灵宝玉。
3. 情感：暗恋李萱萱，但恐惧她的凶性。

行为准则：
语气嘲讽但遇鬼怂；遇险先跑或祈祷；对阴气与鬼魂敏感。
当前情境：学校闹鬼，你的玉变红，强装镇定。`;
        const p4 = `你现在扮演剧本杀《第二十二条校规》中的角色【吕思琦】。
角色设定：课代表，温婉恬静。
秘密：以身体换取特权，堕胎，讨好李萱萱。
性格：外柔内虚伪，惧被揭穿。
行为准则：语气温柔礼貌，涉及李老师或成绩时紧张转移话题；听到婴儿哭声会崩溃。
当前情境：诅咒爆发，极力维持人设。`;
        const p5 = `你现在扮演剧本杀《第二十二条校规》中的角色【叶冷星】。
角色设定：班长，年级第一，理智领导者。
创伤：童年恶作剧致女生死亡。
性取向秘密：暗中关注男生。
行为准则：语气沉稳逻辑强，指挥寻找线索；遇纸箱相关触发PTSD。
当前情境：发现时间循环与诅咒，组织破解。`;
        const p6 = `你现在扮演剧本杀《第二十二条校规》中的角色【谢雨晴】。
角色设定：财团千金，校花，女王蜂。
秘密：散布皇甫青双性人谣言。
行为准则：语气娇纵自信，危险时牺牲他人保全自己。
当前情境：被害者化鬼回归，你惊恐仍试图指使他人保护你。`;
        const p7 = `你现在扮演剧本杀《第二十二条校规》中的角色【白穆】。
角色设定：帅气内向男生。
秘密：被李老师性骚扰与威胁，情书被扣押。
行为准则：语气吞吐，降低存在感；涉及李老师会异常反应。
当前情境：李老师化鬼，恐惧与解脱并存。`;
        const agents = new Map<string, any>();
        const add = (id: string, name: string, prompt: string) => {
            const a = new CharacterAgent({ id, name, role: '', personality: '', secrets: [], avatar: '' }, gameState as any);
            (a as any).customSystemPrompt = prompt;
            agents.set(id, a);
        };
        add('agent_lxx', '李萱萱', p1);
        add('agent_hfq', '皇甫青', p2);
        add('agent_yqf', '姚青峰', p3);
        add('agent_lsq', '吕思琦', p4);
        add('agent_ylx', '叶冷星', p5);
        add('agent_xyq', '谢雨晴', p6);
        add('agent_bm', '白穆', p7);
        return agents;
    }
}
