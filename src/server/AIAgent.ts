/**
 * AI Agent 系统
 * 集成OpenAI函数调用，让AI使用工具执行游戏动作
 */

import type { RoomPlayer, RoomState, NightAction } from './types.js';
import type { AIPersona } from './AIPersonaSystem.js';
import { getRoleTools, getToolsForPhase, type RoleTool } from './AIAgentTools.js';
import { ROLE_PROMPTS, BASE_CONFIGURATION } from './ai/RolePrompts.js';

export interface GameContext {
  myPlayer: RoomPlayer;
  allPlayers: RoomPlayer[];
  phase: string;
  round: number;
  gameLog: any[];
}

export class AIAgent {
  private player: RoomPlayer;
  private persona: AIPersona;
  private gameState: RoomState;
  private apiKey: string;

  constructor(player: RoomPlayer, persona: AIPersona, gameState: RoomState) {
    this.player = player;
    this.persona = persona;
    this.gameState = gameState;
    // 从环境变量获取API密钥
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
  }

  /**
   * 更新游戏状态
   */
  updateGameState(gameState: RoomState) {
    this.gameState = gameState;
  }

  /**
   * 生成系统提示词
   */
  private getSystemPrompt(): string {
    const role = this.player.role || 'villager';
    const { name, description, attributes, strategy } = this.persona;

    // 获取角色专属提示词，如果未定义则使用村民提示词
    const rolePrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS['villager'];

    // 获取AI人格提示词
    const personaPrompt = this.persona.systemPrompt || '';

    return `
${BASE_CONFIGURATION}

${rolePrompt}

${personaPrompt}

**【你的个性配置】**
你现在的名字是: "${name}"
性格描述: ${description}
策略倾向: ${this.getStrategyDescription(strategy)}

**【你的属性】**
- 逻辑能力: ${attributes.logic}%
- 说服力: ${attributes.persuasion}%
- 激发能力: ${attributes.excitement}%
- 共情力: ${attributes.empathy}%

请严格遵守上述角色设定和思维链协议。在做出任何行动（使用工具）之前，请先在内心进行思考。
`;
  }

  /**
   * 生成游戏上下文
   */
  private getGameContext(): GameContext {
    // 这里可以扩展更多上下文信息，例如历史发言摘要等
    return {
      myPlayer: this.player,
      allPlayers: this.gameState.players,
      phase: this.gameState.phase,
      round: this.gameState.currentRound,
      gameLog: this.gameState.gameLog,
    };
  }

