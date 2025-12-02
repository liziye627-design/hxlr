import { GameMasterAgent } from './GameMasterAgent';
import { CharacterAgent } from './CharacterAgent';
import type { ScriptData, GameState, PlayerAction, AgentResponse } from '../types';

/**
 * AgentOrchestrator - Coordinates all agents (GM + Characters)
 * Routes player actions to appropriate agents
 */
export class AgentOrchestrator {
    private gameMaster: GameMasterAgent;
    private characterAgents: Map<string, CharacterAgent> = new Map();
    private gameState: GameState;

    constructor(script: ScriptData, gameState: GameState, handbookPath?: string) {
        this.gameState = gameState;
        this.gameMaster = new GameMasterAgent(script, gameState, handbookPath);

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
                return await this.gameMaster.progressStory();

            case 'investigate':
                return this.gameMaster.revealClue();

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
                // General chat goes to GM for context-aware response
                if (action.message) {
                    const narration = await this.gameMaster.narrateEvent(
                        `玩家说：${action.message}。请作为主持人，对此做出回应。`
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
        return await this.gameMaster.initializeGame();
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
        return this.gameMaster.getCurrentScene();
    }

    /**
     * Get game progress
     */
    getGameProgress() {
        return this.gameMaster.getGameProgress();
    }

    /**
     * Broadcast message to all agents (for future multi-agent interaction)
     */
    async broadcastToAllAgents(message: string): Promise<void> {
        // Future: Could be used for agents to react to events
        console.log(`Broadcasting to all agents: ${message}`);
    }
}
