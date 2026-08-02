import { supabase } from './supabase';
import { AGENT_SHOWROOM, AGENT_SHOWROOM_INDEX } from '@/config/agentRoster';
import type {
  UserProfile,
  AICompanion,
  UserCompanion,
  GameSession,
  GameRecord,
  Story,
  Ranking,
  CompanionWithRelation,
  AgentLeaderboardEntry,
  AgentReview,
  AgentReviewInput,
} from '@/types';

const AGENT_REVIEW_STORAGE_KEY = 'agent-reviews-v1';

function getStoredAgentReviews(): AgentReview[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(AGENT_REVIEW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading local agent reviews:', error);
    return [];
  }
}

function setStoredAgentReviews(reviews: AgentReview[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(AGENT_REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error('Error persisting local agent reviews:', error);
  }
}

function buildAgentLeaderboard(reviews: AgentReview[]): AgentLeaderboardEntry[] {
  return AGENT_SHOWROOM.map((agent) => {
    const baseReviewCount = 10 + Math.round((agent.scoreSeed.chemistry + agent.scoreSeed.deduction) / 25);
    const baseOverall =
      (agent.scoreSeed.chemistry + agent.scoreSeed.deduction + agent.scoreSeed.clutch + agent.scoreSeed.ambience) /
      80;
    const baseChemistry = agent.scoreSeed.chemistry / 20;
    const baseDeduction = agent.scoreSeed.deduction / 20;
    const baseClutch = agent.scoreSeed.clutch / 20;

    const agentReviews = reviews.filter((review) => review.agent_id === agent.id);
    const totalWeight = baseReviewCount + agentReviews.length;
    const sum = agentReviews.reduce(
      (accumulator, review) => {
        accumulator.overall += review.overall_score;
        accumulator.chemistry += review.chemistry_score;
        accumulator.deduction += review.deduction_score;
        accumulator.clutch += review.clutch_score;
        return accumulator;
      },
      { overall: 0, chemistry: 0, deduction: 0, clutch: 0 },
    );

    const averageOverall = Number(
      ((baseOverall * baseReviewCount + sum.overall) / totalWeight).toFixed(2),
    );
    const averageChemistry = Number(
      ((baseChemistry * baseReviewCount + sum.chemistry) / totalWeight).toFixed(2),
    );
    const averageDeduction = Number(
      ((baseDeduction * baseReviewCount + sum.deduction) / totalWeight).toFixed(2),
    );
    const averageClutch = Number(
      ((baseClutch * baseReviewCount + sum.clutch) / totalWeight).toFixed(2),
    );
    const recentSuggestion =
      agentReviews
        .filter((review) => review.suggestion?.trim())
        .sort((left, right) => right.created_at.localeCompare(left.created_at))[0]?.suggestion ?? null;

    return {
      agentId: agent.id,
      agentName: agent.name,
      title: agent.title,
      previewImage: agent.previewImage,
      modelName: agent.modelName,
      reviewCount: totalWeight,
      averageOverall,
      averageChemistry,
      averageDeduction,
      averageClutch,
      trendScore: Number(
        (
          averageOverall * 0.55 +
          averageDeduction * 0.2 +
          averageClutch * 0.15 +
          averageChemistry * 0.1
        ).toFixed(2),
      ),
      recentSuggestion,
      recommendedModes: agent.modes.filter(
        (mode): mode is 'werewolf' | 'script_murder' | 'chat' | 'mc' => mode === 'werewolf' || mode === 'script_murder' || mode === 'chat' || mode === 'mc',
      ),
    };
  }).sort((left, right) => {
    if (right.trendScore !== left.trendScore) return right.trendScore - left.trendScore;
    return right.reviewCount - left.reviewCount;
  });
}

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
      if ((error as any)?.code === '23505') {
        const { data: existingAfter } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        return existingAfter || null;
      }
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
    intimacyDelta: number,
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

  async updateSession(
    sessionId: string,
    updates: Partial<GameSession>,
  ): Promise<GameSession | null> {
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
    season: string,
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
export const agentReviewApi = {
  async getLeaderboard(): Promise<AgentLeaderboardEntry[]> {
    const localReviews = getStoredAgentReviews();

    try {
      const { data, error } = await supabase
        .from('agent_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      const remoteReviews = Array.isArray(data) ? (data as AgentReview[]) : [];
      return buildAgentLeaderboard([...remoteReviews, ...localReviews]);
    } catch (error) {
      console.warn('Falling back to local agent leaderboard:', error);
      return buildAgentLeaderboard(localReviews);
    }
  },

  async getReviewsForAgent(agentId: string): Promise<AgentReview[]> {
    const localReviews = getStoredAgentReviews().filter((review) => review.agent_id === agentId);

    try {
      const { data, error } = await supabase
        .from('agent_reviews')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      const remoteReviews = Array.isArray(data) ? (data as AgentReview[]) : [];
      return [...remoteReviews, ...localReviews].sort((left, right) =>
        right.created_at.localeCompare(left.created_at),
      );
    } catch (error) {
      console.warn('Falling back to local agent reviews:', error);
      return localReviews.sort((left, right) => right.created_at.localeCompare(left.created_at));
    }
  },

  async submitReview(input: AgentReviewInput): Promise<AgentReview | null> {
    const review: AgentReview = {
      id: crypto.randomUUID(),
      agent_id: input.agent_id,
      user_id: input.user_id,
      session_id: input.session_id ?? null,
      game_mode: input.game_mode,
      overall_score: input.overall_score,
      chemistry_score: input.chemistry_score,
      deduction_score: input.deduction_score,
      clutch_score: input.clutch_score,
      suggestion: input.suggestion?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const localReviews = getStoredAgentReviews();
    setStoredAgentReviews([review, ...localReviews]);

    try {
      const { error } = await supabase.from('agent_reviews').insert({
        id: review.id,
        agent_id: review.agent_id,
        user_id: review.user_id,
        session_id: review.session_id,
        game_mode: review.game_mode,
        overall_score: review.overall_score,
        chemistry_score: review.chemistry_score,
        deduction_score: review.deduction_score,
        clutch_score: review.clutch_score,
        created_at: review.created_at,
      });

      if (error) {
        throw error;
      }

      if (review.suggestion) {
        await supabase.from('agent_review_suggestions').insert({
          review_id: review.id,
          agent_id: review.agent_id,
          user_id: review.user_id,
          session_id: review.session_id,
          game_mode: review.game_mode,
          content: review.suggestion,
          created_at: review.created_at,
        });

        await supabase.from('agent_memory_chunks').insert({
          agent_id: review.agent_id,
          user_id: review.user_id,
          session_id: review.session_id,
          game_mode: review.game_mode,
          source_type: 'review',
          content: review.suggestion,
          metadata: {
            overall_score: review.overall_score,
            chemistry_score: review.chemistry_score,
            deduction_score: review.deduction_score,
            clutch_score: review.clutch_score,
          },
          created_at: review.created_at,
        });
      }
    } catch (error) {
      console.warn('Review stored locally; remote sync unavailable:', error);
    }

    return review;
  },

  getSeedForAgent(agentId: string): AgentLeaderboardEntry | null {
    const agent = AGENT_SHOWROOM_INDEX[agentId];
    if (!agent) return null;
    return buildAgentLeaderboard([]).find((entry) => entry.agentId === agent.id) ?? null;
  },
};

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
