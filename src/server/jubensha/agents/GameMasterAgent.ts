import type { ScriptData, Scene, GameState, Message, AgentResponse, Clue } from '../types';
import { aiService } from '../../../services/ai';
import fs from 'fs';
import path from 'path';

/**
 * GameMasterAgent - Enhanced narrator that follows the host handbook
 * Manages game flow, phases, and provides guided gameplay experience
 */
export class GameMasterAgent {
    private script: ScriptData;
    private gameState: GameState;
    private handbookContent: string = '';
    private currentPhaseIndex: number = 0;
    private phases: string[] = ['intro', 'investigation', 'discussion', 'voting', 'resolution'];

    constructor(script: ScriptData, gameState: GameState, handbookPath?: string) {
        this.script = script;
        this.gameState = gameState;

        // Load handbook if available
        if (handbookPath) {
            this.loadHandbook(handbookPath);
        }
    }

    /**
     * Load and parse the host handbook
     */
    private loadHandbook(handbookPath: string): void {
        try {
            // For now, we'll store the path. In production, you'd parse the PDF
            // This is a placeholder - actual PDF parsing would happen here
            this.handbookContent = `Host handbook for ${this.script.title}`;
            console.log(`Loaded handbook from: ${handbookPath}`);
        } catch (error) {
            console.warn('Failed to load handbook:', error);
            this.handbookContent = 'Default game flow';
        }
    }

    /**
     * Initialize the game with opening narration based on handbook
     */
    async initializeGame(): Promise<AgentResponse> {
        const firstScene = this.script.scenes[0];
        this.gameState.currentSceneId = firstScene?.id || 'default';
        this.gameState.currentPhase = 'intro';
        this.currentPhaseIndex = 0;

        const narration = await this.generateGMNarration(
            `作为游戏主持人，欢迎玩家进入《${this.script.title}》的世界。介绍剧本背景、设定游戏规则，并营造沉浸式氛围。`
        );

        return {
            type: 'narration',
            content: `🎭 【主持人】\n\n${narration}\n\n游戏即将开始，请各位玩家做好准备...`,
            metadata: {
                newSceneId: firstScene?.id,
            },
        };
    }

    /**
     * Advance to the next game phase
     */
    async advancePhase(): Promise<AgentResponse> {
        this.currentPhaseIndex++;

        if (this.currentPhaseIndex >= this.phases.length) {
            return {
                type: 'narration',
                content: '🎭 【主持人】\n\n游戏已经结束，感谢各位的参与！',
            };
        }

        const newPhase = this.phases[this.currentPhaseIndex];
        this.gameState.currentPhase = newPhase as any;

        const narration = await this.generatePhaseTransition(newPhase);

        return {
            type: 'narration',
            content: `🎭 【主持人】\n\n${narration}`,
        };
    }

    /**
     * Generate narration for phase transitions
     */
    private async generatePhaseTransition(phase: string): Promise<string> {
        const phaseDescriptions: Record<string, string> = {
            intro: '游戏开始！现在进入角色介绍阶段。',
            investigation: '调查阶段开始！请各位仔细搜查现场，寻找线索。',
            discussion: '讨论阶段！请各位分享你们的发现，推理真相。',
            voting: '投票阶段！请根据你的推理，投出你认为的凶手。',
            resolution: '真相揭晓！让我们看看谁才是真正的凶手...'
        };

        const baseDesc = phaseDescriptions[phase] || `进入${phase}阶段`;

        const prompt = `你是《${this.script.title}》的游戏主持人。现在要引导玩家进入"${phase}"阶段。

请用2-3句话：
1. 宣布新阶段开始
2. 说明这个阶段玩家需要做什么
3. 营造紧张/神秘的氛围

主持人：`;

        try {
            return await aiService.generateText(prompt);
        } catch (error) {
            return baseDesc;
        }
    }

    /**
     * Progress the story based on player actions and handbook
     */
    async progressStory(): Promise<AgentResponse> {
        this.gameState.timelineProgress++;

        const currentEvent = this.script.timeline?.[this.gameState.timelineProgress];

        if (!currentEvent) {
            // Check if we should advance to next phase
            return await this.advancePhase();
        }

        switch (currentEvent.action) {
            case 'scene_change':
                return await this.changeScene(currentEvent.sceneId);

            case 'narration':
                return {
                    type: 'narration',
                    content: `🎭 【主持人】\n\n${currentEvent.content}`,
                };

            case 'clue_reveal':
                return this.revealClue(currentEvent.content);

            default:
                return {
                    type: 'narration',
                    content: '🎭 【主持人】\n\n时间缓缓流逝...',
                };
        }
    }