  /**
   * 使用DeepSeek进行决策
   */
  async makeDecision(): Promise<any> {
    const apiKey = this.apiKey;
    const apiUrl =
      process.env.VITE_DEEPSEEK_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
    const model = process.env.VITE_DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3';

    if (!apiKey) {
      console.warn('No DeepSeek API key provided, AI will make random decision');
      return this.makeRandomDecision();
    }

    const role = this.player.role || 'villager';
    const phase = this.gameState.phase;
    const tools = getToolsForPhase(role, phase);

    if (tools.length === 0) {
      return null;
    }

    try {
      // 转换为DeepSeek函数格式
      const functions = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      const context = this.getGameContext();
      const contextMessage = this.formatContext(context);

      // 调用DeepSeek API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: contextMessage },
          ],
          tools: functions,
          tool_choice: 'auto',
        }),
      });

      const data: any = await response.json();
      const message = data.choices?.[0]?.message;

      // 记录思维链 (CoT)
      if (message?.content) {
        console.log(`[AI CoT] ${this.player.name} (${this.player.role}):\n${message.content}`);
      }

      const toolCall = message?.tool_calls?.[0];

      if (toolCall) {
        return {
          function: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        };
      }
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.makeRandomDecision();
    }

    return null;
  }

  /**
   * 格式化游戏上下文为消息
   */
  private formatContext(context: GameContext): string {
    const { phase, round, allPlayers, gameLog } = context;

    const alivePlayers = allPlayers.filter((p) => p.is_alive);
    const playerList = alivePlayers
      .map((p) => `- ${p.position}号 ${p.name} (ID: ${p.id})${p.id === this.player.id ? ' (你)' : ''}`)
      .join('\n');

    const deadPlayers = allPlayers.filter((p) => !p.is_alive);
    const deadList = deadPlayers.length > 0
      ? deadPlayers.map(p => `- ${p.position}号 ${p.name}`).join('\n')
      : '无';

    // 简要获取最近的游戏事件
    const recentLogs = gameLog.slice(-5).map(log => `[${log.phase}] ${log.event}`).join('\n');

    // 获取角色专属信息
    const roleSpecificInfo = this.getRoleSpecificInfo();

    return `
**【当前游戏状态】**
回合: 第 ${round} 天
阶段: ${this.getPhaseText(phase)}

**【你的角色信息】**
${roleSpecificInfo}

**【存活玩家】**
${playerList}

**【死亡玩家】**
${deadList}

**【最近事件】**
${recentLogs}

请根据你的角色身份和当前局势，进行 [内心OS] 分析，然后选择合适的工具进行行动。
如果是白天发言阶段，请使用 discuss 工具，并在 message 参数中输出你的 [公开具体发言]。
`;
  }

  /**
   * 获取角色专属信息（记忆）
   */
  private getRoleSpecificInfo(): string {
    const role = this.player.role;
    const myId = this.player.id;
    let info = '';

    if (role === 'seer') {
      // 查找查验历史
      const checks = this.gameState.nightActions
        .filter(a => a.playerId === myId && a.actionType === 'check')
        .map(a => {
          const target = this.gameState.players.find(p => p.id === a.targetId);
          const isWolf = target?.role === 'werewolf';
          return `- 第${this.gameState.currentRound}夜查验了 ${target?.position}号(${target?.name})，结果是: ${isWolf ? '狼人' : '好人'}`;
        })
        .join('\n');
      info = checks ? `你的查验历史:\n${checks}` : '你还没有查验过任何人。';
    } else if (role === 'guard') {
      // 查找守护历史
      const protects = this.gameState.nightActions
        .filter(a => a.playerId === myId && a.actionType === 'protect')
        .map(a => {
          const target = this.gameState.players.find(p => p.id === a.targetId);
          return `- 第${this.gameState.currentRound}夜守护了 ${target?.position}号(${target?.name})`;
        })
        .join('\n');
      info = protects ? `你的守护历史:\n${protects}` : '你还没有守护过任何人。';
    } else if (role === 'witch') {
      const { antidote, poison } = this.gameState.witchPotions;
      info = `你的药剂状态:\n- 解药: ${antidote ? '可用' : '已用'}\n- 毒药: ${poison ? '可用' : '已用'}`;
    } else if (role === 'werewolf') {
      const teammates = this.gameState.players
        .filter(p => p.role === 'werewolf' && p.id !== myId)
        .map(p => `${p.position}号(${p.name})`)
        .join(', ');
      info = `你的狼队友: ${teammates || '无 (你是孤狼)'}`;
    }

    return info;
  }

  /**
   * 随机决策（降级方案）
   */
  private makeRandomDecision(): any {
    const role = this.player.role || 'villager';
    const phase = this.gameState.phase;
    const alivePlayers = this.gameState.players.filter(
      (p) => p.is_alive && p.id !== this.player.id,
    );

    if (alivePlayers.length === 0) return null;

    const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

    if (phase === 'NIGHT') {
      if (role === 'werewolf') {
        return { function: 'kill_player', arguments: { targetId: randomTarget.id } };
      } else if (role === 'seer') {
        return { function: 'check_identity', arguments: { targetId: randomTarget.id } };
      } else if (role === 'guard') {
        return { function: 'protect_player', arguments: { targetId: randomTarget.id } };
      }
    } else if (phase === 'DAY_VOTE') {
      return { function: 'vote_player', arguments: { targetId: randomTarget.id } };
    }

    return null;
  }

  // 辅助方法
  private getRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      werewolf: '狼人',
      villager: '村民',
      seer: '预言家',
      witch: '女巫',
      hunter: '猎人',
      guard: '守卫',
    };
    return roleMap[role] || role;
  }

  private getStrategyDescription(strategy: string): string {
    const strategyMap: Record<string, string> = {
      analytical: '分析型 - 注重逻辑推理',
      passive: '被动型 - 观望为主',
      aggressive: '激进型 - 主动带节奏',
      defensive: '防守型 - 谨慎保守',
      balanced: '平衡型 - 综合策略',
      deceptive: '欺骗型 - 善于误导',
      chaos: '混乱型 - 不可预测',
      emotional: '情绪型 - 易受情绪影响',
    };
    return strategyMap[strategy] || strategy;
  }

  private getGoalDescription(role: string): string {
    if (role === 'werewolf') {
      return '作为狼人，你的目标是杀掉所有好人，同时隐藏身份不被发现。';
    }
    return '作为好人阵营，你的目标是找出并驱逐所有狼人。';
  }

  private getPhaseText(phase: string): string {
    const phaseMap: Record<string, string> = {
      WAITING: '等待中',
      NIGHT: '夜晚',
      DAY_RESULT: '天亮了',
      DAY_DISCUSS: '白天讨论',
      DAY_VOTE: '投票阶段',
      HUNTER_SHOOT: '猎人开枪',
      BADGE_TRANSFER: '移交警徽',
      GAME_OVER: '游戏结束',
    };
    return phaseMap[phase] || phase;
  }
}
