import { supabase } from './supabase';
import type {
  UserProfile,
  AICompanion,
  UserCompanion,
  GameSession,
  GameRecord,
  Story,
  Ranking,
  CompanionWithRelation,
} from '@/types';

// 用户相关API
export const userApi = {
  async getOrCreateUser(userId: string, nickname: string): Promise<UserProfile | null> {
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        nickname,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  },

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  },
};

// AI伴侣相关API
export const companionApi = {
  async getAllCompanions(): Promise<AICompanion[]> {
    const { data, error } = await supabase
      .from('ai_companions')
      .select('*')
      .order('unlock_level', { ascending: true });

    if (error) {
      console.error('Error fetching companions:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getCompanionById(companionId: string): Promise<AICompanion | null> {
    const { data, error } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('id', companionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching companion:', error);
      return null;
    }

    return data;
  },

  async getUserCompanions(userId: string): Promise<CompanionWithRelation[]> {
    const { data, error } = await supabase
      .from('user_companions')
      .select(`
        *,
        companion:ai_companions(*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user companions:', error);
      return [];
    }

    if (!Array.isArray(data)) return [];

    return data.map((uc: any) => ({
      ...uc.companion,
      intimacy: uc.intimacy,
      games_played: uc.games_played,
      unlocked: true,
    }));
  },

  async unlockCompanion(userId: string, companionId: string): Promise<UserCompanion | null> {
    const { data, error } = await supabase
      .from('user_companions')
      .insert({
        user_id: userId,
        companion_id: companionId,
        intimacy: 0,
        games_played: 0,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error unlocking companion:', error);
      return null;
    }

    return data;
  },

  async updateCompanionIntimacy(
    userId: string,
    companionId: string,
    intimacyDelta: number
  ): Promise<UserCompanion | null> {
    const { data: existing } = await supabase
      .from('user_companions')
      .select('*')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .maybeSingle();

    if (!existing) return null;

    const { data, error } = await supabase
      .from('user_companions')
      .update({
        intimacy: existing.intimacy + intimacyDelta,
        games_played: existing.games_played + 1,
        last_interaction: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating companion intimacy:', error);
      return null;
    }

    return data;
  },
};

// 游戏会话相关API
export const gameApi = {
  async createSession(session: Partial<GameSession>): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(session)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  },

  async getSessionById(sessionId: string): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  },

  async updateSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating session:', error);
      return null;
    }

    return data;
  },

  async getActiveSessions(gameType?: string): Promise<GameSession[]> {
    let query = supabase
      .from('game_sessions')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async createGameRecord(record: Partial<GameRecord>): Promise<GameRecord | null> {
    const { data, error } = await supabase
      .from('game_records')
      .insert(record)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating game record:', error);
      return null;
    }

    return data;
  },

  async getUserGameRecords(userId: string, limit = 10): Promise<GameRecord[]> {
    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching game records:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },
};

// 故事库相关API
export const storyApi = {
  async getAllStories(): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('play_count', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getStoriesByCategory(category: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('category', category)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching stories by category:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async getStoryById(storyId: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching story:', error);
      return null;
    }

    return data;
  },

  async incrementPlayCount(storyId: string): Promise<void> {
    const { data: story } = await supabase
      .from('stories')
      .select('play_count')
      .eq('id', storyId)
      .maybeSingle();

    if (story) {
      await supabase
        .from('stories')
        .update({ play_count: story.play_count + 1 })
        .eq('id', storyId);
    }
  },
};

// 排行榜相关API
export const rankingApi = {
  async getRankings(type: string, season?: string, limit = 100): Promise<Ranking[]> {
    let query = supabase
      .from('rankings')
      .select('*, user:user_profiles(*)')
      .eq('ranking_type', type)
      .order('score', { ascending: false })
      .limit(limit);

    if (season) {
      query = query.eq('season', season);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async updateUserRanking(
    userId: string,
    type: string,
    scoreDelta: number,
    season: string
  ): Promise<Ranking | null> {
    const { data: existing } = await supabase
      .from('rankings')
      .select('*')
      .eq('user_id', userId)
      .eq('ranking_type', type)
      .eq('season', season)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('rankings')
        .update({
          score: existing.score + scoreDelta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating ranking:', error);
        return null;
      }

      return data;
    }

    const { data, error } = await supabase
      .from('rankings')
      .insert({
        user_id: userId,
        ranking_type: type,
        score: scoreDelta,
        season,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating ranking:', error);
      return null;
    }

    return data;
  },
};

// 狼人杀相关API
export const werewolfApi = {
  // 获取所有人设
  async getAllPersonas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_personas')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error fetching personas:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // 获取公开人设
  async getPublicPersonas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_personas')
      .select('*')
      .eq('is_public', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching public personas:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // 获取用户自定义人设
  async getUserPersonas(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_personas')
      .select('*')
      .eq('creator_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user personas:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // 创建自定义人设
  async createPersona(persona: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_personas')
      .insert(persona)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating persona:', error);
      return null;
    }

    return data;
  },

  // 更新人设
  async updatePersona(personaId: string, updates: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_personas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', personaId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating persona:', error);
      return null;
    }

    return data;
  },

  // 增加人设使用次数
  async incrementPersonaUsage(personaId: string): Promise<void> {
    const { data: persona } = await supabase
      .from('werewolf_personas')
      .select('usage_count')
      .eq('id', personaId)
      .maybeSingle();

    if (persona) {
      await supabase
        .from('werewolf_personas')
        .update({ usage_count: persona.usage_count + 1 })
        .eq('id', personaId);
    }
  },

  // 获取游戏配置
  async getGameConfigs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_game_configs')
      .select('*')
      .order('player_count', { ascending: true });

    if (error) {
      console.error('Error fetching game configs:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // 获取指定人数的游戏配置
  async getConfigByPlayerCount(playerCount: 6 | 9 | 12): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_game_configs')
      .select('*')
      .eq('player_count', playerCount)
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game config:', error);
      return null;
    }

    return data;
  },

  // 记录发言
  async recordSpeech(speech: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_speech_records')
      .insert(speech)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error recording speech:', error);
      return null;
    }

    return data;
  },

  // 获取会话的所有发言记录
  async getSessionSpeeches(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_speech_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching speeches:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // 创建人设学习任务
  async createPersonaLearning(learning: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_persona_learning')
      .insert(learning)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating persona learning:', error);
      return null;
    }

    return data;
  },

  // 更新人设学习任务
  async updatePersonaLearning(learningId: string, updates: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('werewolf_persona_learning')
      .update(updates)
      .eq('id', learningId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating persona learning:', error);
      return null;
    }

    return data;
  },

  // 获取用户的学习记录
  async getUserLearningRecords(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('werewolf_persona_learning')
      .select('*, generated_persona:werewolf_personas(*)')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning records:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },
};

