/**
 * 增强的AI Agent系统
 * 集成CoT推理能力，实现智能游戏决策
 */

import { AICoTEngine, SuspicionAnalysis, CoTStep } from './AICoTEngine';
import { computeSuspicionUpdates, type PersonaWeights, type SuspicionUpdate } from './SuspicionEngine';
import { getMemoryStream } from './MemoryStream';
import type { RoomPlayer, RoomState, PlayerSpeech } from './types';
import type { AIPersona } from './AIPersonaSystem';
import { ROLE_PROMPTS, BASE_CONFIGURATION } from './ai/RolePrompts';
import { getAgentKnowledgeBase, updateKnowledgeRound } from './memory/AgentKnowledgeBase'

export class AIAgentEnhanced {
    private player: RoomPlayer;
    private persona: AIPersona;
    private gameState: RoomState;
    private cotEngine: AICoTEngine;
    private apiKey: string;
    private apiUrl: string;
    private model: string;
    private privateHints: string[] = [];
    private suspicionMemory: Record<string, number> = {};
    private suspicionReasons: Record<string, string> = {};

    constructor(player: RoomPlayer, persona: AIPersona, gameState: RoomState) {
        this.player = player;
        this.persona = persona;
        this.gameState = gameState;
        this.cotEngine = new AICoTEngine(
            player.role || 'villager',
            player.position,
            gameState
        );
        this.apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || '';
        this.apiUrl = process.env.DEEPSEEK_API_URL || process.env.VITE_DEEPSEEK_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
        this.model = process.env.DEEPSEEK_MODEL || process.env.VITE_DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3';
    }

    /**
     * 更新游戏状态
     */
    updateGameState(gameState: RoomState) {
        this.gameState = gameState;
        this.cotEngine = new AICoTEngine(
            this.player.role || 'villager',
            this.player.position,
            gameState
        );
    }

    /**
     * 注入私有提示（例如预言家查验结果），仅供该 AI 使用
     */
    addPrivateHint(hint: string) {
        try {
            this.privateHints.push(hint);
        } catch { }
    }

