import { aiService } from '@/services/ai';

export interface CharacterInfo {
    name: string;
    age?: number;
    description: string;
    personality: string[];
    secrets: string[];
    coreEssence: string; // 第一性原理
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
}

export interface ScriptAnalysis {
    title: string;
    summary?: string;
    characters: CharacterInfo[];
    scenes?: Array<{ name: string; description: string }>;
    clues?: Array<{ title: string; location: string }>;
    game_flow?: string[];
}

/**
 * 剧本分析服务 - 使用LLM提取结构化信息
 */
export class ScriptAnalyzer {
    /**
     * 分析主持人手册，提取全局信息
     */
    private async analyzeDMHandbook(dmText: string): Promise<{
        title: string;
        summary: string;
        scenes: Array<{ name: string; description: string }>;
        clues: Array<{ title: string; location: string }>;
        gameFlow: string[];
    }> {
        const prompt = `你是一个剧本杀剧本分析专家。请分析以下主持人手册，提取关键信息。

主持人手册内容（前10000字）：
${dmText.slice(0, 10000)}

请以JSON格式返回（仅返回JSON，不要其他文字）：
{
  "title": "剧本名称",
  "summary": "剧本概述（50字以内）",
  "scenes": [{"name": "场景名", "description": "描述"}],
  "clues": [{"title": "线索名", "location": "位置"}],
  "gameFlow": ["阶段1", "阶段2", ...]
}`;

        try {
            const response = await aiService.generateText(prompt);
            // 尝试提取JSON（可能包含在markdown代码块中）
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (error) {
            console.error('[ScriptAnalyzer] Failed to parse DM handbook:', error);
            // 返回默认值
            return {
                title: '未命名剧本',
                summary: '',
                scenes: [],
                clues: [],
                gameFlow: ['INTRO', 'DISCUSSION', 'VOTE', 'REVEAL']
            };
        }
    }

    /**
     * 分析单个角色剧本
     */
    private async analyzeCharacterScript(
        characterText: string,
        index: number
    ): Promise<CharacterInfo> {
        const prompt = `你是剧本杀角色分析专家。请深度分析以下角色剧本，提取角色的完整信息。

角色剧本内容（前8000字）：
${characterText.slice(0, 8000)}

请以JSON格式返回（仅返回JSON，不要其他文字）：
{
  "name": "角色名字",
  "age": 年龄（数字），
  "description": "外貌和基本描述（30字以内）",
  "personality": ["性格特点1", "性格特点2"],
  "secrets": ["秘密1（具体事件）", "秘密2"],
  "coreEssence": "第一性原理（核心驱动力，10字以内）",
  "relationships": [
    {"target": "其他角色名", "type": "关系类型", "description": "关系描述"}
  ],
  "speechPatterns": {
    "tone": "说话语气描述",
    "keywords": ["常用词1", "常用词2"],
    "forbiddenTopics": ["禁忌话题1", "禁忌话题2"]
  }
}`;

        try {
            const response = await aiService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (error) {
            console.error(`[ScriptAnalyzer] Failed to analyze character ${index}:`, error);
            // 返回默认角色
            return {
                name: `角色${index + 1}`,
                description: '神秘角色',
                personality: ['冷静'],
                secrets: ['有不可告人的秘密'],
                coreEssence: '未知驱动力'
            };
        }
    }

    /**
     * 分析完整剧本（主持人手册 + 所有角色剧本）
     */
    async analyzeScript(
        dmText: string,
        characterTexts: Array<{ index: number; text: string }>
    ): Promise<ScriptAnalysis> {
        console.log('[ScriptAnalyzer] Analyzing DM handbook...');
        const globalInfo = await this.analyzeDMHandbook(dmText);

        console.log(`[ScriptAnalyzer] Analyzing ${characterTexts.length} character scripts...`);
        const characters = await Promise.all(
            characterTexts.map(({ index, text }) =>
                this.analyzeCharacterScript(text, index)
            )
        );

        console.log('[ScriptAnalyzer] Analysis complete');
        return {
            title: globalInfo.title,
            summary: globalInfo.summary,
            characters,
            scenes: globalInfo.scenes,
            clues: globalInfo.clues,
            game_flow: globalInfo.gameFlow
        };
    }
}

export const scriptAnalyzer = new ScriptAnalyzer();

// Export for convenience
export async function analyzeScript(
    dmText: string,
    characterTexts: Array<{ index: number; text: string }>
) {
    return scriptAnalyzer.analyzeScript(dmText, characterTexts);
}
