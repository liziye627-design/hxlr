import type { CharacterInfo, ScriptAnalysis } from './scriptAnalyzer';

export interface AgentConfig {
    id: string;
    scriptId?: string;
    characterName: string;
    characterAge?: number;
    characterDescription?: string;
    personality: string;
    secrets: string[];
    coreEssence: string;
    systemPrompt: string;
    agentConfig: {
        relationships?: Array<{
            target: string;
            type: string;
            description: string;
        }>;
        speechPatterns?: {
            tone: string;
            keywords: string[];
            forbiddenTopics: string[];
        };
    };
}

/**
 * Agent配置生成器 - 将提取的角色信息转换为完整的Agent配置
 */
export class AgentConfigGenerator {
    /**
     * 生成System Prompt
     */
    private generateSystemPrompt(characterInfo: CharacterInfo): string {
        return `你现在扮演剧本杀角色【${characterInfo.name}】。

**角色设定：**
- 姓名：${characterInfo.name}
${characterInfo.age ? `- 年龄：${characterInfo.age}岁` : ''}
- 外貌：${characterInfo.description}
- 核心驱动力：${characterInfo.coreEssence}

**性格：**
${characterInfo.personality.map(p => `- ${p}`).join('\n')}

**秘密（绝对不能主动暴露）：**
${characterInfo.secrets.map(s => `- ${s}`).join('\n')}

${characterInfo.relationships && characterInfo.relationships.length > 0 ? `
**人际关系：**
${characterInfo.relationships.map(r => `- ${r.target}：${r.type}（${r.description}）`).join('\n')}
` : ''}

${characterInfo.speechPatterns ? `
**语言风格：**
- 语气：${characterInfo.speechPatterns.tone}
- 常用词：${characterInfo.speechPatterns.keywords.join('、')}
- 禁忌话题：${characterInfo.speechPatterns.forbiddenTopics.join('、')}
` : ''}

**行为准则：**
1. 始终保持角色一致性，符合你的性格和核心驱动力
2. 绝不主动暴露你的秘密
3. 如被质问秘密，可以撒谎、转移话题、反问或表现出情绪反应
4. 根据人际关系调整对不同角色的态度
5. 语言要符合你的语气和风格
6. 回答要简洁自然，3-5句话为宜

请记住：你就是${characterInfo.name}，完全沉浸在这个角色中。`;
    }

    /**
     * 生成单个Agent配置
     */
    generateAgentConfig(characterInfo: CharacterInfo, scriptId?: string): AgentConfig {
        const agentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        return {
            id: agentId,
            scriptId,
            characterName: characterInfo.name,
            characterAge: characterInfo.age,
            characterDescription: characterInfo.description,
            personality: characterInfo.personality.join(', '),
            secrets: characterInfo.secrets,
            coreEssence: characterInfo.coreEssence,
            systemPrompt: this.generateSystemPrompt(characterInfo),
            agentConfig: {
                relationships: characterInfo.relationships,
                speechPatterns: characterInfo.speechPatterns
            }
        };
    }

    /**
     * 批量生成所有Agent配置
     */
    generateAllAgentConfigs(scriptAnalysis: ScriptAnalysis, scriptId?: string): AgentConfig[] {
        return scriptAnalysis.characters.map(character =>
            this.generateAgentConfig(character, scriptId)
        );
    }
}

export const agentConfigGenerator = new AgentConfigGenerator();

// Export for convenience
export function generateAllAgentConfigs(scriptAnalysis: ScriptAnalysis, scriptId?: string) {
    return agentConfigGenerator.generateAllAgentConfigs(scriptAnalysis, scriptId);
}
