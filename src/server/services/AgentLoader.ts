import { CharacterAgent } from '../jubensha/agents/CharacterAgent';
import { agentRepository, type AgentConfig } from '../repositories/AgentRepository';
import { scriptRepository } from '../repositories/ScriptRepository';

/**
 * Agent加载器 - 从数据库加载Agent并初始化为CharacterAgent实例
 */
export class AgentLoader {
    private agentCache: Map<string, CharacterAgent> = new Map();

    /**
     * 根据剧本ID加载所有AI Agent
     */
    async loadAgentsByScript(scriptId: string): Promise<Map<string, CharacterAgent>> {
        // 1. 从数据库加载Agent配置
        const agentConfigs = await agentRepository.loadAgentsByScript(scriptId);

        // 2. 加载剧本信息（用于gameState）
        const script = await scriptRepository.getScriptById(scriptId);
        if (!script) {
            throw new Error(`Script not found: ${scriptId}`);
        }

        // 3. 构建游戏状态
        const gameState = {
            scriptId: script.id,
            scriptName: script.title,
            phase: 'WAITING' as const,
            players: [],
            scenes: script.scenes || [],
            discoveredClues: [],
            gameLog: []
        };

        // 4. 为每个Agent配置创建CharacterAgent实例
        const agents = new Map<string, CharacterAgent>();

        for (const config of agentConfigs) {
            // 检查缓存
            if (this.agentCache.has(config.id)) {
                agents.set(config.id, this.agentCache.get(config.id)!);
                continue;
            }

            // 构建Character对象
            const character = {
                id: config.id,
                name: config.characterName,
                role: config.characterDescription || '',
                personality: config.personality,
                secrets: config.secrets,
                avatar: '' // TODO: 头像生成
            };

            // 创建Agent实例
            const agent = new CharacterAgent(character, gameState);

            // 🔑 注入完整的System Prompt（包含所有秘密和人设）
            // @ts-ignore - 扩展CharacterAgent以支持自定义System Prompt
            agent.customSystemPrompt = config.systemPrompt;
            agent.agentConfig = config.agentConfig;

            agents.set(config.id, agent);
            this.agentCache.set(config.id, agent);
        }

        return agents;
    }

    /**
     * 加载单个Agent
     */
    async loadAgentById(agentId: string): Promise<CharacterAgent | null> {
        // 检查缓存
        if (this.agentCache.has(agentId)) {
            return this.agentCache.get(agentId)!;
        }

        // 从数据库加载
        const config = await agentRepository.getAgentById(agentId);
        if (!config) return null;

        // 加载剧本信息
        const script = await scriptRepository.getScriptById(config.scriptId);
        if (!script) return null;

        const gameState = {
            scriptId: script.id,
            scriptName: script.title,
            phase: 'WAITING' as const,
            players: [],
            scenes: script.scenes || [],
            discoveredClues: [],
            gameLog: []
        };

        const character = {
            id: config.id,
            name: config.characterName,
            role: config.characterDescription || '',
            personality: config.personality,
            secrets: config.secrets,
            avatar: ''
        };

        const agent = new CharacterAgent(character, gameState);
        // @ts-ignore
        agent.customSystemPrompt = config.systemPrompt;
        agent.agentConfig = config.agentConfig;

        this.agentCache.set(agentId, agent);
        return agent;
    }

    /**
     * 清除缓存
     */
    clearCache(scriptId?: string): void {
        if (scriptId) {
            // 清除特定剧本的Agent缓存
            for (const [id, agent] of this.agentCache) {
                // @ts-ignore
                if (agent.character?.scriptId === scriptId) {
                    this.agentCache.delete(id);
                }
            }
        } else {
            // 清除所有缓存
            this.agentCache.clear();
        }
    }

    /**
     * 更新Agent的游戏状态
     */
    updateGameState(agents: Map<string, CharacterAgent>, gameState: any): void {
        for (const agent of agents.values()) {
            agent.updateGameState?.(gameState);
        }
    }
}

export const agentLoader = new AgentLoader();
