import type { Character, Message, GameState, AgentResponse } from '../types';
import { aiService } from '../../../services/ai';

/**
 * CharacterAgent - Represents an NPC character in the script
 * Each character has unique personality, secrets, and responds to player questions
 */
export class CharacterAgent {
    private character: Character;
    private gameState: GameState;
    private conversationHistory: Message[] = [];

    constructor(character: Character, gameState: GameState) {
        this.character = character;
        this.gameState = gameState;
    }

    /**
     * Generate response to player question based on character personality
     */
    async respond(playerMessage: string): Promise<AgentResponse> {
        // Build context for AI
        const context = this.buildContext();
        const prompt = this.buildPrompt(playerMessage, context);

        try {
            // Get AI response
            const response = await aiService.chat([{ role: 'user', content: prompt }]);

            // Record in history
            this.conversationHistory.push({
                id: Date.now().toString(),
                sender: 'player',
                senderType: 'player',
                content: playerMessage,
                timestamp: Date.now(),
            });

            this.conversationHistory.push({
                id: (Date.now() + 1).toString(),
                sender: this.character.name,
                senderType: 'character',
                content: response,
                timestamp: Date.now() + 1,
                metadata: { characterId: this.character.id },
            });

            return {
                type: 'dialogue',
                content: response,
                metadata: {
                    characterId: this.character.id,
                },
            };
        } catch (error) {
            console.error(`CharacterAgent ${this.character.name} error:`, error);
            return {
                type: 'dialogue',
                content: '抱歉，我现在有点不知所措...',
                metadata: { characterId: this.character.id },
            };
        }
    }

    /**
     * Build context for AI prompt
     */
    private buildContext(): string {
        const discoveredClues = this.gameState.discoveredClues.join(', ') || '无';
        const recentHistory = this.conversationHistory.slice(-5)
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');

        return `
当前场景信息：
- 玩家已发现的线索：${discoveredClues}
- 最近对话历史：
${recentHistory || '（暂无对话历史）'}
`;
    }

    /**
     * Build AI prompt for character response
     */
    public customSystemPrompt?: string;
    public agentConfig?: any;

    /**
     * Build AI prompt for character response
     */
    private buildPrompt(playerMessage: string, context: string): string {
        // 🆕 Use custom system prompt if available (from database)
        if (this.customSystemPrompt) {
            return `${this.customSystemPrompt}

${context}

玩家问你："${playerMessage}"

请根据你的角色设定、性格和秘密，做出合理的回应。`;
        }

        // Fallback to default prompt generation
        return `你是《${this.gameState.scriptId}》剧本杀中的角色：${this.character.name}

角色设定：
- 名字：${this.character.name}
- 身份：${this.character.role}
- 性格：${this.character.personality}
- 秘密：${this.character.secrets.join('; ')}

${context}

玩家问你："${playerMessage}"

请根据你的角色设定、性格和秘密，做出合理的回应。注意：
1. 保持角色一致性，符合你的性格
2. 如果问题涉及到你的秘密，你可以选择隐瞒、撒谎或转移话题
3. 如果你不知道答案，可以表达困惑或不知情
4. 回答要简洁，3-5句话为宜
5. 语气要符合角色性格

你的回答：`;
    }

    /**
     * React to story events
     */
    reactToEvent(event: string): string {
        // Simple reaction based on character
        return `${this.character.name}对此感到${this.getReactionEmotion()}`;
    }

    private getReactionEmotion(): string {
        // Simple emotion based on personality
        if (this.character.personality.includes('冷静')) return '平静';
        if (this.character.personality.includes('紧张')) return '不安';
        if (this.character.personality.includes('开朗')) return '好奇';
        return '若有所思';
    }

    getCharacterInfo() {
        return {
            id: this.character.id,
            name: this.character.name,
            role: this.character.role,
            avatar: this.character.avatar,
        };
    }
}
