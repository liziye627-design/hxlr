import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WerewolfPlayer, GamePhase } from '../types';

const DEFAULT_PORT = (import.meta as any)?.env?.VITE_SOCKET_PORT || 5200;
const DEFAULT_PROTO = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const DEFAULT_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const IS_SECURE = typeof window !== 'undefined' && window.location.protocol === 'https:';
const ENV_SOCKET_URL = (import.meta as any)?.env?.VITE_SOCKET_URL || '';

// 生产环境后端地址
const PRODUCTION_BACKEND = 'https://hxlr.lzyupupup.online';

const RESOLVED_SOCKET_URL = (() => {
  // 优先使用环境变量
  if (ENV_SOCKET_URL) return ENV_SOCKET_URL;
  
  const host = DEFAULT_HOST || '127.0.0.1';
  
  // 如果是 Vercel 部署，使用生产后端
  if (IS_SECURE && /vercel\.app$/.test(host)) {
    return PRODUCTION_BACKEND;
  }
  
  // 本地开发
  return `${DEFAULT_PROTO}//${host}:${DEFAULT_PORT}`;
})();
const SOCKET_URL = RESOLVED_SOCKET_URL;

console.log('🔌 Socket URL:', SOCKET_URL);

export interface RoomState {
  roomId: string;
  roomName: string;
  phase: GamePhase;
  timer: number;
  currentRound: number;
  myRole?: string;
  myId: string;
  players: WerewolfPlayer[];
  winner: 'werewolf' | 'villager' | null;
  gameLog: any[];
  sheriffId?: string | null;
  witchPotions?: { antidote: boolean; poison: boolean };
  currentSpeakerOrder?: string[];
  currentSpeakerIndex?: number;
  currentSpeakerId?: string | null;
  wolfChats?: Array<{ senderId: string; content: string; timestamp: string; round: number }>;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  phase: GamePhase;
  type?: 'speech' | 'chat' | 'system';
}