    /**
     * Change to a new scene with GM narration
     */
    async changeScene(sceneId: string): Promise<AgentResponse> {
        const newScene = this.script.scenes?.find(s => s.id === sceneId);

        if (!newScene) {
            return {
                type: 'system',
                content: '场景切换失败',
            };
        }

        this.gameState.currentSceneId = sceneId;

        const narration = await this.describeScene(newScene);

        return {
            type: 'scene_change',
            content: `🎭 【主持人】\n\n${narration}`,
            metadata: {
                newSceneId: sceneId,
            },
        };
    }

    /**
     * Describe a scene with GM perspective
     */
    private async describeScene(scene: Scene): Promise<string> {
        const prompt = `你是游戏主持人，正在描述场景《${scene.name}》。

场景信息：
- 描述：${scene.description}
- 氛围：${scene.atmosphere}

请用主持人的口吻，用2-3句话生动描述这个场景，引导玩家进入情境。`;

        try {
            return await aiService.generateText(prompt);
        } catch (error) {
            return `场景切换至【${scene.name}】\n${scene.description}`;
        }
    }

    /**
     * Provide GM narration for events
     */
    async narrateEvent(event: string): Promise<string> {
        return await this.generateGMNarration(event);
    }

    /**
     * Reveal clues with GM guidance
     */
    revealClue(clueId?: string): AgentResponse {
        const availableClues = this.script.clues?.filter(
            clue => !clue.discovered && !this.gameState.discoveredClues.includes(clue.id)
        ) || [];

        if (availableClues.length === 0) {
            return {
                type: 'narration',
                content: '🎭 【主持人】\n\n你仔细搜查了周围，但没有发现更多线索。',
            };
        }

        const clueToReveal = clueId
            ? this.script.clues?.find(c => c.id === clueId)
            : availableClues[Math.floor(Math.random() * availableClues.length)];

        if (!clueToReveal) {
            return {
                type: 'narration',
                content: '🎭 【主持人】\n\n你仔细搜查了周围，但没有发现新的线索。',
            };
        }

        this.gameState.discoveredClues.push(clueToReveal.id);

        return {
            type: 'clue_reveal',
            content: `🎭 【主持人】\n\n你发现了一条重要线索！\n\n【${clueToReveal.name}】\n${clueToReveal.description}`,
            metadata: {
                clueIds: [clueToReveal.id],
            },
        };
    }

    /**
     * Provide hints to stuck players
     */
    async provideHint(): Promise<AgentResponse> {
        const discoveredCount = this.gameState.discoveredClues.length;
        const totalClues = this.script.clues?.length || 0;

        const prompt = `你是游戏主持人。玩家似乎遇到了困难。

当前进度：
- 已发现线索：${discoveredCount}/${totalClues}
- 当前阶段：${this.gameState.currentPhase}

请提供一个委婉的提示，帮助玩家继续前进，但不要直接透露答案。`;

        try {
            const hint = await aiService.generateText(prompt);
            return {
                type: 'narration',
                content: `🎭 【主持人提示】\n\n${hint}`,
            };
        } catch (error) {
            return {
                type: 'narration',
                content: '🎭 【主持人】\n\n仔细观察你周围的环境，也许会有新的发现...',
            };
        }
    }

    /**
     * Generate GM narration using AI
     */
    private async generateGMNarration(context: string): Promise<string> {
        const currentScene = this.script.scenes?.find(s => s.id === this.gameState.currentSceneId);

        const prompt = `你是《${this.script.title}》剧本杀的游戏主持人（GM）。

当前场景：${currentScene?.name || '未知'}
当前阶段：${this.gameState.currentPhase}
氛围：${currentScene?.atmosphere || '神秘'}

作为主持人，请根据以下内容生成引导语：
${context}

要求：
1. 以主持人的身份说话（使用"我"或"主持人"）
2. 营造沉浸式氛围
3. 适当引导玩家
4. 保持神秘感
5. 简洁有力（2-3句）

主持人：`;

        try {
            return await aiService.generateText(prompt);
        } catch (error) {
            return '游戏继续进行中...';
        }
    }

    /**
     * Get current scene information
     */
    getCurrentScene(): Scene | undefined {
        return this.script.scenes?.find(s => s.id === this.gameState.currentSceneId);
    }

    /**
     * Get game progress summary
     */
    getGameProgress() {
        return {
            phase: this.gameState.currentPhase,
            phaseIndex: this.currentPhaseIndex,
            totalPhases: this.phases.length,
            timelineProgress: this.gameState.timelineProgress,
            totalEvents: this.script.timeline?.length || 0,
            discoveredClues: this.gameState.discoveredClues.length,
            totalClues: this.script.clues?.length || 0,
        };
    }

    /**
     * Get current phase name
     */
    getCurrentPhase(): string {
        return this.phases[this.currentPhaseIndex] || 'unknown';
    }
}
