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
