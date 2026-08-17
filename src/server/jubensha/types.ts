// Types for Script Murder Game System
// 基于 the-one-truth 项目的数据结构

// ==================== 游戏阶段 ====================
export type GameStage = 'SCRIPT' | 'INTRO' | 'CLUE' | 'DISCUSSION' | 'VOTE' | 'TRUTH';

// ==================== 剧本相关 ====================
export interface JubenshaScript {
  scriptId: string;
  title: string;
  description: string;
  playerNum: number;
  truth: string;
  murderId: string;
  addTime: string;
  roles?: JubenshaRole[];
  clues?: JubenshaClue[];
}

export interface JubenshaRole {
  roleId: string;
  roleName: string;
  scriptId: string;
  roleScriptId: number;
  isMurder: boolean;
  task: string;
  background: string;
  timeline: string;
  roleDescription: string;
}

export interface JubenshaClue {
  clueId: string;
  scriptId: string;
  roleId: string;
  clueScriptId: number;
  text: string;
  clueDescription: string;
}

// ==================== 玩家相关 ====================
export interface JubenshaPlayer {
  playerId: string;
  playerRoomId: number;
  userId: string;
  userName: string;
  roleId: string | null;
  role: JubenshaRole | null;
  roomId: string;
  isMaster: boolean;
  movementPoint: number;
  readyStatus: number;
  socketId?: string;
}

// ==================== 房间相关 ====================
export interface JubenshaRoom {
  roomId: string;
  size: number;
  stage: GameStage;
  stageIndex: number;
  scriptId: string | null;
  script: JubenshaScript | null;
  players: JubenshaPlayer[];
  clues: JubenshaClue[];
  roles: JubenshaRole[];
  discoveredClues: Map<string, { playerId: string; isPublic: boolean }>;
  dialogues: JubenshaDialogue[];
  votes: Map<string, string>;
  createdAt: string;
}

export interface JubenshaDialogue {
  dialogueId: string;
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
  sendTime: string;
}

// ==================== API Payloads ====================
export interface CreateRoomPayload {
  numPerson: number;
  username: string;
}

export interface JoinRoomPayload {
  roomId: string;
  username: string;
}

export interface SendMessagePayload {
  roomId: string;
  message: string;
}

export interface CheckCluePayload {
  roomId: string;
  clueId: string;
}

export interface VotePayload {
  roomId: string;
  targetRoleId: string;
}

// ==================== 房间状态视图 ====================
export interface RoomStateView {
  roomId: string;
  roomSize: number;
  stage: GameStage;
  stageIndex: number;
  scriptId: string | null;
  scriptTitle: string | null;
  players: Array<{
    playerId: string;
    playerRoomId: number;
    name: string;
    roleId: string | null;
    roleName: string | null;
    isMaster: boolean;
    isReady: boolean;
  }>;
  myPlayer: {
    playerId: string;
    playerRoomId: number;
    roleId: string | null;
    roleName: string | null;
    background: string;
    timeline: string;
    task: string;
    isMurder: boolean;
    movementPoint: number;
  } | null;
  roleInfo: Array<{
    roleId: string;
    roleScriptId: number;
    roleName: string;
    roleDescription: string;
  }>;
  clueInfo: Array<{
    clueId: string;
    clueScriptId: number;
    roleId: string;
    text: string;
    description: string;
    discovered: boolean;
    isPublic: boolean;
    ownerId: string | null;
  }>;
  dialogues: JubenshaDialogue[];
  murder: { roleId: string; roleName: string } | null;
  canShowTruth: boolean;
}

// ==================== 旧版类型（兼容） ====================
export interface ScriptData {
    id: string;
    title: string;
    scenes: Scene[];
    characters: Character[];
    clues: Clue[];
    timeline: TimelineEvent[];
}

export interface Scene {
    id: string;
    name: string;
    description: string;
    backgroundUrl: string;
    bgmUrl?: string;
    atmosphere: string;
}

export interface Character {
    id: string;
    name: string;
    role: string;
    avatar: string;
    personality: string;
    secrets: string[];
    relationships: Record<string, string>;
}

export interface Clue {
    id: string;
    name: string;
    description: string;
    revealCondition?: string;
    discovered: boolean;
}

export interface TimelineEvent {
    id: string;
    sceneId: string;
    trigger: 'auto' | 'player_action' | 'time';
    action: 'scene_change' | 'narration' | 'character_dialogue' | 'clue_reveal';
    content: string;
}

export interface GameState {
    roomId: string;
    scriptId: string;
    currentSceneId: string;
    currentPhase: 'intro' | 'investigation' | 'confrontation' | 'resolution';
    discoveredClues: string[];
    conversationHistory: Message[];
    timelineProgress: number;
}

export interface Message {
    id: string;
    sender: string;
    senderType: 'player' | 'narrator' | 'character' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        characterId?: string;
        sceneId?: string;
        clueId?: string;
    };
}

export interface PlayerAction {
    type: 'story_progress' | 'ask_character' | 'investigate' | 'chat';
    characterId?: string;
    message?: string;
}

export interface AgentResponse {
    type: 'narration' | 'dialogue' | 'scene_change' | 'clue_reveal' | 'system';
    content: string;
    metadata?: {
        newSceneId?: string;
        characterId?: string;
        clueIds?: string[];
    };
}
