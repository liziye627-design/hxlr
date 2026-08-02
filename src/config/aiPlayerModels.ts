/**
 * AI player / companion runtime manifest.
 *
 * This keeps backward-compatible exports for existing gameplay code while
 * upgrading the internal model config into a reusable avatar runtime schema.
 */

export type CompanionRuntimeType = 'live2d' | 'vrm' | 'static';
export type SpeechProvider = 'browser' | 'unspeech' | 'openai-compatible';
export type EmotionName = 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'surprise';

export interface VoiceProfile {
  style: string;
  provider: SpeechProvider;
  locale: string;
  preferredVoiceURI?: string;
}

export interface CompanionRuntimeManifest {
  id: string;
  displayName: string;
  runtimeType: CompanionRuntimeType;
  assetId: string;
  modelName?: string;
  defaultEmotion: EmotionName;
  supportedScenes: string[];
  personality?: string;
  voiceProfile: VoiceProfile;
  animationProfile?: {
    idle: string;
    talking: string;
    emotionMap?: Record<string, number>;
  };
}

export interface AIPlayerModelConfig {
  modelName: string;
  displayName: string;
  defaultEmotion: EmotionName;
  personality?: string;
  voiceStyle?: string;
}

const DEFAULT_EMOTION_MAP: Record<string, number> = {
  neutral: 0,
  anger: 2,
  disgust: 2,
  fear: 1,
  joy: 3,
  happy: 3,
  smirk: 3,
  sadness: 1,
  sad: 1,
  surprise: 3,
};

export const LIVE2D_MODEL_LIBRARY = [
  'haru',
  'hiyori',
  'mao_pro',
  'mark',
  'natori',
  'ren',
  'rice',
  'shizuku',
  'wanko',
] as const;

