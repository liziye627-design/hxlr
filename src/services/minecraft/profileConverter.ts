/**
 * 角色配置转换工具
 * 将 AgentShowcaseEntry 转换为 UnifiedAgentProfile
 */

import { AGENT_SHOWROOM, type AgentShowcaseEntry } from '@/config/agentRoster';
import type {
  UnifiedAgentProfile,
  ModelConfig,
  ConversationExample,
  BehaviorConfig,
} from '@/services/minecraft';

/**
 * 默认 LLM 配置
 */
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  api: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  params: {
    temperature: 0.7,
    max_tokens: 4096,
  },
};

const DEFAULT_EMBEDDING_CONFIG: ModelConfig = {
  api: 'openai',
  model: 'text-embedding-3-small',
};

/**
 * 角色行为配置映射
 */
const BEHAVIOR_CONFIGS: Record<string, BehaviorConfig> = {
  haru: {
    canMine: true,
    canBuild: true,
    canFight: true,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['mine', 'fight', 'explore'],
  },
  hiyori: {
    canMine: true,
    canBuild: true,
    canFight: false,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['explore', 'collect'],
  },
  'mao-pro': {
    canMine: true,
    canBuild: false,
    canFight: true,
    canFollow: true,
    canExplore: false,
    preferredTasks: ['fight', 'mine'],
  },
  mark: {
    canMine: true,
    canBuild: true,
    canFight: false,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['collect', 'explore'],
  },
  natori: {
    canMine: true,
    canBuild: true,
    canFight: false,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['explore', 'collect'],
  },
  ren: {
    canMine: true,
    canBuild: true,
    canFight: true,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['mine', 'build', 'explore', 'collect'],
  },
  rice: {
    canMine: true,
    canBuild: true,
    canFight: false,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['collect', 'mine'],
  },
  shizuku: {
    canMine: true,
    canBuild: true,
    canFight: false,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['explore', 'build'],
  },
  wanko: {
    canMine: true,
    canBuild: false,
    canFight: true,
    canFollow: true,
    canExplore: true,
    preferredTasks: ['fight', 'explore'],
  },
};

/**
 * 角色人格提示词映射
 */
const PERSONALITY_PROMPTS: Record<string, string> = {
  haru: `你是 Haru，一个冷静果断的开局指挥官。
你的特点是：
- 反应迅速，擅长把控游戏节奏
- 言辞犀利，不拖泥带水
- 总是能在关键时刻做出决策

在 Minecraft 中：
- 你熟悉各种游戏机制和策略
- 擅长快速收集资源和建立基地
- 能够带领团队高效完成任务

你的语气：
- 直接、专业、高效
- 不喜欢废话，说话简洁有力
- 在关键时刻会变得严肃`,

  hiyori: `你是 Hiyori，一个温柔细腻的分析师。
你的特点是：
- 善于察言观色，能感知玩家情绪
- 温柔体贴，是最好的倾听者
- 擅长分析局势，给出温和的建议

在 Minecraft 中：
- 你喜欢慢慢探索世界
- 擅长发现隐藏的资源和地点
- 总是提醒玩家注意安全

你的语气：
- 温柔、亲切、有耐心
- 喜欢用关心的语气说话
- 会主动询问玩家的感受`,

  'mao-pro': `你是 Mao Pro，一个追求胜利的终局收口专家。
你的特点是：
- 关键时刻爆发力惊人
- 专注胜利，目标明确
- 在压力下表现更出色

在 Minecraft 中：
- 擅长 Boss 战和危险任务
- 精通战斗技巧和策略
- 总是准备好最好的装备

你的语气：
- 自信、直接、有时略带傲气
- 不喜欢半途而废
- 在战斗时会变得严肃专注`,

  mark: `你是 Mark，一个理性分析的数据专家。
你的特点是：
- 善于从复杂信息中抽丝剥茧
- 逻辑清晰，分析透彻
- 是最佳的第二判断者

在 Minecraft 中：
- 你熟悉所有配方和机制
- 擅长优化流程和资源管理
- 总是用数据支持你的建议

你的语气：
- 理性、专业、有逻辑
- 喜欢用事实和数据说话
- 有时会显得有点学术`,

  natori: `你是 Natori，一个亲和力强的温暖伙伴。
你的特点是：
- 善于破冰，让人感到轻松
- 亲和力强，很容易建立友谊
- 总是能活跃气氛

在 Minecraft 中：
- 你喜欢和玩家一起探索
- 擅长发现有趣的地方和事件
- 总是鼓励玩家尝试新事物

你的语气：
- 温暖、轻松、亲切
- 喜欢用轻松的语气聊天
- 会主动关心玩家的感受`,

  ren: `你是 Ren，一个可靠的全能型陪玩伙伴。
你的特点是：
- 可靠、稳定、值得信赖
- 擅长聊天、推理游戏和冒险
- 总是能在关键时刻给出有用的建议

在 Minecraft 中：
- 你熟悉所有游戏机制
- 能够适应各种游戏风格
- 总是准备好帮助玩家

你的语气：
- 温和、可靠、专业
- 喜欢用轻松但专业的语气交流
- 会主动提供帮助和建议`,

  rice: `你是 Rice，一个细心严谨的线索整理师。
你的特点是：
- 记忆力出众，不会遗漏细节
- 细心严谨，做事有条理
- 擅长整理和分析信息

在 Minecraft 中：
- 你熟悉所有物品和配方
- 擅长资源管理和整理
- 总是知道玩家需要什么

你的语气：
- 认真、细心、有条理
- 喜欢用清晰的逻辑解释
- 会主动提醒重要信息`,

  shizuku: `你是 Shizuku，一个戏剧张力十足的角色演绎者。
你的特点是：
- 擅长角色代入和情感表达
- 戏剧张力十足
- 能创造沉浸式体验

在 Minecraft 中：
- 你喜欢为游戏增添故事性
- 擅长创造有趣的场景和剧情
- 总是让冒险变得更加有趣

你的语气：
- 戏剧化、有魅力、有感染力
- 喜欢用故事化的方式说话
- 会为游戏增添气氛`,

  wanko: `你是 Wanko，一个热情洋溢的热场担当。
你的特点是：
- 热情洋溢，能量满满
- 擅长调动气氛
- 永远不会让场面冷场

在 Minecraft 中：
- 你喜欢快速的冒险和战斗
- 擅长应对紧急情况
- 总是第一个冲上去

你的语气：
- 热情、活泼、充满活力
- 喜欢用感叹号和热情的表达
- 会用行动感染玩家`,
};

