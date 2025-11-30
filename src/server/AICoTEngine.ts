/**
 * AI Agent CoT (Chain of Thought) 推理引擎
 * 为AI玩家提供智能推理和决策能力
 */

import type { RoomPlayer, RoomState, GamePhase, PlayerSpeech } from './types';

/**
 * CoT推理步骤
 */
export interface CoTStep {
    step: number;
    thought: string;        // 思考内容
    evidence: string[];     // 证据列表
    conclusion: string;     // 结论
}

/**
 * 怀疑度分析结果
 */
export interface SuspicionAnalysis {
    targetPosition: number;     // 目标玩家序号
    targetName: string;
    suspicionScore: number;     // 怀疑分数 (0-100)
    reasoning: CoTStep[];       // 推理过程
    suggestedAction: 'vote' | 'protect' | 'kill' | 'check' | 'poison' | 'ignore';
}

/**
 * AI CoT推理引擎
 */
export class AICoTEngine {
    private myRole: string;
    private myPosition: number;
    private gameState: RoomState;

    constructor(role: string, position: number, gameState: RoomState) {
        this.myRole = role;
        this.myPosition = position;
        this.gameState = gameState;
    }

    /**
     * 分析所有玩家的可疑度
     */
    async analyzeAllPlayers(): Promise<SuspicionAnalysis[]> {
        const analyses: SuspicionAnalysis[] = [];

        for (const player of this.gameState.players) {
            if (player.position === this.myPosition || !player.is_alive) {
                continue; // 跳过自己和死亡玩家
            }

            const analysis = await this.analyzePlayer(player);
            analyses.push(analysis);
        }

        // 按怀疑度排序
        return analyses.sort((a, b) => b.suspicionScore - a.suspicionScore);
    }

    /**
     * 分析单个玩家
     */
    private async analyzePlayer(player: RoomPlayer): Promise<SuspicionAnalysis> {
        const cotSteps: CoTStep[] = [];
        let suspicionScore = 50; // 基础分数

        // Step 1: 分析发言内容
        const speechAnalysis = this.analyzeSpeech(player);
        cotSteps.push({
            step: 1,
            thought: `分析${player.position}号位玩家的发言`,
            evidence: speechAnalysis.evidence,
            conclusion: speechAnalysis.conclusion
        });
        suspicionScore += speechAnalysis.scoreChange;

        // Step 2: 分析投票行为
        const voteAnalysis = this.analyzeVotingBehavior(player);
        cotSteps.push({
            step: 2,
            thought: `分析${player.position}号位玩家的投票行为`,
            evidence: voteAnalysis.evidence,
            conclusion: voteAnalysis.conclusion
        });
        suspicionScore += voteAnalysis.scoreChange;

        // Step 3: 根据自身角色进行专项分析
        const roleAnalysis = this.analyzeByRole(player);
        cotSteps.push({
            step: 3,
            thought: `从${this.getRoleName()}角度分析`,
            evidence: roleAnalysis.evidence,
            conclusion: roleAnalysis.conclusion
        });
        suspicionScore += roleAnalysis.scoreChange;

        // Step 4: 综合判断
        suspicionScore = Math.max(0, Math.min(100, suspicionScore));
        const suggestedAction = this.getSuggestedAction(suspicionScore, player);

        cotSteps.push({
            step: 4,
            thought: '综合所有信息得出结论',
            evidence: [`怀疑度: ${suspicionScore}/100`],
            conclusion: `建议行动: ${suggestedAction}`
        });

        return {
            targetPosition: player.position,
            targetName: player.name,
            suspicionScore,
            reasoning: cotSteps,
            suggestedAction
        };
    }

    /**
     * 发言分析
     */
    private analyzeSpeech(player: RoomPlayer): {
        evidence: string[];
        conclusion: string;
        scoreChange: number;
    } {
        const speeches = player.speechHistory || [];
        const evidence: string[] = [];
        let scoreChange = 0;

        if (speeches.length === 0) {
            evidence.push('该玩家未发言或发言很少');
            scoreChange += 10; // 不发言略微可疑
            return {
                evidence,
                conclusion: '发言较少，难以判断',
                scoreChange
            };
        }

        // 分析最近的发言
        const recentSpeeches = speeches.slice(-3);

        for (const speech of recentSpeeches) {
            const content = speech.content.toLowerCase();

            // 检测关键词
            if (content.includes('我是好人') || content.includes('我不是狼')) {
                evidence.push(`回合${speech.round}: 主动声明身份`);
                scoreChange += 5; // 主动声明略微可疑
            }

            if (content.includes('投') || content.includes('出')) {
                evidence.push(`回合${speech.round}: 主动带节奏`);
                scoreChange += 3;
            }

            if (content.includes('预言家') || content.includes('女巫') || content.includes('守卫')) {
                evidence.push(`回合${speech.round}: 提及特殊角色`);
            }

            // 检测防守性发言
            if (content.includes('不是我') || content.includes('冤枉')) {
                evidence.push(`回合${speech.round}: 防守性发言`);
                scoreChange += 8;
            }
        }

        return {
            evidence,
            conclusion: `发言${speeches.length}次，${evidence.length > 2 ? '行为积极' : '较为低调'}`,
            scoreChange
        };
    }