const PLAYER_RUNTIME_MANIFEST: Record<string, CompanionRuntimeManifest> = {
  AI_A: {
    id: 'AI_A',
    displayName: '小桃',
    runtimeType: 'live2d',
    assetId: 'haru',
    modelName: 'haru',
    defaultEmotion: 'neutral',
    supportedScenes: ['homepage', 'werewolf-room', 'replay'],
    personality: '活泼可爱，发言节奏快，适合带动场面。',
    voiceProfile: {
      style: 'cheerful',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
  AI_B: {
    id: 'AI_B',
    displayName: '静香',
    runtimeType: 'live2d',
    assetId: 'hiyori',
    modelName: 'hiyori',
    defaultEmotion: 'happy',
    supportedScenes: ['homepage', 'werewolf-room', 'jubensha-room'],
    personality: '温柔稳健，擅长情绪观察和角色陪伴。',
    voiceProfile: {
      style: 'gentle',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
  AI_C: {
    id: 'AI_C',
    displayName: '小黑',
    runtimeType: 'live2d',
    assetId: 'mark',
    modelName: 'mark',
    defaultEmotion: 'neutral',
    supportedScenes: ['werewolf-room', 'replay'],
    personality: '偏冷静分析型，适合逻辑推理和局势复盘。',
    voiceProfile: {
      style: 'calm',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
  AI_D: {
    id: 'AI_D',
    displayName: '木木',
    runtimeType: 'live2d',
    assetId: 'natori',
    modelName: 'natori',
    defaultEmotion: 'happy',
    supportedScenes: ['homepage', 'jubensha-room'],
    personality: '热情外放，擅长和玩家快速建立互动感。',
    voiceProfile: {
      style: 'energetic',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
  AI_E: {
    id: 'AI_E',
    displayName: '小白',
    runtimeType: 'live2d',
    assetId: 'rice',
    modelName: 'rice',
    defaultEmotion: 'fear',
    supportedScenes: ['werewolf-room', 'jubensha-room'],
    personality: '谨慎型陪玩，能在高压回合里保持稳定反馈。',
    voiceProfile: {
      style: 'soft',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
  AI_F: {
    id: 'AI_F',
    displayName: '雪',
    runtimeType: 'live2d',
    assetId: 'wanko',
    modelName: 'wanko',
    defaultEmotion: 'neutral',
    supportedScenes: ['homepage', 'werewolf-room', 'jubensha-room'],
    personality: '神秘安静，适合悬疑叙事和戏感较强的房间。',
    voiceProfile: {
      style: 'mysterious',
      provider: 'browser',
      locale: 'zh-CN',
    },
    animationProfile: {
      idle: 'idle',
      talking: 'talk',
      emotionMap: DEFAULT_EMOTION_MAP,
    },
  },
};

export const USER_COMPANION_RUNTIME: CompanionRuntimeManifest = {
  id: 'USER_COMPANION',
  displayName: '我的陪玩',
  runtimeType: 'live2d',
  assetId: 'ren',
  modelName: 'ren',
  defaultEmotion: 'happy',
  supportedScenes: ['homepage', 'play-hall', 'werewolf-room', 'jubensha-room', 'mc-future'],
  personality: '忠诚可靠，会根据游戏场景提供支持和陪伴。',
  voiceProfile: {
    style: 'friendly',
    provider: 'browser',
    locale: 'zh-CN',
  },
  animationProfile: {
    idle: 'idle',
    talking: 'talk',
    emotionMap: DEFAULT_EMOTION_MAP,
  },
};

export const AI_PLAYER_MODELS: Record<string, AIPlayerModelConfig> = Object.fromEntries(
  Object.entries(PLAYER_RUNTIME_MANIFEST).map(([playerId, manifest]) => [
    playerId,
    {
      modelName: manifest.modelName ?? manifest.assetId,
      displayName: manifest.displayName,
      defaultEmotion: manifest.defaultEmotion,
      personality: manifest.personality,
      voiceStyle: manifest.voiceProfile.style,
    },
  ]),
);

export const USER_COMPANION_MODEL: AIPlayerModelConfig = {
  modelName: USER_COMPANION_RUNTIME.modelName ?? USER_COMPANION_RUNTIME.assetId,
  displayName: USER_COMPANION_RUNTIME.displayName,
  defaultEmotion: USER_COMPANION_RUNTIME.defaultEmotion,
  personality: USER_COMPANION_RUNTIME.personality,
  voiceStyle: USER_COMPANION_RUNTIME.voiceProfile.style,
};

export function getPlayerModel(playerName: string): AIPlayerModelConfig | null {
  const runtime = PLAYER_RUNTIME_MANIFEST[playerName];
  if (!runtime) return null;

  return {
    modelName: runtime.modelName ?? runtime.assetId,
    displayName: runtime.displayName,
    defaultEmotion: runtime.defaultEmotion,
    personality: runtime.personality,
    voiceStyle: runtime.voiceProfile.style,
  };
}

export function getPlayerRuntimeManifest(playerName: string): CompanionRuntimeManifest | null {
  return PLAYER_RUNTIME_MANIFEST[playerName] ?? null;
}

export function getUserCompanionRuntimeManifest(): CompanionRuntimeManifest {
  return USER_COMPANION_RUNTIME;
}

export function resolveRuntimeManifest(playerName?: string, isUserCompanion = false): CompanionRuntimeManifest {
  if (isUserCompanion) return USER_COMPANION_RUNTIME;
  return (playerName && PLAYER_RUNTIME_MANIFEST[playerName]) || USER_COMPANION_RUNTIME;
}

export function getAvailableModels(): string[] {
  const models = new Set<string>();

  Object.values(PLAYER_RUNTIME_MANIFEST).forEach((manifest) => {
    if (manifest.modelName) {
      models.add(manifest.modelName);
    }
  });

  if (USER_COMPANION_RUNTIME.modelName) {
    models.add(USER_COMPANION_RUNTIME.modelName);
  }

  return Array.from(models);
}

export function getVoiceProfile(playerName?: string, isUserCompanion = false): VoiceProfile {
  return resolveRuntimeManifest(playerName, isUserCompanion).voiceProfile;
}

export function getEmotionPresetIndex(emotion: string, playerName?: string, isUserCompanion = false): number {
  const manifest = resolveRuntimeManifest(playerName, isUserCompanion);
  return manifest.animationProfile?.emotionMap?.[emotion] ?? DEFAULT_EMOTION_MAP[emotion] ?? 0;
}

export const EMOTION_MAP: Record<string, number> = DEFAULT_EMOTION_MAP;
