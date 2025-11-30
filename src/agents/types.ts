import { BaseMessage } from '@langchain/core/messages';
import { WerewolfPersona, WerewolfPlayer } from '@/types';

export type RoleType = 'werewolf' | 'villager' | 'seer' | 'witch' | 'hunter' | 'guard';

// 1. 更细粒度的阶段定义
export type GamePhase =
  | 'night_action'   // 夜晚行动
  | 'day_speech'     // 白天发言
  | 'day_vote'       // 白天投票
  | 'game_over';     // 游戏结束

// 2. 角色私有状态 (解决"失忆"问题)
export interface RoleSpecificState {
  // 女巫专用
  witchPotions?: {
    hasAntidote: boolean;
    hasPoison: boolean;
  };
  // 预言家专用
  seerCheckHistory?: Array<{ targetId: string; targetName: string; isWerewolf: boolean; round: number }>;
  // 守卫专用
  lastProtectedId?: string | null;
}

// 3. 游戏上下文 (Agent 视角)
export interface GameContext {
  round: number;
  phase: GamePhase;
  // 这里的 players 应该经过过滤，不包含未公开的身份信息
  players: WerewolfPlayer[];
  history: BaseMessage[];
  alivePlayers: WerewolfPlayer[];

  // 新增：当前 Agent 的私有状态
  myRoleState?: RoleSpecificState;

  // 新增：当前可用的行动 (限制 AI 不要乱动)
  availableActions: ActionType[];
}

export interface AgentState {
  messages: BaseMessage[];
  context: GameContext;
  myRole: RoleType;
  myPersona: WerewolfPersona;
  // 建议定义具体的意图对象，而不是 string[]
  strategicIntent: StrategicIntent | null;
  intendedAction: AgentAction | null;
}

// 定义战略意图
export interface StrategicIntent {
  action: ActionType;
  targetId?: string;
  content?: string;
  reasoning: string;
  skillParams?: any;
}

export type ActionType = 'speak' | 'vote' | 'skill' | 'pass';

// 4. 使用 Discriminated Unions 增强类型安全
export type AgentAction =
  | { type: 'speak'; content: string }              // 发言必须有内容
  | { type: 'vote'; targetId: string }              // 投票必须有目标
  | { type: 'skill'; targetId?: string; skillParams?: any } // 技能参数可选
  | { type: 'pass' };                               // 过，无参数

export interface IAgent {
  id: string;
  name: string;
  role: RoleType;

  processTurn(context: GameContext): Promise<AgentAction>;

  // receiveMessage 可能不是必须的，因为 context.history 里通常包含了历史消息
  // 如果是为了流式接收 Socket 消息可以保留
  receiveMessage(message: BaseMessage): void;
}
