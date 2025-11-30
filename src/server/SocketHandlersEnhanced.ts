/**
 * 增强的Socket事件处理程序
 * 集成AI Agent系统，实现AI自动行动和发言
 */

import type { Server, Socket } from 'socket.io';
import type { RoomManager } from './RoomManager.js';
// import { AIAgentEnhanced } from './AIAgentEnhanced.js';
import { generatePersona } from './AIPersonaSystem.js';
import type {
    CreateRoomPayload,
    JoinRoomPayload,
    NightActionPayload,
    VotePayload,
    ChatMessagePayload,
    RoomPlayer,
    PlayerSpeech,
} from './types.js';

// AI Agent池 - Moved to GameStateMachine
// const aiAgents = new Map<string, AIAgentEnhanced>();

// 辅助函数：根据 socket 查找玩家 (防止伪造)
const getPlayerBySocket = (roomManager: RoomManager, socketId: string) => {
    const rooms = roomManager.getAllRooms();
    for (const room of rooms) {
        const player = room.players.find((p) => p.socketId === socketId);
        if (player) return { room, player };
    }
    return null;
};

/**
 * 注册Socket事件处理器
 */
export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] 客户端连接: ${socket.id}`);

        // Create room
        socket.on('create_room', (payload: CreateRoomPayload, callback) => {
            try {
                const room = roomManager.createRoom(payload, socket.id);
                socket.join(room.id);

                callback({ success: true, roomId: room.id, playerId: room.players[0].id });

                console.log(`[Socket] 房间创建: ${room.id}`);
            } catch (error: any) {
                console.error('[Socket] 创建房间失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Join room (增强版：支持重连)
        socket.on('join_room', (payload: JoinRoomPayload, callback) => {
            try {
                const { roomId, playerName, isAI = false } = payload;
                const playerId = (payload as any).playerId; // 支持重连传参

                // 1. 尝试重连逻辑
                if (playerId && !isAI) {
                    const room = roomManager.getRoom(roomId);
                    const existingPlayer = room?.players.find(p => p.id === playerId);
                    if (existingPlayer) {
                        // 执行重连
                        roomManager.reconnectPlayer(roomId, playerId, socket.id);
                        socket.join(roomId);

                        // 重新初始化AI Agent（如果需要）
                        // 通常AI不需要重连，但如果是混合房间可能需要检查

                        callback({ success: true, roomId, playerId });
                        console.log(`[Socket] 玩家重连: ${playerName} -> ${roomId}`);
                        return;
                    }
                }

                // 2. 新加入逻辑
                const room = roomManager.joinRoom(
                    roomId,
                    playerName,
                    isAI ? null : socket.id,
                    isAI,
                );

                // 只有真人玩家加入socket.io房间
                if (!isAI) {
                    socket.join(room.id);
                }

                const player = room.players.find((p) =>
                    isAI ? p.name === playerName : p.socketId === socket.id,
                );

                // 如果是AI玩家，创建AI Agent - Handled in GameStateMachine
                // if (isAI && player) {
                //     initializeAIAgent(player, room);
                // }

                callback({ success: true, roomId: room.id, playerId: player?.id });

                console.log(`[Socket] ${isAI ? 'AI' : '玩家'}加入房间: ${room.id}`);
            } catch (error: any) {
                console.error('[Socket] 加入房间失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Leave room
        socket.on('leave_room', ({ roomId, playerId }) => {
            try {
                // 安全检查：验证操作者身份
                const data = getPlayerBySocket(roomManager, socket.id);
                if (!data || data.player.id !== playerId) {
                    // 允许房主踢人等特殊逻辑可以在这里扩展，目前仅允许自己离开
                    // 但考虑到 leave_room 可能是清理操作，暂时保留原逻辑，但建议后续加强
                }

                // 移除AI Agent - Handled in GameStateMachine
                // if (aiAgents.has(playerId)) {
                //     aiAgents.delete(playerId);
                //     console.log(`[AI Agent] 移除 ${playerId}`);
                // }

                roomManager.leaveRoom(roomId, playerId);
                socket.leave(roomId);

                console.log(`[Socket] 玩家离开房间: ${playerId}`);
            } catch (error) {
                console.error('[Socket] 离开房间失败:', error);
            }
        });

        // Start game
        socket.on('start_game', ({ roomId, playerId }, callback) => {
            try {
                // 安全检查
                const data = getPlayerBySocket(roomManager, socket.id);
                if (!data || data.room.id !== roomId || data.player.id !== playerId) {
                    return callback({ success: false, error: 'Identity verification failed' });
                }

                roomManager.startGame(roomId, playerId);

                // 初始化所有AI Agent - Handled in GameStateMachine
                // const room = roomManager.getRoom(roomId);
                // if (room) {
                //     initializeAllAIAgents(room);
                // }

                callback({ success: true });

                console.log(`[Socket] 游戏开始: ${roomId}`);

                // 游戏开始后，触发夜间阶段AI行动 - Handled in GameStateMachine
                // setTimeout(() => {
                //     performNightPhaseAI(io, roomId, roomManager);
                // }, 2000); // 2秒后AI开始行动
            } catch (error: any) {
                console.error('[Socket] 开始游戏失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Night action (安全增强版)
        socket.on('night_action', ({ roomId, action }: { roomId: string, action: NightActionPayload }, callback) => {
            // 安全检查：忽略前端传的 playerId，使用 socket.id 反查
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) {
                return callback({ success: false, error: 'Identity verification failed' });
            }
            const { player } = data;

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.submitNightAction({
                    playerId: player.id, // ✅ 使用受信任的 ID
                    role: player.role || '',
                    actionType: action.actionType,
                    targetId: action.targetId,
                });
                callback({ success: true });
                console.log(`[Socket] 夜间行动提交: ${player.id} (${player.role})`);
            } catch (error: any) {
                console.error('[Socket] 提交夜间行动失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Vote (安全增强版)
        socket.on('vote', ({ roomId, targetId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (fsm) {
                    fsm.submitVote(data.player.id, targetId); // ✅ 安全
                    callback({ success: true });
                    console.log(`[Socket] 投票提交: ${data.player.id} -> ${targetId}`);
                }
            } catch (error: any) {
                console.error('[Socket] 提交投票失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Chat message (逻辑增强版)
        socket.on('chat_message', ({ roomId, content }: { roomId: string; content: string }) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return;
            const { room, player } = data;

            try {
                // 1. 死人禁言检查 (根据规则，或者发到死人频道)
                if (!player.is_alive && room.phase !== 'GAME_OVER' && room.phase !== 'DAY_MORNING_RESULT') {
                    // 可以在这里实现遗言逻辑，或者直接忽略
                    return socket.emit('error_message', '死人无法发言');
                }

                // 2. 夜晚聊天路由
                if (room.phase === 'NIGHT') {
                    if (player.role === 'werewolf') {
                        // 狼人夜聊：只发给狼人 socket
                        // 构造消息
                        const msgPayload = {
                            id: `msg_${Date.now()}`,
                            senderId: player.id,
                            senderName: player.name,
                            content,
                            timestamp: new Date().toISOString(),
                            phase: room.phase,
                            isWolfChat: true
                        };

                        const wolfSockets = room.players
                            .filter(p => p.role === 'werewolf' && p.socketId)
                            .map(p => p.socketId!);

                        // 发给自己和队友
                        io.to(wolfSockets).emit('chat_message', msgPayload);
                        console.log(`[Chat] 狼人夜聊: ${player.name}: ${content}`);

                        // 写入房间私有狼人夜聊历史（仅狼人可见）
                        try {
                            if (!room.wolfChats) room.wolfChats = [];
                            room.wolfChats.push({ senderId: player.id, content, timestamp: msgPayload.timestamp, round: room.currentRound });
                        } catch {}

                        // 写入狼人队内私有知识库
                        try {
                            const { pushKnowledge } = require('./AgentKnowledge.js');
                            const wolves = room.players.filter(p => p.role === 'werewolf');
                            for (const w of wolves) {
                                pushKnowledge(room, w.id, { round: room.currentRound, phase: 'NIGHT', type: 'wolf_chat', text: content });
                            }
                        } catch (e) {
                            console.warn('[Wolf Chat] pushKnowledge failed', e);
                        }
                    } else {
                        // 好人夜间禁言
                        socket.emit('error_message', '天黑请闭眼，无法发言');
                    }
                } else {
                    // 3. 白天公聊 - 复用原有的 handlePlayerSpeech 逻辑，但需要调整入参
                    // handlePlayerSpeech 会广播给所有人并触发 AI 理解
                    handlePlayerSpeech(io, roomManager, roomId, player.id, content);
                }
            } catch (error) {
                console.error('[Socket] 发言失败:', error);
            }
        });

        // End speech (玩家主动结束本轮发言，AI发言允许前端协助结束)
        socket.on('speech_end', ({ roomId, playerId }: { roomId: string; playerId?: string }) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return;

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) return;
                const currentId = data.room.currentSpeakerId;
                if (!currentId) return;

                const curPlayer = data.room.players.find(p => p.id === currentId);
                const isCurrentAI = curPlayer?.type === 'ai';

                // 规则：
                // 1) 若当前为真人发言，仅允许本人结束
                // 2) 若当前为AI发言，允许任意在线玩家协助结束（以便与前端TTS完成同步）
                if (data.room.currentSpeakerId === data.player.id) {
                    fsm.handleSpeechEnd(data.player.id);
                } else if (isCurrentAI) {
                    fsm.handleSpeechEnd(currentId);
                }
            } catch (error) {
                console.error('[Socket] speech_end failed:', error);
            }
        });

        // Hunter shoot (安全增强版)
        socket.on('hunter_shoot', ({ roomId, targetId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.submitHunterShoot(data.player.id, targetId);
                callback({ success: true });
                console.log(`[Socket] 猎人开枪: ${data.player.id} -> ${targetId}`);
            } catch (error: any) {
                console.error('[Socket] 猎人开枪失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Badge transfer (安全增强版)
        socket.on('badge_transfer', ({ roomId, targetId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.submitBadgeTransfer(data.player.id, targetId);
                callback({ success: true });
                console.log(`[Socket] 移交警徽: ${data.player.id} -> ${targetId}`);
            } catch (error: any) {
                console.error('[Socket] 移交警徽失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // ========== Sheriff Election Events ==========

        // Apply for sheriff
        socket.on('apply_sheriff', ({ roomId, playerId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.registerSheriffCandidate(data.player.id);
                callback({ success: true });
                console.log(`[Socket] 申请竞选警长: ${data.player.name}`);
            } catch (error: any) {
                console.error('[Socket] 申请竞选警长失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Vote for sheriff
        socket.on('vote_sheriff', ({ roomId, playerId, targetId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.submitSheriffVote(data.player.id, targetId);
                callback({ success: true });
                console.log(`[Socket] 投票警长: ${data.player.id} -> ${targetId}`);
            } catch (error: any) {
                console.error('[Socket] 投票警长失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // ========== Host Control Events ==========

        // Pause game (host only)
        socket.on('host_pause', ({ roomId, playerId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.hostPauseGame(data.player.id);
                callback({ success: true });
                console.log(`[Socket] 暂停游戏: ${data.player.name}`);
            } catch (error: any) {
                console.error('[Socket] 暂停失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Resume game (host only)
        socket.on('host_resume', ({ roomId, playerId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.hostResumeGame(data.player.id);
                callback({ success: true });
                console.log(`[Socket] 恢复游戏: ${data.player.name}`);
            } catch (error: any) {
                console.error('[Socket] 恢复失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Force skip speaker (host only)
        socket.on('host_force_skip', ({ roomId, playerId }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });

            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');

                fsm.hostForceSkip(data.player.id);
                callback({ success: true });
                console.log(`[Socket] 强制跳过: ${data.player.name}`);
            } catch (error: any) {
                console.error('[Socket] 强制跳过失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        socket.on('debug_restore', ({ roomId, speakerPosition }: { roomId: string; speakerPosition?: number }, callback) => {
            const data = getPlayerBySocket(roomManager, socket.id);
            if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });
            try {
                const fsm = roomManager.getStateMachine(roomId);
                if (!fsm) throw new Error('Room not found');
                let targetId: string | undefined = undefined;
                if (typeof speakerPosition === 'number') {
                    const p = data.room.players.find(px => px.position === speakerPosition && px.is_alive);
                    targetId = p?.id;
                }
                fsm.debugRestoreToDayDiscuss(targetId);
                callback({ success: true });
            } catch (error: any) {
                console.error('[Socket] debug_restore failed:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Get replay data for a room
        socket.on('get_replay_data', ({ roomId }, callback) => {
            try {
                const replayData = roomManager.getReplayData(roomId);
                callback({ success: true, data: replayData });
            } catch (error: any) {
                console.error('[Socket] 获取回放数据失败:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Get room list
        socket.on('get_rooms', (callback) => {
            const rooms = roomManager.getAllRooms();
            callback({
                rooms: rooms
                    .filter((r) => r.phase === 'WAITING')
                    .map((r) => ({
                        id: r.id,
                        name: r.name,
                        currentPlayers: r.players.length,
                        maxPlayers: 12,
                        phase: r.phase,
                    })),
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`[Socket] 客户端断开: ${socket.id}`);

            // 优化：直接使用 getPlayerBySocket 查找
            const data = getPlayerBySocket(roomManager, socket.id);
            if (data) {
                data.player.isOnline = false;
                // 通知房间其他人
                io.to(data.room.id).emit('player_offline', { playerId: data.player.id });
                console.log(`[Socket] 玩家离线: ${data.player.name}`);
            }
        });
    });

    // 注册阶段变化监听 - Removed, handled internally by GameStateMachine
    // setupPhaseChangeListeners(io, roomManager);
}

/**
 * 初始化单个AI Agent
 */
// Removed initializeAIAgent - Handled in GameStateMachine

/**
 * 初始化所有AI Agent
 */
// Removed initializeAllAIAgents - Handled in GameStateMachine

/**
 * 处理玩家发言
 */
function handlePlayerSpeech(
    io: Server,
    roomManager: RoomManager,
    roomId: string,
    playerId: string,
    content: string
) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    if (room.phase === 'DAY_DISCUSS' || room.phase === 'DAY_DEATH_LAST_WORDS') {
        if (room.currentSpeakerId !== playerId) {
            io.to(player.socketId || '').emit('error_message', '当前不在你的发言时间');
            return;
        }
    }

    // 广播发言（带序号）
    const speech: PlayerSpeech = {
        position: player.position,
        round: room.currentRound,
        phase: room.phase,
        content,
        timestamp: new Date().toISOString(),
        isAI: player.isAI || false,
    };

    // 添加到玩家发言历史
    if (!player.speechHistory) {
        player.speechHistory = [];
    }
    player.speechHistory.push(speech);

    // 广播发言事件
    io.to(roomId).emit('player_speech', {
        position: player.position,
        playerName: player.name,
        content,
        phase: room.phase,
        isAI: player.isAI || false,
        timestamp: speech.timestamp,
    });

    console.log(`[发言] ${player.position}号(${player.name}): ${content.substring(0, 30)}...`);

    // 让所有AI理解这段发言
    const fsm = roomManager.getStateMachine(roomId);
    if (fsm) {
        fsm.handleUserSpeech(playerId, content);
    }
}

/**
 * AI发言
 */
// Removed AI helper functions