/**
 * 将 AgentShowcaseEntry 转换为 UnifiedAgentProfile
 */
export function convertToUnifiedProfile(entry: AgentShowcaseEntry): UnifiedAgentProfile {
  const examples: ConversationExample[] = [];

  // 从 openingLine 创建示例
  if (entry.openingLine) {
    examples.push({
      role: 'assistant',
      content: entry.openingLine,
    });
  }

  // 添加更多示例
  examples.push(
    {
      role: 'user',
      content: '我们来建个房子吧',
    },
    {
      role: 'assistant',
      content: `好的，我来帮你建一个！你想要什么样的房子？木质小屋还是石头城堡？`,
    }
  );

  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    title: entry.title,
    tagline: entry.tagline,
    description: entry.description,
    previewImage: entry.previewImage,
    type: entry.type,
    modes: entry.modes,
    traits: entry.traits,
    strengths: entry.strengths,
    weakness: entry.weakness,
    openingLine: entry.openingLine,

    // LLM 配置
    model: DEFAULT_MODEL_CONFIG,
    code_model: DEFAULT_MODEL_CONFIG,
    vision_model: DEFAULT_MODEL_CONFIG,
    embedding: DEFAULT_EMBEDDING_CONFIG,

    // 人格设定
    personality: PERSONALITY_PROMPTS[entry.id] || `你是 ${entry.name}，一个${entry.tagline}`,
    examples,

    // 行为配置
    behaviors: BEHAVIOR_CONFIGS[entry.id] || {
      canMine: true,
      canBuild: true,
      canFight: true,
      canFollow: true,
      canExplore: true,
      preferredTasks: ['explore', 'collect'],
    },

    // 记忆配置
    memory: {
      maxHistoryTurns: 50,
      embeddingModel: 'text-embedding-3-small',
      longTermMemory: true,
      retrievalCount: 5,
    },

    // 评分种子
    scoreSeed: entry.scoreSeed,
  };
}

/**
 * 批量转换所有角色
 */
export function convertAllProfiles(): UnifiedAgentProfile[] {
  return AGENT_SHOWROOM.map(convertToUnifiedProfile);
}

/**
 * 获取支持 MC 模式的角色
 */
export function getMinecraftCapableProfiles(): UnifiedAgentProfile[] {
  return AGENT_SHOWROOM.filter((entry) => entry.modes.includes('mc')).map(convertToUnifiedProfile);
}

/**
 * 根据行为能力筛选角色
 */
export function filterByBehavior(
  profiles: UnifiedAgentProfile[],
  requiredCapabilities: Partial<BehaviorConfig>
): UnifiedAgentProfile[] {
  return profiles.filter((profile) => {
    const behaviors = profile.behaviors;
    if (!behaviors) return false;

    for (const [key, value] of Object.entries(requiredCapabilities)) {
      if (behaviors[key as keyof BehaviorConfig] !== value) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 获取角色推荐任务
 */
export function getRecommendedTasks(profileId: string): string[] {
  const behaviors = BEHAVIOR_CONFIGS[profileId];
  return behaviors?.preferredTasks || ['explore'];
}