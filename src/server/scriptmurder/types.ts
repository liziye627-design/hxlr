export type ScriptGamePhase =
  | 'WAITING'
  | 'EVIDENCE_SEARCH'
  | 'INTERROGATION'
  | 'ACCUSATION'
  | 'VOTE'
  | 'REVEAL'
  | 'GAME_OVER';

export interface ScriptPlayer {
  id: string;
  name: string;
  type: 'user' | 'ai';
  is_alive: boolean;
  position: number;
  socketId: string | null;
  isOnline: boolean;
  isAI: boolean;
  ap: number;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  location: string;
  discoveredBy: string | null;
  isPublic: boolean;
  discoveredAt: string | null;
}

export interface Suspect {
  playerId: string;
  suspicion: number;
  notes?: string[];
}

export interface ScriptVoteAction {
  voterId: string;
  targetId: string;
}

export interface ScriptGameLogEntry {
  round: number;
  phase: ScriptGamePhase;
  timestamp: string;
  event: string;
  details: any;
}

export interface ScriptRoomState {
  id: string;
  name: string;
  hostId: string;
  phase: ScriptGamePhase;
  players: ScriptPlayer[];
  currentRound: number;
  clues: Clue[];
  publicClueIds: string[];
  privateClues: Record<string, string[]>;
  suspects: Record<string, Suspect[]>;
  votes: ScriptVoteAction[];
  timer: number;
  winner: 'culprit_identified' | 'culprit_escaped' | null;
  gameLog: ScriptGameLogEntry[];
  aiThinkingIds: string[];
  isPaused?: boolean;
}

export interface CreateScriptRoomPayload {
  roomName: string;
  playerName: string;
  maxPlayers: number;
}

export interface JoinScriptRoomPayload {
  roomId: string;
  playerName: string;
  isAI?: boolean;
}

export interface RevealCluePayload {
  clueId: string;
}

export interface AccusePayload {
  targetId: string;
  reason?: string;
}

export interface ScriptVotePayload {
  targetId: string;
}

export interface WhisperPayload {
  toPlayerId: string;
  content: string;
}

export interface A2AHeader {
  sender: string;
  receiver: string;
  timestamp: string;
  intent: 'send_message' | 'discover' | 'broadcast' | 'whisper';
}

export interface A2AMessage {
  header: A2AHeader;
  payload: any;
}

// Script configuration interfaces
export interface ScriptCharacter {
  id: string;
  name: string;
  pdfPath: string;
  pdfPath2?: string; // Some characters have split PDFs
  description?: string;
  // AI Agent Configuration
  role?: string;
  personality?: string;
  secrets?: string[];
  relationships?: Record<string, string>;
  avatar?: string;
}

export interface ScriptClue {
  id: string;
  title: string;
  pdfPath?: string;
  description: string;
  location?: string;
}

export interface ScriptAudio {
  id: string;
  name: string;
  filePath: string;
  trigger?: string;
}

export interface ScriptGameAssets {
  handbookPath?: string;
  identityCardsPath?: string;
  mapPath?: string;
}

export interface ScriptConfig {
  scriptId: string;
  intro: string;
  chapters: number;
  estimatedTime: string;
  tags: string[];
  characters: ScriptCharacter[];
  clues: ScriptClue[];
  audioFiles?: ScriptAudio[];
  gameAssets?: ScriptGameAssets;
}

