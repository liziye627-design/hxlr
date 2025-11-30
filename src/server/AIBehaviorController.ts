import type { RoomState, RoomPlayer, NightAction, GamePhase } from './types.js';
import type { AIPersona } from './AIPersonaSystem.js';

/**
 * AI行为控制器 - 重构版
 * 
 * 修复内容：
 * 1. 移除"上帝视角"作弊 - AI不能直接读取其他玩家的 role
 * 2. 守卫可以自守
 * 3. 女巫可以获取被刀信息
 * 4. 为未来整合 CoT 引擎预留接口
 * 
 * 注意：这是一个 Fallback 逻辑，用于在 LLM API 失败或不可用时使用
 */

// 夜晚操作上下文
export interface NightOpsContext {
  nightKillTargetId?: string | null; // 今晚狼人刀的人（仅女巫可见）
  lastProtectTargetId?: string | null; // 守卫昨晚守的人（用于判断同守）
  suspicionScores?: Map<string, number>; // 可选：从 CoT 引擎传入的怀疑度分数
}

// 游戏上下文（AI决策用）
interface GameContext {
  alivePlayers: RoomPlayer[];
  deadPlayers: RoomPlayer[];
  myRole: string;
  phase: GamePhase;
  currentRound: number;
}

// AI行为控制器
export class AIBehaviorController {
  private player: RoomPlayer;
  private persona: AIPersona;
  private gameState: RoomState;

  constructor(player: RoomPlayer, persona: AIPersona, gameState: RoomState) {
    this.player = player;
    this.persona = persona;
    this.gameState = gameState;
  }

  // 更新游戏状态
  updateGameState(gameState: RoomState): void {
    this.gameState = gameState;
  }

  // 夜晚行动决策（修正版：接收上下文）
  async makeNightAction(context: NightOpsContext = {}): Promise<NightAction | null> {
    if (!this.player.role || !this.player.is_alive) return null;

    const role = this.player.role;

    switch (role) {
      case 'werewolf':
        return this.decideKillTarget(context.suspicionScores);
      case 'seer':
        return this.decideCheckTarget(context.suspicionScores);
      case 'witch':
        return this.decidePotionAction(context.nightKillTargetId, context.suspicionScores);
      case 'guard':
        return this.decideProtectTarget(context.lastProtectTargetId);
      default:
        return null;
    }
  }

  /**
   * 狼人选择杀人目标
   * 修正：移除对 p.role 的直接读取
   */
  private decideKillTarget(suspicionScores?: Map<string, number>): NightAction | null {
    const targets = this.getAliveNonWerewolves();
    if (targets.length === 0) return null;

    let targetId: string;

    // 策略1：如果有 CoT 引擎提供的怀疑度，优先刀威胁最大的好人
    if (suspicionScores && suspicionScores.size > 0) {
      // 选择怀疑度最低的（最像好人神职）
      const sorted = targets
        .map((p) => ({ player: p, score: suspicionScores.get(p.id) || 50 }))
        .sort((a, b) => a.score - b.score); // 怀疑度低 = 更像好人
      targetId = sorted[0].player.id;
    }
    // 策略2：基于"公开声明的身份"（从 speechHistory 中提取）
    // TODO: 未来可以分析玩家发言，识别谁声称是预言家/女巫
    // 目前作为 Fallback，只能随机选择
    else {
      const strategy = this.persona.strategy;
      if (strategy === 'analytical') {
        // 逻辑型：尝试找到"发言次数最多"的人（可能是活跃神职）
        const mostActive = targets.sort(
          (a, b) => (b.speechHistory?.length || 0) - (a.speechHistory?.length || 0),
        )[0];
        targetId = mostActive.id;
      } else {
        // 其他：随机
        targetId = this.selectRandom(targets).id;
      }
    }

    return {
      playerId: this.player.id,
      role: 'werewolf',
      actionType: 'kill',
      targetId,
    };
  }

  /**
   * 预言家选择查验目标
   * 修正：可以基于 suspicionScores 或发言情况
   */
  private decideCheckTarget(suspicionScores?: Map<string, number>): NightAction | null {
    const targets = this.getAliveOtherPlayers();
    if (targets.length === 0) return null;

    let targetId: string;

    // 如果有怀疑度数据，查验最可疑的人
    if (suspicionScores && suspicionScores.size > 0) {
      const sorted = targets
        .map((p) => ({ player: p, score: suspicionScores.get(p.id) || 50 }))
        .sort((a, b) => b.score - a.score); // 怀疑度高的优先查
      targetId = sorted[0].player.id;
    } else {
      // Fallback: 随机查验
      targetId = this.selectRandom(targets).id;
    }

    return {
      playerId: this.player.id,
      role: 'seer',
      actionType: 'check',
      targetId,
    };
  }

