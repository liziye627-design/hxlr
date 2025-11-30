/**
 * AI Agent 工具系统
 * 定义每个角色可用的工具（函数）
 * 
 * 重构说明：
 * 1. 修复猎人技能触发时机问题，支持 HUNTER_SHOOT 阶段
 * 2. 添加狼人白天自爆能力
 * 3. 改进 getToolsForPhase 逻辑，支持更复杂的场景
 * 4. 优化女巫解药参数说明
 */

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface RoleTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

/**
 * 狼人工具
 */
export const WEREWOLF_TOOLS: RoleTool[] = [
  {
    name: 'kill_player',
    description: '【夜晚】选择击杀一名玩家。狼人每晚可以集体决定杀害一名非狼人玩家。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '目标玩家的ID',
        },
      },
      required: ['targetId'],
    },
  },
  {
    name: 'werewolf_chat',
    description: '【夜晚】与其他狼人私聊交流。这个聊天其他玩家看不到。',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '要发送的消息内容',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'self_destruct',
    description: '【白天讨论】狼人自爆，立即结束白天发言并进入黑夜。使用此技能将暴露狼人身份，但可以保护其他狼队友或打乱节奏。',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * 预言家工具
 */
export const SEER_TOOLS: RoleTool[] = [
  {
    name: 'check_identity',
    description: '【夜晚】查验一名玩家的身份，判断其是好人还是狼人。每晚只能查验一人。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '要查验的玩家ID',
        },
      },
      required: ['targetId'],
    },
  },
];

/**
 * 女巫工具
 */
export const WITCH_TOOLS: RoleTool[] = [
  {
    name: 'use_antidote',
    description: '【夜晚】使用解药救活被狼人杀害的玩家。解药只能使用一次。注意：targetId 必须是当晚被狼人击杀的玩家ID，后端会验证。如果当晚无人被杀，使用解药无效。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '被杀害的玩家ID（必须是当晚被狼人击杀的玩家）',
        },
      },
      required: ['targetId'],
    },
  },
  {
    name: 'use_poison',
    description: '【夜晚】使用毒药杀死一名玩家。毒药只能使用一次。被毒死的玩家无法发动死亡技能（如猎人开枪）。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '要毒杀的玩家ID',
        },
      },
      required: ['targetId'],
    },
  },
  {
    name: 'skip_witch_turn',
    description: '【夜晚】跳过女巫的回合，不使用任何药水。如果不想救人也不想毒人，使用此工具。',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * 守卫工具
 */
export const GUARD_TOOLS: RoleTool[] = [
  {
    name: 'protect_player',
    description: '【夜晚】保护一名玩家，使其在当晚免受狼人攻击。不能连续两晚保护同一人（同守规则）。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '要保护的玩家ID',
        },
      },
      required: ['targetId'],
    },
  },
];

/**
 * 猎人工具
 */
export const HUNTER_TOOLS: RoleTool[] = [
  {
    name: 'shoot_player',
    description: '【死亡时】猎人死亡时可以开枪带走一名玩家。注意：被女巫毒死无法开枪。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '要射杀的玩家ID',
        },
      },
      required: ['targetId'],
    },
  },
];

/**
 * 所有角色都可用的公共工具（白天讨论和投票）
 */
export const COMMON_TOOLS: RoleTool[] = [
  {
    name: 'discuss',
    description: '【白天讨论】在白天讨论阶段发言，表达观点和推理。',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '发言内容',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'vote_player',
    description: '【投票阶段】投票驱逐一名玩家。',
    parameters: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: '要投票的玩家ID',
        },
      },
      required: ['targetId'],
    },
  },
];

/**
 * 获取角色对应的所有工具（包含通用能力）
 * 数据模型层面保持完整性
 */
export function getRoleTools(role: string): RoleTool[] {
  let specialTools: RoleTool[] = [];

  switch (role) {
    case 'werewolf':
      specialTools = WEREWOLF_TOOLS;
      break;
    case 'seer':
      specialTools = SEER_TOOLS;
      break;
    case 'witch':
      specialTools = WITCH_TOOLS;
      break;
    case 'guard':
      specialTools = GUARD_TOOLS;
      break;
    case 'hunter':
      specialTools = HUNTER_TOOLS;
      break;
    case 'villager':
    default:
      specialTools = [];
      break;
  }

  // 所有角色都拥有通用能力（发言、投票）
  return [...specialTools, ...COMMON_TOOLS];
}

/**
 * 获取角色在特定阶段可用的工具
 * 改进的逻辑：支持更复杂的场景和特殊阶段
 */
export function getToolsForPhase(role: string, phase: string): RoleTool[] {
  const allRoleTools = getRoleTools(role);
  let allowedTools: RoleTool[] = [];

  // 特殊阶段：猎人开枪
  if (phase === 'HUNTER_SHOOT') {
    if (role === 'hunter') {
      return HUNTER_TOOLS;
    }
    return []; // 非猎人在此阶段无工具
  }

  // 夜晚阶段
  if (phase === 'NIGHT') {
    // 夜晚：使用角色特殊技能，过滤掉白天的工具
    allowedTools = allRoleTools.filter(
      (tool) => !['discuss', 'vote_player', 'self_destruct'].includes(tool.name)
    );
  }
  // 白天讨论阶段
  else if (phase === 'DAY_DISCUSS') {
    // 所有人可以发言
    const discussTool = COMMON_TOOLS.find((t) => t.name === 'discuss');
    if (discussTool) {
      allowedTools.push(discussTool);
    }

    // 狼人可以自爆
    if (role === 'werewolf') {
      const selfDestructTool = WEREWOLF_TOOLS.find((t) => t.name === 'self_destruct');
      if (selfDestructTool) {
        allowedTools.push(selfDestructTool);
      }
    }

    // 未来扩展：骑士等白天技能可在此添加
  }
  // 投票阶段
  else if (phase === 'DAY_VOTE') {
    // 所有人只能投票
    const voteTool = COMMON_TOOLS.find((t) => t.name === 'vote_player');
    if (voteTool) {
      allowedTools.push(voteTool);
    }
  }
  // 其他阶段（如 BADGE_TRANSFER 等）
  else {
    // 返回空数组，表示此阶段无可用工具
    allowedTools = [];
  }

  return allowedTools;
}
