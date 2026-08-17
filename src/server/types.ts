import type { WerewolfPlayer, WerewolfPersona } from '../types/index.js';

// Game phases for the finite state machine
export type GamePhase =
  | 'WAITING' // Lobby phase, players joining
  | 'NIGHT' // Night phase, players perform night actions
  | 'DAY_MORNING_RESULT' // Morning, announcing night results
  | 'DAY_DISCUSS' // Day discussion phase
  | 'DAY_VOTE' // Voting phase
  | 'DAY_DEATH_LAST_WORDS' // Last words for exiled player
  | 'SHERIFF_ELECTION_DISCUSS' // Sheriff election discussion
  | 'SHERIFF_ELECTION_VOTE' // Sheriff election voting
  | 'HUNTER_SHOOT' // Hunter death rattle phase
  | 'BADGE_TRANSFER' // Sheriff death rattle phase
  | 'GAME_OVER'; // Game ended

// Player speech history
export interface PlayerSpeech {
  position: number;         // 发言者序号
  round: number;           // 回合数
  phase: GamePhase;        // 阶段
  content: string;         // 发言内容
  timestamp: string;       // 时间戳
  isAI: boolean;          // 是否AI发言
}

import type { AIPersona } from './AIPersonaSystem.js';

// Player in a room context (extends WerewolfPlayer)
export interface RoomPlayer extends WerewolfPlayer {
  position: number;          // 玩家座位序号 (1-12)
  socketId: string | null;   // AI玩家没有socketId
  isOnline: boolean;
  isAI: boolean;            // 是否为AI玩家
  hasActedNight: boolean;   // Has completed night action
  hasVoted: boolean;        // Has cast their vote
  hasHunterShot?: boolean;  // Has hunter used ability
  deathReason?: 'killed' | 'poisoned' | 'voted' | null; // 死因（用于猎人规则：被毒不能开枪）
  hasSpokenThisRound?: boolean; // 当天发言是否已完成

  // AI分析数据
  speechHistory: PlayerSpeech[];  // 发言历史
  suspicionLevel?: number;        // 被怀疑度 (0-100)
  trustLevel?: number;            // 可信度 (0-100)

  // Override persona to allow server-side AIPersona
  persona?: WerewolfPersona | AIPersona;
}

// Night actions submitted by players
export interface NightAction {
  playerId: string;
  role: string;
  actionType: 'kill' | 'check' | 'save' | 'poison' | 'protect';
  targetId: string | null;
}

// Vote submission
export interface VoteAction {
  voterId: string;
  targetId: string;
}

// Room state
export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  phase: GamePhase;
  players: RoomPlayer[];
  currentRound: number;
  nightActions: NightAction[];
  votes: VoteAction[];
  timer: number;
  winner: 'werewolf' | 'villager' | null;
  gameLog: GameLogEntry[];
  sheriffId: string | null;
  witchPotions: {
    antidote: boolean;
    poison: boolean;
  };

  // 发言控制
  currentSpeakerOrder: string[];     // 本阶段发言顺序（只填存活玩家）
  currentSpeakerIndex: number;       // 指向 currentSpeakerOrder 的索引
  currentSpeakerId: string | null;   // 当前发言人ID
  currentSpeakerDeadline: number | null;  // 时间戳（ms）

  // 遗言控制
  pendingLastWordsQueue?: string[];   // 需要遗言的玩家ID（按顺序）
  pendingLastWordsPlayerId: string | null;

  // 警长相关
  isSheriffElectionEnabled?: boolean;
  isSheriffElectionDone?: boolean;
  sheriffCandidates: string[]; // 警长候选人ID列表
  sheriffVotes: VoteAction[]; // 警长投票（独立于白天投票）

  // AI 思考状态
  aiThinkingIds: string[]; // 使用 string[] 替代 Set 以便序列化

  // 主持人控制
  isPaused?: boolean; // 游戏是否暂停

  // 怀疑度持久化
  suspicionState?: Record<string, Record<string, {
    current_score: number;
    history_trend: number[];
    major_grudges: string[];
  }>>; // key: ai_player_id -> target_id -> state

  // 每个AI的知识库（私有记忆）
  agentKnowledge?: Record<string, { log: Array<{ round: number; phase: string; type: AgentKnowledgeType; targetId?: string; targetName?: string; result?: string; text?: string }> }>;

  // 狼人夜聊（仅狼人可见）
  wolfChats?: Array<{ senderId: string; content: string; timestamp: string; round: number }>;
}

export type AgentKnowledgeType = 'seer_check' | 'witch_save' | 'witch_poison' | 'guard_protect' | 'werewolf_team_kill' | 'peace_night' | 'death' | 'vote_cast' | 'vote_eliminate' | 'note' | string;

// Game log entry
export interface GameLogEntry {
  round: number;
  phase: GamePhase;
  timestamp: string;
  event: string;
  details: any;
}

// Chat message
export interface GameChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  phase: GamePhase;
}

// Socket event payloads
export interface CreateRoomPayload {
  roomName: string;
  playerName: string;
  playerCount: 6 | 9 | 12;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  isAI?: boolean; // AI玩家标识
}

export interface NightActionPayload {
  actionType: NightAction['actionType'];
  targetId: string | null;
}

export interface VotePayload {
  targetId: string;
}

export interface ChatMessagePayload {
  content: string;
}

export interface HunterShootPayload {
  targetId: string;
}

export interface BadgeTransferPayload {
  targetId: string;
}

// Replay System Types
export interface ReplayEvent {
  timestamp: number;
  type: 'phase' | 'speech' | 'vote' | 'action' | 'death' | 'revive' | 'sheriff' | 'chat';
  payload: any;
}

export interface ReplayData {
  roomId: string;
  roomName: string;
  startTime: number;
  endTime: number;
  players: { id: string; name: string; role: string; position: number; avatar?: string }[];
  events: ReplayEvent[];
  winner: 'werewolf' | 'villager' | null;
}