  /**
   * 女巫决定是否使用药水
   * 修正：接收被刀者信息，避免乱毒
   */
  private decidePotionAction(
    killedPlayerId?: string | null,
    suspicionScores?: Map<string, number>,
  ): NightAction | null {
    const { witchPotions, currentRound } = this.gameState;

    // 1. 救人逻辑：首夜必救（常见策略）
    if (witchPotions.antidote && killedPlayerId && currentRound === 1) {
      return {
        playerId: this.player.id,
        role: 'witch',
        actionType: 'save', // 注意：需要与后端的 actionType 定义一致
        targetId: killedPlayerId,
      };
    }

    // 2. 毒人逻辑：绝不盲毒
    // 只有在有明确怀疑目标时才毒（基于 CoT 引擎的分析）
    if (witchPotions.poison && currentRound > 2 && suspicionScores) {
      const targets = this.getAliveOtherPlayers();
      const highSuspicion = targets
        .map((p) => ({ player: p, score: suspicionScores.get(p.id) || 0 }))
        .filter((x) => x.score > 85); // 只毒怀疑度 > 85 的

      if (highSuspicion.length > 0) {
        const target = highSuspicion.sort((a, b) => b.score - a.score)[0];
        return {
          playerId: this.player.id,
          role: 'witch',
          actionType: 'poison',
          targetId: target.player.id,
        };
      }
    }

    // 默认：跳过回合
    return null;
  }

  /**
   * 守卫选择保护目标
   * 修正：
   * 1. 可以守自己
   * 2. 不能连续两晚守同一人
   * 3. 移除了对 role 的直接读取
   */
  private decideProtectTarget(lastProtectedId?: string | null): NightAction | null {
    // 守卫的目标是"所有存活玩家"，包括自己
    let targets = this.gameState.players.filter((p) => p.is_alive);

    // 规则：不能连续两晚守同一个人
    if (lastProtectedId) {
      targets = targets.filter((p) => p.id !== lastProtectedId);
    }

    if (targets.length === 0) return null;

    let targetId: string;

    // 策略：
    // - 第一晚：50% 概率守自己（苟活策略）
    // - 后续：优先守发言最多的人（可能是预言家）
    const shouldSelfGuard = this.gameState.currentRound === 1 && Math.random() > 0.5;
    const self = targets.find((p) => p.id === this.player.id);

    if (shouldSelfGuard && self) {
      targetId = self.id;
    } else {
      // 守发言最多的人（假设是神职）
      const mostActive = targets.sort(
        (a, b) => (b.speechHistory?.length || 0) - (a.speechHistory?.length || 0),
      )[0];
      targetId = mostActive.id;
    }

    return {
      playerId: this.player.id,
      role: 'guard',
      actionType: 'protect',
      targetId,
    };
  }

  /**
   * 投票决策
   * 可以基于 CoT 引擎的分析结果
   */
  async makeVote(suspicionScores?: Map<string, number>): Promise<string | null> {
    const targets = this.getAliveOtherPlayers();
    if (targets.length === 0) return null;

    // 如果有怀疑度数据，投最可疑的人
    if (suspicionScores && suspicionScores.size > 0) {
      const sorted = targets
        .map((p) => ({ player: p, score: suspicionScores.get(p.id) || 50 }))
        .sort((a, b) => b.score - a.score);
      return sorted[0].player.id;
    }

    // Fallback: 根据逻辑能力随机
    const logicScore = this.persona.attributes.logic;

    if (logicScore > 70) {
      // 高逻辑：尝试找出可疑的人（简化：发言少的）
      const suspects = targets.filter((p) => (p.speechHistory?.length || 0) < 2);
      if (suspects.length > 0) {
        return this.selectRandom(suspects).id;
      }
    }

    // 默认：随机投票
    return this.selectRandom(targets).id;
  }

  /**
   * 获取存活的非狼人玩家
   * 注意：这里仍然需要读取 role，因为狼人知道谁是队友
   */
  private getAliveNonWerewolves(): RoomPlayer[] {
    return this.gameState.players.filter(
      (p) => p.is_alive && p.id !== this.player.id && p.role !== 'werewolf',
    );
  }

  /**
   * 获取存活的其他玩家（包括所有身份）
   */
  private getAliveOtherPlayers(): RoomPlayer[] {
    return this.gameState.players.filter((p) => p.is_alive && p.id !== this.player.id);
  }

  /**
   * 随机选择一个元素
   */
  private selectRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 延迟函数（模拟思考时间）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
