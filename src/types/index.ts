export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 数据库表类型定义

export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  level: number;
  experience: number;
  coins: number;
  vip_status: 'free' | 'monthly' | 'quarterly' | 'yearly';
  vip_expire_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AICompanion {
  id: string;
  name: string;
  type: 'alpha' | 'aqua' | 'shadow' | 'rookie';
  description: string | null;
  avatar_url: string | null;
  personality: {
    traits: string[];
    style: string;
  } | null;
  skills: {
    strengths: string[];
    weakness: string;
  } | null;
  unlock_level: number;
  created_at: string;
}

export interface UserCompanion {
  id: string;
  user_id: string;
  companion_id: string;
  intimacy: number;
  games_played: number;
  unlocked_at: string;
  last_interaction: string | null;
}

export interface GameSession {
  id: string;
  game_type: 'werewolf' | 'script_murder' | 'adventure';
  mode: 'pve' | 'pvp' | 'solo' | 'multi';
  host_user_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  players: any;
  ai_companions: any;
  game_data: any;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface GameRecord {
  id: string;
  session_id: string;
  user_id: string;
  game_type: string;
  result: 'win' | 'lose' | 'draw' | null;
  score: number;
  role: string | null;
  performance: any;
  rewards: any;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  category: 'mystery' | 'horror' | 'romance' | 'fantasy' | 'modern';
  difficulty: 'beginner' | 'normal' | 'hard' | 'insane';
  min_players: number;
  max_players: number;
  description: string | null;
  cover_url: string | null;
  story_data: any;
  play_count: number;
  rating: number;
  is_premium: boolean;
  created_at: string;
}

export interface Ranking {
  id: string;
  user_id: string;
  ranking_type: 'power' | 'charm' | 'cooperation';
  score: number;
  rank: number | null;
  season: string | null;
  updated_at: string;
}

// 扩展类型定义

export interface CompanionWithRelation extends AICompanion {
  intimacy?: number;
  games_played?: number;
  unlocked?: boolean;
}

export interface RankingWithUser extends Ranking {
  user?: UserProfile;
}

export interface GameRecordWithDetails extends GameRecord {
  session?: GameSession;
  user?: UserProfile;
}

// AI对话消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  companion?: AICompanion;
}

// 游戏阶段类型
export type GamePhase =
  | 'WAITING'
  | 'NIGHT'
  | 'DAY_MORNING_RESULT'
  | 'DAY_DISCUSS'
  | 'DAY_VOTE'
  | 'DAY_DEATH_LAST_WORDS'
  | 'SHERIFF_ELECTION_DISCUSS'
  | 'SHERIFF_ELECTION_VOTE'
  | 'HUNTER_SHOOT'
  | 'BADGE_TRANSFER'
  | 'GAME_OVER'
  | 'DAY_RESULT';

// 游戏房间类型
export interface GameRoom {
  id: string;
  name: string;
  game_type: 'werewolf' | 'script_murder' | 'adventure';
  mode: 'pve' | 'pvp';
  current_players: number;
  max_players: number;
  host: UserProfile;
  status: 'waiting' | 'playing' | 'finished';
}

// 狼人杀人设类型
export interface WerewolfPersona {
  id: string;
  name: string;
  type: 'preset' | 'custom' | 'learned';
  creator_user_id: string | null;
  description: string | null;
  avatar_url: string | null;
  personality_traits: {
    logical_level: number;
    emotional_level: number;
    aggressive_level: number;
    cautious_level: number;
    trust_level: number;
  };
  speaking_style: {
    speech_length: 'short' | 'medium' | 'long';
    speech_frequency: 'low' | 'medium' | 'high';
    logic_pattern: 'inductive' | 'deductive' | 'intuitive';
    emotion_expression: 'reserved' | 'moderate' | 'expressive';
  };
  behavior_patterns: {
    voting_tendency: string;
    strategy_style: string;
  };
  sample_speeches: any[];
  usage_count: number;
  rating: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 狼人杀发言记录类型
export interface WerewolfSpeechRecord {
  id: string;
  session_id: string;
  round_number: number;
  phase: 'night' | 'day' | 'vote';
  speaker_type: 'user' | 'ai';
  speaker_id: string | null;
  speaker_name: string | null;
  role: 'werewolf' | 'villager' | 'seer' | 'witch' | 'hunter' | 'guard' | null;
  content: string;
  emotion: string | null;
  target_player: string | null;
  vote_result: string | null;
  created_at: string;
}

// 狼人杀人设学习记录类型
export interface WerewolfPersonaLearning {
  id: string;
  source_session_id: string;
  target_user_id: string;
  generated_persona_id: string | null;
  speech_count: number;
  analysis_result: {
    personality_analysis?: any;
    speaking_style_analysis?: any;
    behavior_analysis?: any;
    key_phrases?: string[];
    decision_patterns?: any;
  };
  confidence_score: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

// 狼人杀游戏配置类型
export interface WerewolfGameConfig {
  id: string;
  player_count: 6 | 9 | 12;
  role_config: {
    werewolf_count: number;
    villager_count: number;
    seer_count: number;
    witch_count: number;
    hunter_count: number;
    guard_count: number;
  };
  rules: any;
  is_default: boolean;
  created_at: string;
}

// 狼人杀玩家类型
export interface WerewolfPlayer {
  id: string;
  name: string;
  type: 'user' | 'ai';
  persona?: WerewolfPersona | any;
  role?: 'werewolf' | 'villager' | 'seer' | 'witch' | 'hunter' | 'guard';
  is_alive: boolean;
  position: number;
  // Multiplayer fields
  socketId?: string | null;  // 修改为 string | null 以兼容 RoomPlayer
  isOnline?: boolean;
  hasActedNight?: boolean;
  hasVoted?: boolean;
  hasHunterShot?: boolean;
}

// 狼人杀游戏状态类型
export interface WerewolfGameState {
  session_id: string;
  player_count: 6 | 9 | 12;
  players: WerewolfPlayer[];
  current_round: number;
  current_phase: GamePhase | 'night' | 'day' | 'vote';
  game_status: 'waiting' | 'playing' | 'finished';
  winner: 'werewolf' | 'villager' | null;
  timer?: number;
  sheriffId?: string | null;
  witchPotions?: { antidote: boolean; poison: boolean };
}
