import { NarratorAgent } from './NarratorAgent';
import { CharacterAgent } from './CharacterAgent';
import type { ScriptData, GameState, PlayerAction, AgentResponse } from '../types';

/**
 * AgentOrchestrator - Coordinates all agents (Narrator + Characters)
 * Routes player actions to appropriate agents
 */
export class AgentOrchestrator {
    private narratorAgent: NarratorAgent;
    private characterAgents: Map<string, CharacterAgent> = new Map();
    private gameState: GameState;

    constructor(script: ScriptData, gameState: GameState) {
        this.gameState = gameState;
        this.narratorAgent = new NarratorAgent(script, gameState);

        // Initialize character agents
        script.characters.forEach(character => {
            const agent = new CharacterAgent(character, gameState);
            this.characterAgents.set(character.id, agent);
        });
    }

    /**
     * Route player action to appropriate agent
     */
    async routePlayerAction(action: PlayerAction): Promise<AgentResponse> {
        switch (action.type) {
            case 'story_progress':
                return await this.narratorAgent.progressStory();

            case 'investigate':
                return this.narratorAgent.revealClue();

            case 'ask_character':
                if (!action.characterId || !action.message) {
                    return {
                        type: 'system',
                        content: '请选择要询问的角色并输入问题',
                    };
                }
                const characterAgent = this.characterAgents.get(action.characterId);
                if (!characterAgent) {
                    return {
                        type: 'system',
                        content: '未找到该角色',
                    };
                }
                return await characterAgent.respond(action.message);

            case 'chat':
                // General chat goes to narrator for context-aware response
                if (action.message) {
                    const narration = await this.narratorAgent.narrateEvent(
                        `玩家说：${action.message}。请作为旁白，对此做出回应。`
                    );
                    return {
                        type: 'narration',
                        content: narration,
                    };
                }
                return {
                    type: 'system',
                    content: '请输入消息',
                };

            default:
                return {
                    type: 'system',
                    content: '未知操作',
                };
        }
    }

    /**
     * Initialize the game
     */
    async initializeGame(): Promise<AgentResponse> {
        return await this.narratorAgent.initializeGame();
    }

    /**
     * Get all character information for UI
     */
    getCharacters() {
        return Array.from(this.characterAgents.values()).map(agent =>
            agent.getCharacterInfo()
        );
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return this.narratorAgent.getCurrentScene();
    }

    /**
     * Get game progress
     */
    getGameProgress() {
        return this.narratorAgent.getGameProgress();
    }

    /**
     * Broadcast message to all agents (for future multi-agent interaction)
     */
    async broadcastToAllAgents(message: string): Promise<void> {
        // Future: Could be used for agents to react to events
        console.log(`Broadcasting to all agents: ${message}`);
    }
}