    /**
     * 投票行为分析
     */
    private analyzeVotingBehavior(player: RoomPlayer): {
        evidence: string[];
        conclusion: string;
        scoreChange: number;
    } {
        // 从游戏日志中提取投票记录
        const voteHistory = this.gameState.gameLog
            .filter(log => log.event === 'vote' && log.details?.voterId === player.id);

        const evidence: string[] = [];
        let scoreChange = 0;

        if (voteHistory.length > 0) {
            evidence.push(`共投票${voteHistory.length}次`);

            // 分析投票目标
            const targets = voteHistory.map(v => v.details.targetId);
            const uniqueTargets = new Set(targets);

            if (uniqueTargets.size === targets.length) {
                evidence.push('每次投票目标都不同');
                scoreChange += 5; // 可能在试探
            }

            // 检测是否跟风投票
            const lastVote = voteHistory[voteHistory.length - 1];
            if (lastVote) {
                evidence.push('参与投票');
            }
        } else {
            evidence.push('尚未投票');
        }

        return {
            evidence,
            conclusion: evidence.length > 1 ? '投票行为正常' : '未参与投票',
            scoreChange
        };
    }

    /**
     * 根据自身角色分析
     */
    private analyzeByRole(player: RoomPlayer): {
        evidence: string[];
        conclusion: string;
        scoreChange: number;
    } {
        const evidence: string[] = [];
        let scoreChange = 0;
        let conclusion = '';

        switch (this.myRole) {
            case 'werewolf':
                // 狼人视角：分析谁可能是神职
                if (player.speechHistory.some(s =>
                    s.content.includes('查验') || s.content.includes('预言'))) {
                    evidence.push('疑似预言家');
                    scoreChange -= 20; // 对狼人来说，神职需要优先击杀，但不是"可疑"
                    conclusion = '可能是预言家，建议击杀';
                } else if (player.speechHistory.some(s =>
                    s.content.includes('守卫') || s.content.includes('保护'))) {
                    evidence.push('疑似守卫');
                    scoreChange -= 15;
                    conclusion = '可能是守卫，建议击杀';
                } else {
                    conclusion = '普通玩家，暂时不理会';
                }
                break;

            case 'seer':
                // 预言家视角：分析谁可能是狼人
                const hasDefensiveSpeech = player.speechHistory.some(s =>
                    s.content.includes('不是') || s.content.includes('好人'));
                if (hasDefensiveSpeech) {
                    evidence.push('多次为自己辩护');
                    scoreChange += 15;
                    conclusion = '行为可疑，建议查验';
                } else {
                    conclusion = '需要更多信息';
                }
                break;

            case 'witch':
                // 女巫视角：分析谁值得救/毒
                if (player.speechHistory.some(s =>
                    s.content.includes('预言') || s.content.includes('查验'))) {
                    evidence.push('疑似预言家');
                    scoreChange -= 20;
                    conclusion = '可能是预言家，值得救';
                } else if (player.speechHistory.length > 3 &&
                    player.speechHistory.every(s => s.content.length > 20)) {
                    evidence.push('发言积极且详细');
                    scoreChange -= 10;
                    conclusion = '可能是好人阵营';
                }
                break;

            case 'guard':
                // 守卫视角：分析谁需要保护
                if (player.speechHistory.some(s =>
                    s.content.includes('预言') || s.content.includes('查验'))) {
                    evidence.push('疑似预言家');
                    scoreChange -= 30; // 需要保护，不是可疑
                    conclusion = '可能是预言家，建议保护';
                } else if (player.speechHistory.some(s =>
                    s.content.includes('女巫') || s.content.includes('解药'))) {
                    evidence.push('疑似女巫');
                    scoreChange -= 25;
                    conclusion = '可能是女巫，建议保护';
                }
                break;

            case 'hunter':
            case 'villager':
                // 普通角色视角：分析谁可能是狼
                if (player.speechHistory.filter(s =>
                    s.content.includes('不是') || s.content.includes('冤枉')
                ).length >= 2) {
                    evidence.push('多次辩解');
                    scoreChange += 12;
                    conclusion = '表现可疑';
                }
                break;

            default:
                conclusion = '继续观察';
        }

        return { evidence, conclusion, scoreChange };
    }

    /**
     * 根据怀疑度建议行动
     */
    private getSuggestedAction(
        suspicionScore: number,
        player: RoomPlayer
    ): SuspicionAnalysis['suggestedAction'] {
        switch (this.myRole) {
            case 'werewolf':
                // 狼人的逻辑：优先杀神职，其次杀发言好的
                if (suspicionScore < 40) {
                    return 'kill'; // 低怀疑度说明可能是神职或强玩家
                }
                return 'ignore';

            case 'seer':
                if (suspicionScore > 65) {
                    return 'check'; // 高度怀疑，查验
                }
                if (suspicionScore > 50 && Math.random() > 0.5) {
                    return 'check'; // 中等怀疑，有概率查验
                }
                return 'ignore';

            case 'witch':
                if (suspicionScore > 75) {
                    return 'poison'; // 高度怀疑，考虑下毒
                }
                return 'ignore';

            case 'guard':
                if (suspicionScore < 35) {
                    return 'protect'; // 低怀疑度，可能是神职
                }
                return 'ignore';

            default:
                // ⭐ 修复：村民/猎人白天投票，始终返回'vote'
                //  让投票决策完全基于怀疑度排序，而不是阈值过滤
                return 'vote';
        }
    }

    private getRoleName(): string {
        const names: Record<string, string> = {
            werewolf: '狼人',
            seer: '预言家',
            witch: '女巫',
            guard: '守卫',
            hunter: '猎人',
            villager: '村民'
        };
        return names[this.myRole] || this.myRole;
    }
}
