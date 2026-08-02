/**
 * 统一 Profile 类型定义
 * 融合 Mindcraft Profile + 本系统 AgentShowcaseEntry + Figura 外观配置
 */

export type AgentMode = 'chat' | 'werewolf' | 'script_murder' | 'mc';
export type AgentType = 'alpha' | 'aqua' | 'shadow' | 'rookie';
export type TaskType = 'mine' | 'build' | 'fight' | 'follow' | 'collect' | 'explore';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * LLM 模型配置 - 来自 Mindcraft
 */
export interface ModelConfig {
  /** API 提供商: openai, anthropic, google, ollama, deepseek 等 */
  api: string;
  /** 模型名称 */
  model: string;
  /** 自定义 API URL (可选) */
  url?: string;
  /** 模型参数 */
  params?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    [key: string]: unknown;
  };
}

/**
 * 对话示例
 */
export interface ConversationExample {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Figura 外观配置
 */
export interface FiguraAvatarConfig {
  /** Blockbench 模型文件路径 */
  modelPath: string;
  /** 主纹理文件路径 */
  texturePath: string;
  /** 自发光纹理路径 (可选) */
  emissiveTexturePath?: string;
  /** Lua 脚本路径 (可选) */
  scriptPath?: string;
  /** 动画配置 */
  animations?: {
    idle?: string;
    walk?: string;
    run?: string;
    crouch?: string;
    [key: string]: string | undefined;
  };
}

/**
 * 行为能力配置 - 来自 PlayerEngine 概念
 */
export interface BehaviorConfig {
  /** 能否挖掘 */
  canMine: boolean;
  /** 能否建造 */
  canBuild: boolean;
  /** 能否战斗 */
  canFight: boolean;
  /** 能否跟随 */
  canFollow: boolean;
  /** 能否探索 */
  canExplore: boolean;
  /** 优先任务类型 */
  preferredTasks: TaskType[];
}

/**
 * 记忆系统配置
 */
export interface MemoryConfig {
  /** 最大历史对话轮数 */
  maxHistoryTurns: number;
  /** Embedding 模型 */
  embeddingModel: string;
  /** 是否启用长期记忆 */
  longTermMemory: boolean;
  /** 记忆检索数量 */
  retrievalCount?: number;
}

/**
 * 统一 Agent Profile
 * 融合所有系统的配置
 */
export interface UnifiedAgentProfile {
  // ========== 基础信息 (来自本系统) ==========
  /** 唯一标识符 */
  id: string;
  /** URL 友好的标识符 */
  slug: string;
  /** 显示名称 */
  name: string;
  /** 角色头衔 */
  title: string;
  /** 一句话介绍 */
  tagline: string;
  /** 详细描述 */
  description: string;
  /** 预览图片路径 */
  previewImage: string;

  // ========== 分类 ==========
  /** 角色类型 */
  type: AgentType;
  /** 支持的游戏模式 */
  modes: AgentMode[];
  /** 特质标签 */
  traits: string[];
  /** 擅长领域 */
  strengths: string[];
  /** 弱点 */
  weakness: string;

  // ========== LLM 配置 (来自 Mindcraft) ==========
  /** 主对话模型 */
  model: ModelConfig;
  /** 代码生成模型 (可选) */
  code_model?: ModelConfig;
  /** 视觉模型 (可选) */
  vision_model?: ModelConfig;
  /** Embedding 模型 */
  embedding?: ModelConfig;
  /** 语音合成模型 */
  speak_model?: string;

  // ========== 角色设定 ==========
  /** 系统提示词/人格设定 */
  personality: string;
  /** 对话示例 */
  examples: ConversationExample[];
  /** 开场白 */
  openingLine: string;

  // ========== 外观配置 (来自 Figura) ==========
  /** Figura 外观配置 (可选) */
  figura?: FiguraAvatarConfig;

  // ========== 行为配置 (来自 PlayerEngine) ==========
  /** 行为能力 */
  behaviors?: BehaviorConfig;

  // ========== 记忆配置 ==========
  /** 记忆系统配置 */
  memory?: MemoryConfig;

  // ========== 评分种子 (来自本系统) ==========
  scoreSeed: {
    chemistry: number;
    deduction: number;
    clutch: number;
    ambience: number;
  };
}

/**
 * 任务定义
 */
export interface Task {
  id: string;
  type: TaskType;
  target?: string;
  quantity?: number;
  position?: { x: number; y: number; z: number };
  priority: number;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * Agent 运行时状态
 */
export interface AgentRuntimeStatus {
  profileId: string;
  isActive: boolean;
  connectedToMinecraft: boolean;
  currentTask: Task | null;
  lastActivity: string;
  messageCount: number;
  error?: string;
}

/**
 * Mindcraft 桥接配置
 */
export interface MindcraftBridgeConfig {
  mindcraftRoot: string;
  serverHost: string;
  serverPort: number;
  minecraftVersion: string;
}

/**
 * Minecraft 世界状态
 */
export interface MinecraftWorldState {
  /** Bot 位置 */
  position: { x: number; y: number; z: number };
  /** 游戏模式 */
  gameMode: 'survival' | 'creative' | 'adventure' | 'spectator';
  /** 生命值 */
  health: number;
  /** 饥饿值 */
  hunger: number;
  /** 时间 */
  time: 'day' | 'night' | 'dawn' | 'dusk';
  /** 附近玩家 */
  nearbyPlayers: string[];
  /** 附近实体 */
  nearbyEntities: Array<{ type: string; name?: string; position: { x: number; y: number; z: number } }>;
  /** 天气 */
  weather: 'clear' | 'rain' | 'thunder';
  /** 维度 */
  dimension: 'overworld' | 'nether' | 'end';
}