    /**
     * 执行夜间行动
     */
    async performNightAction(): Promise<{
        actionType: string;
        targetId: string | null;
        reasoning: CoTStep[];
    }> {
        const role = this.player.role || 'villager';
        const phase = this.gameState.phase;

        if (phase !== 'NIGHT') {
            return { actionType: 'skip', targetId: null, reasoning: [] };
        }

        console.log(`[AI Agent] ${this.player.position}号(${role}) 开始夜间决策...`);

        // 认知层：使用怀疑度引擎作为核心调度依据
        const weights: PersonaWeights = this.persona.weights || { W_logic: 1.0, W_tone: 1.0, W_self: 1.0, W_stick: 1.0, N_chaos: 0 }
        const baseMap: Record<string, number> = {}
        for (const p of this.gameState.players) {
            if (p.id !== this.player.id && p.is_alive) {
                baseMap[p.id] = this.suspicionMemory[p.id] ?? 50
            }
        }
        const updates: SuspicionUpdate[] = computeSuspicionUpdates(this.player, this.gameState, weights, baseMap)

        const pickFromUpdates = (sorter: (a: SuspicionUpdate, b: SuspicionUpdate) => number, filter?: (u: SuspicionUpdate) => boolean) => {
            const arr = updates.filter(u => this.gameState.players.find(p => p.id === u.player_id)?.is_alive)
                .filter(u => this.gameState.players.find(p => p.id === u.player_id)?.id !== this.player.id)
                .filter(u => filter ? filter(u) : true)
                .sort(sorter)
            return arr[0]
        }

        let actionType: string = 'skip'
        let targetId: string | null = null
        let reasoning: CoTStep[] = []

        if (role === 'werewolf') {
            if (this.gameState.currentRound === 1) {
                const nonWolfAlive = this.gameState.players.filter(p => p.is_alive && p.role !== 'werewolf' && p.id !== this.player.id)
                const aiTargets = nonWolfAlive.filter(p => p.type === 'ai')
                const pool = aiTargets
                const pick = pool[Math.floor(Math.random() * Math.max(1, pool.length))]
                if (pick) {
                    actionType = 'kill'
                    targetId = pick.id
                    reasoning = [{ step: 1, thought: '首夜规则：只针对AI候选', evidence: [String(pick.position)], conclusion: '首夜不杀真人' }]
                    console.log(`[AI狼人] 首夜随机击杀 -> ${pick.id}（pos ${pick.position}）`)
                }
            } else {
                const top = pickFromUpdates((a, b) => b.new_suspicion - a.new_suspicion, (u) => {
                    const tp = this.gameState.players.find(p => p.id === u.player_id)
                    return tp?.role !== 'werewolf'
                })
                if (top) {
                    actionType = 'kill'
                    targetId = top.player_id
                    reasoning = [{ step: 1, thought: '威胁度最高（扛推/神职优先）', evidence: [String(top.target_position)], conclusion: top.reason.logic_analysis }]
                    console.log(`[AI狼人] 选择击杀 -> ${top.player_id}（pos ${top.target_position}） 分数 ${top.new_suspicion}`)
                }
            }
        } else if (role === 'seer') {
            const top = pickFromUpdates((a, b) => b.new_suspicion - a.new_suspicion)
            if (top) {
                actionType = 'check'
                targetId = top.player_id
                reasoning = [{ step: 1, thought: '怀疑度最高，优先查验', evidence: [String(top.target_position)], conclusion: top.reason.logic_analysis }]
            }
        } else if (role === 'guard') {
            const top = pickFromUpdates((a, b) => a.new_suspicion - b.new_suspicion)
            if (top) {
                actionType = 'protect'
                targetId = top.player_id
                reasoning = [{ step: 1, thought: '怀疑度最低，优先保护可能神职', evidence: [String(top.target_position)], conclusion: top.reason.logic_analysis }]
            }
        } else if (role === 'witch') {
            // 先考虑救被杀者（若存在且有解药），否则按怀疑度最高下毒
            const killed = this.gameState.nightActions.find(a => a.actionType === 'kill')
            if (killed && this.gameState.witchPotions?.antidote) {
                actionType = 'save'
                targetId = killed.targetId || null
                reasoning = [{ step: 1, thought: '有解药且存在被击杀目标，优先救', evidence: [String(killed.targetId)], conclusion: '夜间击杀目标优先救治' }]
            } else if (this.gameState.witchPotions?.poison) {
                const top = pickFromUpdates((a, b) => b.new_suspicion - a.new_suspicion)
                if (top && top.new_suspicion >= 75) {
                    actionType = 'poison'
                    targetId = top.player_id
                    reasoning = [{ step: 1, thought: '高怀疑度（≥75），考虑下毒', evidence: [String(top.target_position)], conclusion: top.reason.logic_analysis }]
                }
            }
        }

        if (!targetId) {
            console.log(`[AI ${role}] 本轮跳过（无合适目标）`)
            return { actionType: 'skip', targetId: null, reasoning }
        }

        return { actionType, targetId, reasoning }
    }

