import type { ScriptData, Scene, GameState, Message, AgentResponse, Clue } from '../types';
import { aiService } from '@/services/ai';

/**
 * NarratorAgent - Master controller for the entire Script Murder game
 * Manages scenes, narration, clues, and overall game flow
 */
export class NarratorAgent {
    private script: ScriptData;
    private gameState: GameState;

    constructor(script: ScriptData, gameState: GameState) {
        this.script = script;
        this.gameState = gameState;
    }

    /**
     * Initialize the game with opening narration
     */
    async initializeGame(): Promise<AgentResponse> {
        const firstScene = this.script.scenes[0];
        this.gameState.currentSceneId = firstScene.id;
        this.gameState.currentPhase = 'intro';

        const narration = await this.generateNarration(
            `介绍剧本《${this.script.title}》的开场，设定整体氛围和背景故事。`
        );

        return {
            type: 'narration',
            content: narration,
            metadata: {
                newSceneId: firstScene.id,
            },
        };
    }

    /**
     * Progress the story forward based on timeline
     */
    async progressStory(): Promise<AgentResponse> {
        this.gameState.timelineProgress++;

        const currentEvent = this.script.timeline[this.gameState.timelineProgress];

        if (!currentEvent) {
            return {
                type: 'narration',
                content: '故事已经到了尾声，请根据你掌握的线索，推理出真相吧。',
            };
        }

        switch (currentEvent.action) {
            case 'scene_change':
                return await this.changeScene(currentEvent.sceneId);

            case 'narration':
                return {
                    type: 'narration',
                    content: currentEvent.content,
                };

            case 'clue_reveal':
                return this.revealClue(currentEvent.content);

            default:
                return {
                    type: 'narration',
                    content: '时间缓缓流逝...',
                };
        }
    }

    /**
     * Change to a new scene
     */
    async changeScene(sceneId: string): Promise<AgentResponse> {
        const newScene = this.script.scenes.find(s => s.id === sceneId);

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
            content: narration,
            metadata: {
                newSceneId: sceneId,
            },
        };
    }

    /**
     * Describe a scene with atmospheric detail
     */
    private async describeScene(scene: Scene): Promise<string> {
        const prompt = `作为剧本杀的旁白，描述以下场景的氛围和细节：

场景名称：${scene.name}
场景描述：${scene.description}
氛围：${scene.atmosphere}

请用2-3句话生动描述这个场景，营造沉浸感。`;

        try {
            return await aiService.generateText(prompt);
        } catch (error) {
            return `${scene.description}`;
        }
    }

    /**
     * Provide atmospheric narration
     */
    async narrateEvent(event: string): Promise<string> {
        return await this.generateNarration(event);
    }

    /**
     * Reveal clues based on investigation
     */
    revealClue(clueId?: string): AgentResponse {
        const availableClues = this.script.clues.filter(
            clue => !clue.discovered && !this.gameState.discoveredClues.includes(clue.id)
        );

        if (availableClues.length === 0) {
            return {
                type: 'narration',
                content: '你仔细搜查了current_scene，但没有发现更多线索。',
            };
        }

        // Reveal specific clue or random one
        const clueToReveal = clueId
            ? this.script.clues.find(c => c.id === clueId)
            : availableClues[Math.floor(Math.random() * availableClues.length)];

        if (!clueToReveal) {
            return {
                type: 'narration',
                content: '你仔细搜查了周围，但没有发现新的线索。',
            };
        }

        // Mark as discovered
        this.gameState.discoveredClues.push(clueToReveal.id);

        return {
            type: 'clue_reveal',
            content: `你发现了一条重要线索：\n\n【${clueToReveal.name}】\n${clueToReveal.description}`,
            metadata: {
                clueIds: [clueToReveal.id],
            },
        };
    }

    /**
     * Generate atmospheric narration using AI
     */
    private async generateNarration(context: string): Promise<string> {
        const currentScene = this.script.scenes.find(s => s.id === this.gameState.currentSceneId);

        const prompt = `你是《${this.script.title}》剧本杀的旁白。

当前场景：${currentScene?.name || '未知'}
氛围：${currentScene?.atmosphere || '神秘'}

请根据以下内容，生成2-3句沉浸式的旁白叙述：
${context}

要求：
1. 营造氛围感
2. 推动剧情
3. 引发悬念
4. 简洁有力

旁白：`;

        try {
            return await aiService.generateText(prompt);
        } catch (error) {
            return '故事继续发展着...';
        }
    }

    /**
     * Get current scene information
     */
    getCurrentScene(): Scene | undefined {
        return this.script.scenes.find(s => s.id === this.gameState.currentSceneId);
    }

    /**
     * Get game progress summary
     */
    getGameProgress() {
        return {
            phase: this.gameState.currentPhase,
            timelineProgress: this.gameState.timelineProgress,
            totalEvents: this.script.timeline.length,
            discoveredClues: this.gameState.discoveredClues.length,
            totalClues: this.script.clues.length,
        };
    }
}
