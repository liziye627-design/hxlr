/**
 * Minecraft 数字人服务模块
 * 统一导出所有服务和类型
 */

// 类型定义
export type {
  UnifiedAgentProfile,
  ModelConfig,
  ConversationExample,
  FiguraAvatarConfig,
  BehaviorConfig,
  MemoryConfig,
  Task,
  TaskType,
  TaskStatus,
  AgentRuntimeStatus,
  MinecraftWorldState,
  MindcraftBridgeConfig,
  AgentMode,
  AgentType,
} from './types';

// 服务类
export { MindcraftBridge, getMindcraftBridge } from './MindcraftBridge';
export { FiguraIntegration, getFiguraIntegration } from './FiguraIntegration';
export {
  MinecraftDigitalHumanService,
  getDigitalHumanService,
  initializeDigitalHumanService,
} from './DigitalHumanService';

// 角色配置转换
export {
  convertToUnifiedProfile,
  convertAllProfiles,
  getMinecraftCapableProfiles,
  filterByBehavior,
  getRecommendedTasks,
} from './profileConverter';

// 服务配置类型
export type {
  DigitalHumanServiceConfig,
  ServiceStatus,
  AgentStartResult,
} from './DigitalHumanService';