    /**
     * 选择行动目标
     */
    private selectActionTarget(
        role: string,
        analyses: SuspicionAnalysis[]
    ): {
        actionType: string;
        targetId: string | null;
        reasoning: CoTStep[];
    } {
        let targetAnalysis: SuspicionAnalysis | null = null;
        let actionType = 'skip';

        switch (role) {
            case 'werewolf':
                // 狼人：选择怀疑度最低的（可能是神）
                targetAnalysis = analyses
                    .filter(a => a.suggestedAction === 'kill')
                    .sort((a, b) => a.suspicionScore - b.suspicionScore)[0];
                actionType = 'kill';
                console.log(`[AI狼人] 选择击杀目标，分析数量: ${analyses.length}`);
                break;

            case 'seer':
                // 预言家：选择怀疑度最高的查验
                targetAnalysis = analyses
                    .filter(a => a.suggestedAction === 'check')
                    .sort((a, b) => b.suspicionScore - a.suspicionScore)[0];
                actionType = 'check';
                console.log(`[AI预言家] 选择查验目标`);
                break;

            case 'guard':
                // 守卫：选择怀疑度最低的保护
                targetAnalysis = analyses
                    .filter(a => a.suggestedAction === 'protect')
                    .sort((a, b) => a.suspicionScore - b.suspicionScore)[0];
                actionType = 'protect';
                console.log(`[AI守卫] 选择保护目标`);
                break;

            case 'witch':
                // 女巫的决策需要知道谁被杀，并按身份加权随机救人
                const killedPlayer = this.gameState.nightActions.find(
                    a => a.actionType === 'kill'
                );
                if (killedPlayer && this.gameState.witchPotions.antidote) {
                    const target = this.gameState.players.find(p => p.id === killedPlayer.targetId);
                    if (target) {
                        const role = target.role || 'villager';
                        // 身份权重：越关键越高
                        const baseProbMap: Record<string, number> = {
                            seer: 0.9,
                            guard: 0.8,
                            hunter: 0.75,
                            villager: 0.5,
                            werewolf: 0.05,
                        };
                        const base = baseProbMap[role] ?? 0.5;
                        // 首夜整体提升救人概率的随机性
                        const nightFactor = (this.gameState.currentRound === 1) ? 0.15 : 0;
                        const prob = Math.min(0.98, base + nightFactor);
                        const roll = Math.random();
                        if (roll < prob) {
                            actionType = 'save';
                            // 将 targetAnalysis 设为该目标对应的分析或构造一个
                            targetAnalysis = analyses.find(a => {
                                const player = this.gameState.players.find(p => p.position === a.targetPosition);
                                return player?.id === target.id;
                            }) || {
                                targetPosition: target.position,
                                suspicionScore: 40,
                                suggestedAction: 'check',
                                reasoning: []
                            } as any;
                            console.log(`[AI女巫] 按身份加权随机救人: 目标${target.name}(${role}) 概率${(prob * 100).toFixed(0)}% 结果: 救`);
                        } else {
                            console.log(`[AI女巫] 按身份加权随机救人: 目标${target.name}(${role}) 概率${(prob * 100).toFixed(0)}% 结果: 不救`);
                        }
                    }
                }

                if (!targetAnalysis && this.gameState.witchPotions.poison) {
                    // 选择最可疑的下毒
                    targetAnalysis = analyses
                        .sort((a, b) => b.suspicionScore - a.suspicionScore)[0];
                    if (targetAnalysis && targetAnalysis.suspicionScore > 70) {
                        actionType = 'poison';
                        console.log(`[AI女巫] 决定下毒，目标怀疑度: ${targetAnalysis.suspicionScore}`);
                    }
                }
                break;
        }

        if (!targetAnalysis) {
            // Fallback：随机存活非己
            const candidates = this.gameState.players.filter(p => p.is_alive && p.id !== this.player.id);
            const random = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))];
            if (role === 'werewolf' && random) {
                return { actionType: 'kill', targetId: random.id, reasoning: [] };
            }
            console.log(`[AI ${role}] 本轮跳过行动`);
            return { actionType: 'skip', targetId: null, reasoning: [] };
        }

        const targetPlayer = this.gameState.players.find(
            p => p.position === targetAnalysis!.targetPosition
        );

        console.log(`[AI ${role}] 选择 ${targetPlayer?.name}(${targetAnalysis.targetPosition}号)，怀疑度: ${targetAnalysis.suspicionScore}`);

        return {
            actionType,
            targetId: targetPlayer?.id || null,
            reasoning: targetAnalysis.reasoning
        };
    }

    /**
     * 白天发言
     */
    async generateDaySpeech(): Promise<{
        speech: string;
        reasoning: CoTStep[];
        debugUpdates?: SuspicionUpdate[];
    }> {
        console.log(`[AI Agent] ${this.player.position}号 生成发言...`);

        // Step 0: 更新知识库轮次
        try {
            const roomId = (this.gameState as any).id || this.gameState.name || 'default'
            updateKnowledgeRound(roomId, this.gameState.currentRound || 1)
        } catch { }

        // Step 1: 认知层 — 计算怀疑度更新（Think）
        const weights: PersonaWeights = this.persona.weights || { W_logic: 1.0, W_tone: 1.0, W_self: 1.0, W_stick: 1.0, N_chaos: 0 }
        const baseMap: Record<string, number> = {}
        for (const p of this.gameState.players) {
            if (p.id !== this.player.id && p.is_alive) {
                baseMap[p.id] = this.suspicionMemory[p.id] ?? 50
            }
        }
        const updates: SuspicionUpdate[] = computeSuspicionUpdates(this.player, this.gameState, weights, baseMap)
        for (const u of updates) {
            this.suspicionMemory[u.player_id] = u.new_suspicion
            this.suspicionReasons[u.player_id] = `${u.reason.logic_analysis}; ${u.reason.persona_reaction}`
        }

        const sid = this.player.id
        if (!this.gameState.suspicionState) this.gameState.suspicionState = {}
        if (!this.gameState.suspicionState[sid]) this.gameState.suspicionState[sid] = {}
        for (const u of updates) {
            const prev = this.gameState.suspicionState[sid][u.player_id]
            const history = prev?.history_trend ? [...prev.history_trend, u.new_suspicion] : [u.new_suspicion]
            const grudges = prev?.major_grudges ? [...prev.major_grudges] : []
            if (u.reason.logic_analysis.includes('无证据攻神:1')) {
                grudges.push(`Round ${this.gameState.currentRound}: Attack God unjustified`)
            }
            this.gameState.suspicionState[sid][u.player_id] = {
                current_score: u.new_suspicion,
                history_trend: history.slice(-8),
                major_grudges: grudges.slice(-8)
            }
        }

        // 若无可分析对象
        if (updates.length === 0) {
            return { speech: '我需要再观察观察。', reasoning: [] }
        }

        const targetUpdate = updates[0]

        // Step 2: 可解释性分析（结合CoT引擎用于上下文）
        let analyses: SuspicionAnalysis[] = []
        try {
            analyses = await this.cotEngine.analyzeAllPlayers()
        } catch (e) {
            console.warn('[AI Speech] analyzeAllPlayers failed, using heuristic fallback')
            analyses = this.buildHeuristicAnalyses()
        }

        const topAnalysis = analyses.find(a => this.gameState.players.find(p => p.position === a.targetPosition)?.id === targetUpdate.player_id) || analyses[0]

        // Step 3: 表达层 — 基于数据生成发言（Act），强约束执行
        const speech = await this.generateSpeechWithPersona(
            topAnalysis,
            analyses,
            {
                forcedTargetId: targetUpdate.player_id,
                forcedTargetPosition: targetUpdate.target_position,
                forcedSuspicion: targetUpdate.new_suspicion,
                forcedReason: this.suspicionReasons[targetUpdate.player_id] || '综合逻辑与性格加权后可疑'
            }
        )
        try {
            const _ms2 = getMemoryStream((this.gameState as any).id || this.gameState.name || 'default');
            const summary = targetUpdate.new_suspicion >= 50
                ? `攻击 ${targetUpdate.target_position}号，理由：${this.suspicionReasons[targetUpdate.player_id]}`
                : `温和发言，暂认好人：${targetUpdate.target_position}号`;
            _ms2.updateAgentMemory(this.player.id, summary);
        } catch { }

        // 写入私有记忆（简要记录本轮思考结果）
        try {
            const roomId = (this.gameState as any).id || this.gameState.name || 'default'
            const kb = getAgentKnowledgeBase(roomId)
            kb.addPrivateThought(this.gameState.currentRound || 1, this.player.position, `目标${targetUpdate.target_position}号，怀疑度${Math.round(targetUpdate.new_suspicion)}，理由：${this.suspicionReasons[targetUpdate.player_id]}`)
        } catch { }

        return {
            speech,
            reasoning: topAnalysis?.reasoning || [],
            debugUpdates: updates
        }
    }

    // 简单启发式分析（无模型时本地规则）
    private buildHeuristicAnalyses(): SuspicionAnalysis[] {
        const alive = this.gameState.players.filter(p => p.is_alive);
        return alive.map((p, idx) => ({
            targetPosition: p.position,
            targetName: p.name,
            suspicionScore: Math.floor(40 + (idx * 7) % 45),
            suggestedAction: this.player.role === 'seer' ? 'check' : (this.player.role === 'werewolf' ? 'kill' : 'protect'),
            reasoning: [{ step: 1, thought: '基于发言与位置的启发式判断', evidence: [String(p.position)], conclusion: '需要进一步观察' }]
        }));
    }

    /**
     * 根据人格生成发言
     */
    private async generateSpeechWithPersona(
        topSuspect: SuspicionAnalysis,
        allAnalyses: SuspicionAnalysis[],
        hardConstraints?: {
            forcedTargetId: string
            forcedTargetPosition: number
            forcedSuspicion: number
            forcedReason: string
        }
    ): Promise<string> {
        const role = this.player.role || 'villager';
        const position = this.player.position;

        if (!this.apiKey) {
            console.warn('[AI Agent] 无API Key（DEEPSEEK_API_KEY / VITE_DEEPSEEK_API_KEY），使用默认发言');
            return `我觉得${topSuspect.targetPosition}号位比较可疑。`;
        }

        // 获取角色专属提示词
        const rolePrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS['villager'];

        // 构建游戏上下文
        const context = this.buildGameContext(topSuspect, allAnalyses);
        const _ms = getMemoryStream((this.gameState as any).id || this.gameState.name || 'default');
        const memoryContextPrompt = _ms.generateContextPrompt(this.player.id);

        // 基于性格的知识库检索
        let kbContext = ''
        try {
            const roomId = (this.gameState as any).id || this.gameState.name || 'default'
            const kb = getAgentKnowledgeBase(roomId)
            kb.setCurrentRound(this.gameState.currentRound || 1)
            kbContext = kb.retrieveContext(this.persona, this.player.position)
        } catch { }

        let memoryContext = ''
        if (hardConstraints?.forcedTargetId && this.gameState.suspicionState?.[this.player.id]?.[hardConstraints.forcedTargetId]) {
            const mem = this.gameState.suspicionState[this.player.id][hardConstraints.forcedTargetId]
            const trend = mem.history_trend || []
            const grudges = mem.major_grudges || []
            if (trend.length > 0 || grudges.length > 0) {
                memoryContext = `\n**【记忆激活】**\n你记得该玩家的历史轨迹: 分数轨迹(${trend.join(' → ')})。\n前科: ${grudges.join(', ') || '暂无'}。\n在你的发言中，务必翻旧账，例如：“我还没忘你第一轮干的事”。\n`
            }
        }

        const targetPlayerObj = hardConstraints?.forcedTargetId ? this.gameState.players.find(p => p.id === hardConstraints.forcedTargetId) : null
        const targetIsHuman = !!(targetPlayerObj && targetPlayerObj.type === 'user')

        const friendlyPolicy = `
【友好交流原则】
- 对真人玩家的发言保持尊重与理解，避免贬损、讽刺或攻击性语言。
- 先认可其观点或处境，再提出温和的改进建议或不同看法。
- 使用合作语气（例如“我理解你的思路”“也许可以换个角度”），鼓励继续参与讨论。
${targetIsHuman ? '- 当前讨论对象为真人玩家，请务必使用温和且包容的措辞，并在表述中包含至少一句理解或鼓励。' : ''}
`

        const constraintText = hardConstraints ? `
【强约束】
你必须基于以下数据组织发言：
- 主要攻击目标: ${hardConstraints.forcedTargetPosition}号 (怀疑度 ${Math.round(hardConstraints.forcedSuspicion)})
- 攻击理由: ${hardConstraints.forcedReason}
- 若目标怀疑度 < 50，则不要攻击该目标，转为温和发言并认定其暂时为好人。
` : ''

        // 构建完整提示词
        const prompt = `
${BASE_CONFIGURATION}

${rolePrompt}

${memoryContextPrompt}

**【你的关键记忆 (Knowledge Base)】**
${kbContext || '暂无关键记忆'}

**【当前局势信息】**
${context}

**【你的深度人格设定 (Deep Persona)】**
${this.persona.systemPrompt}

**【基础属性】**
策略倾向: ${this.persona.strategy}
${memoryContext}

请严格按照【思维链 (Chain of Thought) 协议】输出，必须包含 [内心OS] 和 [公开具体发言] 两个部分。${constraintText}
 
 ${friendlyPolicy}
        `;

        // 调用DeepSeek API 生成发言
        const maxRetries = 1;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                console.log(`[API调用] ${this.player.position}号 开始调用API (尝试 ${retryCount + 1}/${maxRetries + 1})...`);
                console.log(`[API配置] URL: ${this.apiUrl}, Model: ${this.model}, PromptLength: ${prompt.length}`);

                // 添加超时控制 (60秒)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7, // 稍微降低温度以保证遵循格式
                        max_tokens: 800 // 增加token限制以容纳CoT
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(`[API响应] ${this.player.position}号 收到响应，状态: ${response.status}`);

                if (!response.ok) {
                    throw new Error(`API返回错误状态: ${response.status}`);
                }

                const data = await response.json() as any;
                console.log(`[API解析] ${this.player.position}号 成功解析JSON`);

                const generated = data.choices?.[0]?.message?.content || '';

                console.log(`[AI原始输出] ${this.player.position}号:\n${generated.substring(0, 100)}...`);

                // 解析输出，提取公开具体发言
                return this.parseSpeechOutput(generated, topSuspect);
            } catch (error: any) {
                const isTimeout = error.name === 'AbortError';
                console.error(`[AI发言生成] ${this.player.position}号 API调用失败 (尝试 ${retryCount + 1}):`, error.message);

                retryCount++;
                if (retryCount <= maxRetries) {
                    console.log(`[AI重试] ${this.player.position}号 准备重试...`);
                    continue;
                }

                // 最后一次失败，返回兜底逻辑
                if (hardConstraints && hardConstraints.forcedSuspicion >= 50) {
                    const softPrefix = targetIsHuman ? '我理解你的想法，但我仍然有些担心' : '我仍然有些担心'
                    return `${softPrefix}${hardConstraints.forcedTargetPosition}号，理由：${hardConstraints.forcedReason}。如果我有理解偏差，欢迎纠正。`
                }
                const softLine = targetIsHuman ? '我理解你的表达，或许可以再补充一些线索' : '或许可以再补充一些线索'
                return `我个人的看法是 ${topSuspect.targetPosition} 号位可能有些可疑，${softLine}，我们一起继续探讨。`;
            }
        }
        return ''; // Should not reach here
    }

    /**
     * 构建游戏上下文信息
     */
    private buildGameContext(topSuspect: SuspicionAnalysis, allAnalyses: SuspicionAnalysis[]): string {
        const alivePlayers = this.gameState.players
            .filter(p => p.is_alive)
            .map(p => `${p.position}号`)
            .join('、');

        const deadPlayers = this.gameState.players
            .filter(p => !p.is_alive)
            .map(p => `${p.position} 号`)
            .join('、');

        let specificInfo = '';
        const role = this.player.role;

        // 角色特定信息
        if (role === 'seer') {
            const hints = this.privateHints.length > 0 ? this.privateHints.join('; ') : '暂无数据';
            specificInfo += `\n你的查验历史: ${hints} `;
        } else if (role === 'witch') {
            const { antidote, poison } = this.gameState.witchPotions || { antidote: false, poison: false };
            specificInfo += `\n你的药剂状态: 解药${antidote ? '可用' : '已用'}，毒药${poison ? '可用' : '已用'} `;
        } else if (role === 'guard') {
            // TODO: 获取守护历史
            specificInfo += `\n你的守护历史: (暂无数据)`;
        }

        // 简要的场上局势分析（基于CoT引擎）
        const suspicionSummary = allAnalyses
            .slice(0, 3)
            .map(a => `${a.targetPosition}号嫌疑度${a.suspicionScore} (理由: ${a.reasoning[0]?.conclusion || '直觉'
                })`)
            .join('\n');

        // 最近发言摘要（统一上下文，避免各说各话）
        const recentSpeeches = this.gameState.gameLog
            .filter(l => l.event === 'speech')
            .slice(-8)
            .map(l => `${(l.details as any)?.senderName}: ${(l.details as any)?.content} `)
            .join('\n');

        // 私有知识库概要（每个AI自己的记忆）
        let knowledgeSummary = ''
        const ak = this.gameState.agentKnowledge?.[this.player.id]
        if (ak && ak.log.length) {
            const lastK = ak.log.slice(-5).map(e => {
                if (e.type === 'seer_check') return `查验 ${e.targetName || e.targetId}: ${e.result} `
                if (e.type === 'witch_save') return `解药救 ${e.targetName || e.targetId} `
                if (e.type === 'witch_poison') return `毒杀 ${e.targetName || e.targetId} `
                if (e.type === 'guard_protect') return `守护 ${e.targetName || e.targetId} `
                if (e.type === 'werewolf_team_kill') return `团队击杀 ${e.targetName || e.targetId} `
                if (e.type === 'peace_night') return `平安夜：${e.text || ''} `
                if (e.type === 'death') return `死亡 ${e.targetName || e.targetId} `
                return e.text || e.type
            }).join('\n')
            knowledgeSummary = `\n你的记忆摘要: \n${lastK} `
        }

        return `
当前是第 ${this.gameState.currentRound} 天 ${this.gameState.phase}。
存活玩家: ${alivePlayers}
死亡玩家: ${deadPlayers || '无'}
你的位置: ${this.player.position} 号
你的身份: ${role}
${specificInfo}
${knowledgeSummary}

场上嫌疑分析(仅供参考):
${suspicionSummary}

近期发言记录:
  ${recentSpeeches || '暂无'}
`;
    }

    /**
     * 解析AI输出，提取公开具体发言
     */
    private parseSpeechOutput(text: string, topSuspect: SuspicionAnalysis): string {
        // 尝试提取 [公开具体发言] 后的内容
        const speechMatch = text.match(/\[公开具体发言\]\s*([\s\S]*)/);
        if (speechMatch && speechMatch[1]) {
            return speechMatch[1].trim().replace(/^["“]|["”]$/g, ''); // 去除首尾引号
        }

        // 如果格式不对，尝试提取最后一段
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            // 如果最后一段太短，可能是标签，取倒数第二段
            if (lastLine.length < 10 && lines.length > 1) {
                return lines[lines.length - 2].replace(/^["“]|["”]$/g, '');
            }
            return lastLine.replace(/^["“]|["”]$/g, '');
        }

        return `我觉得${topSuspect.targetPosition} 号位比较可疑。`;
    }

    /**
     * 投票决策
     */
    async decideVote(): Promise<{
        targetId: string;
        reasoning: CoTStep[];
    }> {
        console.log(`[AI Agent] ${this.player.position}号 投票决策...`);

        // 使用怀疑度引擎
        const weights: PersonaWeights = this.persona.weights || { W_logic: 1.0, W_tone: 1.0, W_self: 1.0, W_stick: 1.0, N_chaos: 0 }
        const baseMap: Record<string, number> = {}
        for (const p of this.gameState.players) {
            if (p.id !== this.player.id && p.is_alive) {
                baseMap[p.id] = this.suspicionMemory[p.id] ?? 50
            }
        }
        const updates: SuspicionUpdate[] = computeSuspicionUpdates(this.player, this.gameState, weights, baseMap)

        // 融合CoT分析结果作为第二信号
        let analyses: SuspicionAnalysis[] = []
        try {
            analyses = await this.cotEngine.analyzeAllPlayers()
        } catch (e) {
            analyses = this.buildHeuristicAnalyses()
        }
        const analysisScoreById: Record<string, number> = {}
        for (const a of analyses) {
            const pl = this.gameState.players.find(p => p.position === a.targetPosition)
            if (pl) analysisScoreById[pl.id] = a.suspicionScore
        }

        const currentRound = this.gameState.currentRound || 1
        const canAbstain = currentRound === 1

        // 过滤无效与队友（狼人不投狼）
        const validUpdates = updates.filter(u => {
            const tp = this.gameState.players.find(p => p.id === u.player_id)
            if (!tp || !tp.is_alive) return false
            if (this.player.role === 'werewolf' && tp.role === 'werewolf') return false
            return true
        })

        // 融合分数：怀疑度 60% + CoT分析 40%，并加入微随机避免平票总是同一目标
        const combined = validUpdates.map(u => {
            const cotS = analysisScoreById[u.player_id] ?? 50
            const base = 0.6 * u.new_suspicion + 0.4 * cotS
            const jitter = (Math.random() - 0.5) * (weights.N_chaos || 0) // persona混沌度
            const score = Math.max(0, Math.min(100, base + jitter))
            return { u, score }
        }).sort((a, b) => b.score - a.score)

        const top = combined[0]
        if (!top || (canAbstain && top.score < 65)) {
            console.log(`[AI投票] ${this.player.position}号 无明确怀疑对象，弃票`)
            return { targetId: '', reasoning: [] }
        }

        // 消除“单一真人偏置”：若Top是真人且与次选差距<2分，随机在前二中选择
        let chosen = top
        const alt = combined[1]
        const topIsHuman = this.gameState.players.find(p => p.id === top.u.player_id)?.type === 'user'
        if (alt && topIsHuman && Math.abs(top.score - alt.score) < 2) {
            chosen = Math.random() < 0.5 ? top : alt
        }

        const reason: CoTStep[] = [{ step: 1, thought: '融合怀疑度与CoT分析', evidence: [String(chosen.u.target_position)], conclusion: chosen.u.reason.logic_analysis }]
        return { targetId: chosen.u.player_id, reasoning: reason }
    }

    /**
     * 理解其他玩家的发言
     */
    async understandSpeech(speech: {
        position: number;
        content: string;
        phase: string;
    }): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral';
        keywords: string[];
        isTargetingMe: boolean;
        suggestedResponse: string | null;
    }> {
        const content = speech.content;
        const myPosition = this.player.position;

        // 检测是否针对自己
        const isTargetingMe = content.includes(`${myPosition} 号`) ||
            content.includes(this.player.name);

        // 提取关键词
        const keywords: string[] = [];
        const keywordPatterns = [
            /(\d+号)/g,
            /(狼人|预言家|女巫|守卫|猎人|村民)/g,
            /(投票|查验|保护|怀疑|相信|好人)/g
        ];

        for (const pattern of keywordPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                keywords.push(...matches);
            }
        }

        // 分析情感
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (content.includes('相信') || content.includes('好人')) {
            sentiment = 'positive';
        } else if (content.includes('怀疑') || content.includes('狼') || content.includes('可疑')) {
            sentiment = 'negative';
        }

        // 是否需要回应
        let suggestedResponse = null;
        if (isTargetingMe && sentiment === 'negative') {
            suggestedResponse = '需要为自己辩护';
            console.log(`[AI理解] ${this.player.position}号 被 ${speech.position}号 质疑`);
        }

        if (isTargetingMe) {
            console.log(`[AI理解] ${this.player.position}号 识别到 ${speech.position}号 的发言提到自己，情感: ${sentiment} `);
        }

        return {
            sentiment,
            keywords,
            isTargetingMe,
            suggestedResponse
        };
    }
}
