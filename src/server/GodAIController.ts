import type { GamePhase } from '../types';

interface PhaseAnnouncement {
  phase: GamePhase;
  title: string;
  description: string;
  icon: string;
}

// 游戏阶段公告配置
const PHASE_ANNOUNCEMENTS: Record<GamePhase, PhaseAnnouncement> = {
  WAITING: {
    phase: 'WAITING',
    title: '等待玩家',
    description: '等待所有玩家加入房间',
    icon: '⏳',
  },
  NIGHT: {
    phase: 'NIGHT',
    title: '天黑请闭眼',
    description: '夜晚降临，请所有玩家闭眼。狼人请睁眼，选择你们今晚要消灭的目标...',
    icon: '🌙',
  },
  DAY_RESULT: {
    phase: 'DAY_RESULT',
    title: '天亮了',
    description: '新的一天开始了，让我们看看昨晚发生了什么...',
    icon: '🌅',
  },
  DAY_DISCUSS: {
    phase: 'DAY_DISCUSS',
    title: '白天讨论',
    description: '现在进入自由讨论时间，请玩家们分享你们的推理和观察',
    icon: '💭',
  },
  DAY_VOTE: {
    phase: 'DAY_VOTE',
    title: '投票阶段',
    description: '请所有玩家投票选择今天要驱逐的玩家',
    icon: '🗳️',
  },
  HUNTER_SHOOT: {
    phase: 'HUNTER_SHOOT',
    title: '猎人开枪',
    description: '猎人请选择一名玩家带走',
    icon: '🎯',
  },
  BADGE_TRANSFER: {
    phase: 'BADGE_TRANSFER',
    title: '移交警徽',
    description: '警长请选择警徽的继承人',
    icon: '👑',
  },
  GAME_OVER: {
    phase: 'GAME_OVER',
    title: '游戏结束',
    description: '游戏已结束，让我们揭晓所有玩家的身份',
    icon: '🏆',
  },
};

export class GodAIController {
  private currentPhase: GamePhase = 'WAITING';
  private autoProgressEnabled = true;
  private phaseTimeouts: Record<GamePhase, number> = {
    WAITING: 0, // 无限等待
    NIGHT: 60, // 60秒
    DAY_RESULT: 15, // 15秒
    DAY_DISCUSS: 120, // 2分钟
    DAY_VOTE: 30, // 30秒
    HUNTER_SHOOT: 30, // 30秒
    BADGE_TRANSFER: 20, // 20秒
    GAME_OVER: 0, // 无限等待
  };

  /**
   * 播报阶段转换
   */
  announcePhase(phase: GamePhase): PhaseAnnouncement {
    this.currentPhase = phase;
    const announcement = PHASE_ANNOUNCEMENTS[phase];
    console.log(`[上帝AI] ${announcement.icon} ${announcement.title}`);
    console.log(`[上帝AI] ${announcement.description}`);
    return announcement;
  }

  /**
   * 获取阶段提示信息
   */
  getPhaseMessage(phase: GamePhase): string {
    const announcement = PHASE_ANNOUNCEMENTS[phase];
    return `${announcement.icon} ${announcement.title}\n${announcement.description}`;
  }

  /**
   * 获取阶段超时时间
   */
  getPhaseTimeout(phase: GamePhase): number {
    return this.phaseTimeouts[phase];
  }

  /**
   * 检查是否应该自动推进
   */
  shouldAutoProgress(phase: GamePhase, allActionsComplete: boolean): boolean {
    if (!this.autoProgressEnabled) return false;

    // WAITING 和 GAME_OVER 不自动推进
    if (phase === 'WAITING' || phase === 'GAME_OVER') return false;

    // 如果所有行动都完成了，可以提前推进
    if (allActionsComplete) return true;

    return false;
  }

  /**
   * 提供智能提示
   */
  provideTip(context: {
    phase: GamePhase;
    isPlayerTurn?: boolean;
    playerId?: string;
    hasActed?: boolean;
  }): string | null {
    const { phase, isPlayerTurn, hasActed } = context;

    if (isPlayerTurn && !hasActed) {
      switch (phase) {
        case 'NIGHT':
          return '💡 提示：轮到您进行夜晚行动了！';
        case 'DAY_DISCUSS':
          return '💡 提示：轮到您发言了，请分享您的推理';
        case 'DAY_VOTE':
          return '💡 提示：请投票选择要驱逐的玩家';
        case 'HUNTER_SHOOT':
          return '💡 提示：猎人请选择带走的玩家';
        case 'BADGE_TRANSFER':
          return '💡 提示：警长请选择警徽继承人';
      }
    }

    return null;
  }

  /**
   * 生成游戏日志消息
   */
  generateGameLog(event: {
    type: 'death' | 'saved' | 'poisoned' | 'voted_out' | 'hunter_shot' | 'sheriff_elected' | 'win';
    playerName?: string;
    roleName?: string;
    winner?: 'werewolf' | 'villager';
  }): string {
    switch (event.type) {
      case 'death':
        return `💀 昨晚 ${event.playerName} 被狼人杀害了`;
      case 'saved':
        return `💊 ${event.playerName} 被女巫救活了`;
      case 'poisoned':
        return `☠️ ${event.playerName} 被女巫毒死了`;
      case 'voted_out':
        return `📤 ${event.playerName} 被投票驱逐出局`;
      case 'hunter_shot':
        return `🎯 猎人带走了 ${event.playerName}`;
      case 'sheriff_elected':
        return `👑 ${event.playerName} 当选为警长`;
      case 'win':
        return event.winner === 'werewolf' ? '🐺 狼人阵营获胜！' : '👑 好人阵营获胜！';
      default:
        return '';
    }
  }

  /**
   * 启用/禁用自动推进
   */
  setAutoProgress(enabled: boolean): void {
    this.autoProgressEnabled = enabled;
  }

  /**
   * 获取阶段流程说明
   */
  getPhaseInstructions(phase: GamePhase): string[] {
    const instructions: Record<GamePhase, string[]> = {
      WAITING: ['等待所有玩家加入', '房主可以开始游戏'],
      NIGHT: [
        '所有玩家闭眼',
        '狼人睁眼并选择目标',
        '预言家查验玩家身份',
        '女巫选择是否使用药水',
        '守卫选择保护对象',
      ],
      DAY_RESULT: ['公布昨晚死亡信息', '展示游戏日志'],
      DAY_DISCUSS: ['玩家依次发言', '分享推理和观察', '讨论可疑目标'],
      DAY_VOTE: ['所有玩家投票', '得票最多者出局', '警长有1.5票权重'],
      HUNTER_SHOOT: ['猎人选择带走目标', '猎人技能触发'],
      BADGE_TRANSFER: ['警长选择继承人', '移交警徽'],
      GAME_OVER: ['揭晓所有身份', '展示游戏结果', '查看游戏统计'],
    };

    return instructions[phase] || [];
  }
}

// 导出单例实例
export const godAI = new GodAIController();