export const useGameSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const lastMessagesRef = useRef<string[]>([]);
  const roomStateRef = useRef<RoomState | null>(null);
  const chatMessagesRef = useRef<ChatMessage[]>([]); // 🔧 用 ref 保存消息，避免闭包问题

  // Speaking State
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [speakerRemainingSeconds, setSpeakerRemainingSeconds] = useState<number | null>(null);
  const [aiThinkingIds, setAiThinkingIds] = useState<Set<string>>(new Set());
  const [speakerOrderIndex, setSpeakerOrderIndex] = useState<number | null>(null);
  const [speakerOrderTotal, setSpeakerOrderTotal] = useState<number | null>(null);
  const [dayEventQueue, setDayEventQueue] = useState<any[] | null>(null);
  const [nightHintTargetId, setNightHintTargetId] = useState<string | null>(null);
  const [nightHintInfo, setNightHintInfo] = useState<{ id: string; name?: string; role?: string; position?: number } | null>(null);
  const [streamingContent, setStreamingContent] = useState<{ playerId: string; content: string } | null>(null);
  const [prefetchingIds, setPrefetchingIds] = useState<Set<string>>(new Set());

  // Sheriff Election State
  const [sheriffCandidates, setSheriffCandidates] = useState<string[]>([]);

  // Host Control State
  const [isPaused, setIsPaused] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!SOCKET_URL) {
      console.error('❌ Socket URL unavailable in secure context. 请在 .env 设置 VITE_SOCKET_URL 指向可达的后端。');
      return;
    }
    console.log('Initializing socket connection to:', SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to game server, socket id:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      setConnected(false);
    });

    newSocket.on('room_state', (state: RoomState) => {
      console.log('📨 Received room_state:', state);
      setRoomState(state);
      roomStateRef.current = state;
    });

    newSocket.on('update_players', (update: any) => {
      console.log('📨 Received update_players:', update);
      setRoomState((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          players: update.players,
          phase: update.phase,
          timer: update.timer,
          currentRound: update.currentRound,
        } as RoomState;
        roomStateRef.current = next;
        return next;
      });
    });

    newSocket.on('role_assign', ({ role }: { role: string }) => {
      console.log('📨 Received role_assign:', role);
      setRoomState((prev) => {
        if (!prev) return prev;
        return { ...prev, myRole: role };
      });
    });

    newSocket.on('chat_message', (message: ChatMessage) => {
      console.log('📨 Received chat_message:', message);
      
      // 🔧 双重去重：检查 lastMessagesRef 和 chatMessagesRef
      const signature = `${message.id}`;
      
      // 检查是否已在去重列表中
      if (lastMessagesRef.current.includes(signature)) {
        console.log('⚠️ Duplicate message (in recent), skipping:', signature);
        return;
      }
      
      // 检查是否已在消息列表中
      if (chatMessagesRef.current.some(m => m.id === message.id)) {
        console.log('⚠️ Duplicate message (in ref), skipping:', signature);
        return;
      }
      
      // 添加到去重列表
      lastMessagesRef.current.push(signature);
      if (lastMessagesRef.current.length > 200) lastMessagesRef.current.shift();
      
      // 添加到消息列表
      chatMessagesRef.current = [...chatMessagesRef.current, message];
      setChatMessages([...chatMessagesRef.current]);
      console.log(`✅ Message added, total: ${chatMessagesRef.current.length}, content: "${message.content?.substring(0, 30)}..."`);
      
      // 如果收到正式发言，清除流式状态
      if (message.type === 'speech') {
        setStreamingContent(null);
      }
    });

    newSocket.on('ai_speech_chunk', (data: { playerId: string; chunk: string }) => {
      setStreamingContent((prev) => {
        if (prev && prev.playerId === data.playerId) {
          return { ...prev, content: prev.content + data.chunk };
        }
        return { playerId: data.playerId, content: data.chunk };
      });
    });

    // speeches 统一通过 'chat_message' 事件广播，这里不重复映射 'player_speech'

    // --- New Event Listeners ---

    newSocket.on('speaker_change', ({ speakerId, deadline, orderIndex, orderTotal }: { speakerId: string, deadline: number | null, orderIndex?: number, orderTotal?: number }) => {
      setActiveSpeakerId(speakerId);
      const remaining = typeof deadline === 'number' ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null;
      setSpeakerRemainingSeconds(remaining as any);
      if (typeof orderIndex === 'number') setSpeakerOrderIndex(orderIndex + 1); // 用户视角从1开始
      if (typeof orderTotal === 'number') setSpeakerOrderTotal(orderTotal);
    });

    newSocket.on('ai_thinking', ({ playerId, thinking }: { playerId: string, thinking: boolean }) => {
      setAiThinkingIds(prev => {
        const next = new Set(prev);
        if (thinking) next.add(playerId);
        else next.delete(playerId);
        return next;
      });
    });

    newSocket.on('ai_prefetching', ({ playerId, prefetching }: { playerId: string, prefetching: boolean }) => {
      setPrefetchingIds(prev => {
        const next = new Set(prev);
        if (prefetching) next.add(playerId);
        else next.delete(playerId);
        return next;
      });
    });

    newSocket.on('speech_timeout', ({ speakerId }: { speakerId: string }) => {
      if (activeSpeakerId === speakerId) {
        setActiveSpeakerId(null);
        setSpeakerRemainingSeconds(null);
      }
    });

    newSocket.on('night_result', ({ deaths }: { deaths: string[] }) => {
      // Optional: Handle visual notification here if needed, or rely on roomState update
      console.log('Night result:', deaths);
    });

    // ---------------------------

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    newSocket.on('room_destroyed', () => {
      console.log('📨 Room destroyed');
      setRoomState(null);
      chatMessagesRef.current = [];
      lastMessagesRef.current = [];
      setChatMessages([]);
    });

    // 私聊：预言家查验结果
    newSocket.on('seer_check_result', (payload: { round: number; targetId: string; targetName?: string; result: string }) => {
      console.log('🔒 Seer check result (private):', payload);
      // 将事件写入本地日志，前端可据此展示身份卡
      setRoomState((prev) => {
        if (!prev) return prev;
        const clonedLog = [...prev.gameLog, {
          round: payload.round,
          phase: 'DAY_MORNING_RESULT' as any,
          timestamp: new Date().toISOString(),
          event: 'Seer private check',
          details: {
            targetId: payload.targetId,
            targetName: payload.targetName,
            result: payload.result,
          }
        }];
        return { ...prev, gameLog: clonedLog };
      });
    });

    // 公共：投票可见（谁投了谁）
    newSocket.on('vote_cast', (payload: { voterId: string; voterName?: string; targetId: string; targetName?: string }) => {
      const msg: ChatMessage = {
        id: `vote_${Date.now()}_${payload.voterId}`,
        senderId: 'system',
        senderName: '系统',
        content: `${payload.voterName || '玩家'} 投票给 ${payload.targetName || '弃票'}`,
        timestamp: new Date().toISOString(),
        phase: (roomState?.phase || 'DAY_VOTE') as any,
        type: 'system',
      };
      chatMessagesRef.current = [...chatMessagesRef.current, msg];
      setChatMessages([...chatMessagesRef.current]);
    });

    // 私聊：女巫夜晚提示被击杀目标
    newSocket.on('night_hint', (payload: { night_death: string; night_death_name?: string; night_death_role?: string; night_death_position?: number }) => {
      setNightHintTargetId(payload.night_death);
      setNightHintInfo({
        id: payload.night_death,
        name: payload.night_death_name,
        role: payload.night_death_role,
        position: payload.night_death_position,
      });
    });

    // 后端驱动的白天事件队列
    newSocket.on('day_event_queue', (events: any[]) => {
      console.log('🎬 Day event queue received:', events);
      setDayEventQueue(events);
      // 将包含 log_text 的事件追加到系统日志
      const systemLogs = events.filter(e => !!e.log_text).map(e => ({
        id: `sys_${Date.now()}_${Math.random()}`,
        senderId: 'system',
        senderName: '系统',
        content: String(e.log_text),
        timestamp: new Date().toISOString(),
        phase: (roomState?.phase || 'DAY_DISCUSS') as any,
        type: 'system' as const,
      }));
      if (systemLogs.length) {
        const recent = lastMessagesRef.current;
        const filtered = systemLogs.filter(msg => {
          const signature = `${msg.type}|${msg.senderName}|${msg.content}`;
          if (recent.includes(signature)) return false;
          recent.push(signature);
          if (recent.length > 50) recent.shift();
          return true;
        });
        if (filtered.length) {
          chatMessagesRef.current = [...chatMessagesRef.current, ...filtered];
          setChatMessages([...chatMessagesRef.current]);
        }
      }
    });

    // ========== Sheriff Election Events ==========

    newSocket.on('sheriff_candidate_registered', ({ playerId, playerName, totalCandidates }: { playerId: string, playerName: string, totalCandidates: number }) => {
      setSheriffCandidates(prev => [...prev, playerId]);
      console.log(`🏅 ${playerName} 申请竞选警长 (总候选人: ${totalCandidates})`);
    });

    newSocket.on('sheriff_elected', ({ sheriffName, votes }: { sheriffId: string, sheriffName: string, votes: number }) => {
      console.log(`👑 ${sheriffName} 当选警长！得票: ${votes}`);
    });

    // ========== Host Control Events ==========

    newSocket.on('game_paused', (_data: { by: string }) => {
      setIsPaused(true);
      console.log('⏸️ 游戏已暂停');
    });

    newSocket.on('game_resumed', (_data: { by: string }) => {
      setIsPaused(false);
      console.log('▶️ 游戏已恢复');
    });

    newSocket.on('host_forced_skip', (_data: { skippedId: string, by: string }) => {
      console.log('⏩ 主持人强制跳过发言');
    });

    // 右侧日志显示依赖统一的 chat_message 事件（包括 AI 与玩家的发言），避免重复

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('Closing socket connection');
      newSocket.close();
    };
  }, []);

  // Timer for speaker countdown
  useEffect(() => {
    if (activeSpeakerId && speakerRemainingSeconds !== null && speakerRemainingSeconds > 0) {
      const timer = setInterval(() => {
        setSpeakerRemainingSeconds(prev => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSpeakerId, speakerRemainingSeconds]);

  // Create room
  const createRoom = useCallback(
    (
      roomName: string,
      playerName: string,
      playerCount: 6 | 9 | 12,
    ): Promise<{ roomId: string; playerId: string }> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('create_room', { roomName, playerName, playerCount }, (response: any) => {
          if (response.success) {
            resolve({ roomId: response.roomId, playerId: response.playerId });
          } else {
            reject(new Error(response.error || 'Failed to create room'));
          }
        });
      });
    },
    [socket],
  );

  // Join room
  const joinRoom = useCallback(
    (
      roomId: string,
      playerName: string,
      isAI: boolean = false,
    ): Promise<{ roomId: string; playerId: string }> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('join_room', { roomId, playerName, isAI }, (response: any) => {
          if (response.success) {
            resolve({ roomId: response.roomId, playerId: response.playerId });
          } else {
            reject(new Error(response.error || 'Failed to join room'));
          }
        });
      });
    },
    [socket],
  );

  // Leave room
  const leaveRoom = useCallback(
    (roomId: string, playerId: string) => {
      if (!socket) return;
      socket.emit('leave_room', { roomId, playerId });
      setRoomState(null);
      chatMessagesRef.current = [];
      lastMessagesRef.current = [];
      setChatMessages([]);
    },
    [socket],
  );

  // Start game
  const startGame = useCallback(
    (roomId: string, playerId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('start_game', { roomId, playerId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to start game'));
          }
        });
      });
    },
    [socket],
  );

  // Submit night action
  const sendNightAction = useCallback(
    (
      roomId: string,
      playerId: string,
      actionType: string,
      targetId: string | null,
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit(
          'night_action',
          {
            roomId,
            playerId,
            action: { actionType, targetId },
          },
          (response: any) => {
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.error || 'Failed to submit night action'));
            }
          },
        );
      });
    },
    [socket],
  );

  // Submit vote
  const sendVote = useCallback(
    (roomId: string, playerId: string, targetId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('vote', { roomId, playerId, targetId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to submit vote'));
          }
        });
      });
    },
    [socket],
  );

  // Send chat message
  const sendChat = useCallback(
    (roomId: string, playerId: string, content: string, type: 'speech' | 'chat' = 'chat') => {
      if (!socket) return;
      socket.emit('chat_message', { roomId, playerId, content, type });
    },
    [socket],
  );

  // End speech
  const sendSpeechEnd = useCallback(
    (roomId: string, playerId: string) => {
      if (!socket) return;
      socket.emit('speech_end', { roomId, playerId });
    },
    [socket]
  );

  const debugRestore = useCallback(
    (roomId: string, speakerPosition?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit('debug_restore', { roomId, speakerPosition }, (response: any) => {
          if (response?.success) resolve(); else reject(new Error(response?.error || 'Failed to debug restore'));
        });
      });
    },
    [socket]
  );

  // Get available rooms
  const getRooms = useCallback((): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('get_rooms', (response: any) => {
        resolve(response.rooms || []);
      });
    });
  }, [socket]);

  // Submit hunter shoot
  const sendHunterShoot = useCallback(
    (roomId: string, playerId: string, targetId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('hunter_shoot', { roomId, playerId, targetId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to submit hunter shoot'));
          }
        });
      });
    },
    [socket],
  );

  // Submit badge transfer
  const sendBadgeTransfer = useCallback(
    (roomId: string, playerId: string, targetId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('badge_transfer', { roomId, playerId, targetId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to submit badge transfer'));
          }
        });
      });
    },
    [socket],
  );

  // ========== Sheriff Election Methods ==========

  // Apply for sheriff
  const applySheriff = useCallback(
    (roomId: string, playerId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('apply_sheriff', { roomId, playerId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to apply for sheriff'));
          }
        });
      });
    },
    [socket],
  );

  // Vote for sheriff
  const voteSheriff = useCallback(
    (roomId: string, playerId: string, targetId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('vote_sheriff', { roomId, playerId, targetId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to vote for sheriff'));
          }
        });
      });
    },
    [socket],
  );

  // ========== Host Control Methods ==========

  // Pause game (host only)
  const hostPause = useCallback(
    (roomId: string, playerId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('host_pause', { roomId, playerId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to pause game'));
          }
        });
      });
    },
    [socket],
  );

  // Resume game (host only)
  const hostResume = useCallback(
    (roomId: string, playerId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('host_resume', { roomId, playerId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to resume game'));
          }
        });
      });
    },
    [socket],
  );

  // Force skip speaker (host only)
  const hostForceSkip = useCallback(
    (roomId: string, playerId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit('host_force_skip', { roomId, playerId }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to force skip'));
          }
        });
      });
    },
    [socket],
  );

  return {
    connected,
    roomState,
    chatMessages,
    dayEventQueue,
    nightHintTargetId,
    nightHintInfo,
    streamingContent,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendNightAction,
    sendVote,
    sendChat,
    sendSpeechEnd,
    getRooms,
    sendHunterShoot,
    sendBadgeTransfer,
    activeSpeakerId,
    speakerRemainingSeconds,
    aiThinkingIds,
    prefetchingIds,
    speakerOrderIndex,
    speakerOrderTotal,
    // Sheriff Election
    sheriffCandidates,
    applySheriff,
    voteSheriff,
    // Host Controls
    isPaused,
    hostPause,
    hostResume,
    hostForceSkip,
    debugRestore,
  };
};
