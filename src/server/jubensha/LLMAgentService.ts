/**
 * LLM Agent Service - 大模型角色扮演服务
 * 支持多种LLM API（OpenAI, Claude, 通义千问等）
 * 每个角色可配置独立的API
 */

import { generateAgentSystemPrompt, detectDeviation, generateCorrectionResponse } from './FateCorrection';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CharacterLLMConfig extends LLMConfig {
  characterId: string;
  characterName: string;
  scriptId: string;
  traits: string;
  hiddenSecret: string;
  currentPhase: string;
  currentGoal: string;
  missionObjective: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 从环境变量获取LLM配置
 */
export function getLLMConfigFromEnv(): LLMConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LLMConfig['provider']) || 'openai',
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL,
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.8'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000')
  };
}

/**
 * 调用LLM API
 */
export async function callLLM(
  config: LLMConfig,
  messages: ConversationMessage[]
): Promise<string> {
  const { provider, apiKey, baseUrl, model, temperature, maxTokens } = config;
  
  if (!apiKey) {
    throw new Error('LLM API Key not configured');
  }

  let url: string;
  let headers: Record<string, string>;
  let body: unknown;

  switch (provider) {
    case 'openai':
      url = `${baseUrl || 'https://api.openai.com'}/v1/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = {
        model,
        messages,
        temperature: temperature || 0.8,
        max_tokens: maxTokens || 1000
      };
      break;

    case 'anthropic':
      url = `${baseUrl || 'https://api.anthropic.com'}/v1/messages`;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      // Convert messages format for Claude
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const otherMsgs = messages.filter(m => m.role !== 'system');
      body = {
        model,
        system: systemMsg,
        messages: otherMsgs,
        max_tokens: maxTokens || 1000
      };
      break;

    case 'qwen':
      url = `${baseUrl || 'https://dashscope.aliyuncs.com'}/api/v1/services/aigc/text-generation/generation`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = {
        model: model || 'qwen-turbo',
        input: { messages },
        parameters: { temperature: temperature || 0.8 }
      };
      break;

    case 'deepseek':
      url = `${baseUrl || 'https://api.deepseek.com'}/v1/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = {
        model: model || 'deepseek-chat',
        messages,
        temperature: temperature || 0.8,
        max_tokens: maxTokens || 1000
      };
      break;

    default:
      url = `${baseUrl}/v1/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = {
        model,
        messages,
        temperature: temperature || 0.8,
        max_tokens: maxTokens || 1000
      };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;
    
    // Extract response based on provider
    if (provider === 'anthropic') {
      const content = data.content as Array<{ text: string }> | undefined;
      return content?.[0]?.text || '';
    } else if (provider === 'qwen') {
      const output = data.output as { text: string } | undefined;
      return output?.text || '';
    } else {
      const choices = data.choices as Array<{ message: { content: string } }> | undefined;
      return choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('LLM API call failed:', error);
    throw error;
  }
}

/**
 * 角色Agent类 - 处理角色对话和命运修正
 */
export class CharacterAgent {
  private config: CharacterLLMConfig;
  private conversationHistory: ConversationMessage[] = [];
  private systemPrompt: string;

  constructor(config: CharacterLLMConfig) {
    this.config = config;
    this.systemPrompt = generateAgentSystemPrompt({
      characterName: config.characterName,
      scriptName: config.scriptId,
      traits: config.traits,
      hiddenSecret: config.hiddenSecret,
      currentGoal: config.currentGoal,
      missionObjective: config.missionObjective,
      correctionStrategies: ['mental', 'blackout', 'emotional', 'environmental']
    });
    
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt
    });
  }

  /**
   * 处理玩家输入并生成回复
   */
  async respond(playerInput: string): Promise<string> {
    // 检测是否偏离剧本
    const deviation = detectDeviation(playerInput, this.config.currentGoal);
    
    // 添加玩家消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: playerInput
    });

    let response: string;

    try {
      // 如果配置了API，调用LLM
      if (this.config.apiKey) {
        response = await callLLM(this.config, this.conversationHistory);
      } else {
        // 没有API时使用本地逻辑
        if (deviation.isDeviating) {
          response = generateCorrectionResponse(
            deviation.deviationType,
            this.config.characterName,
            playerInput,
            '原来的位置',
            '那个关键的线索'
          );
        } else {
          response = this.generateLocalResponse(playerInput);
        }
      }
    } catch (error) {
      // API调用失败时回退到本地逻辑
      console.error('LLM call failed, using local response:', error);
      if (deviation.isDeviating) {
        response = generateCorrectionResponse(
          deviation.deviationType,
          this.config.characterName,
          playerInput,
          '原来的位置',
          '那个关键的线索'
        );
      } else {
        response = this.generateLocalResponse(playerInput);
      }
    }

    // 添加助手回复到历史
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });

    return response;
  }

  /**
   * 本地回复生成（无API时使用）
   */
  private generateLocalResponse(input: string): string {
    const responses = [
      `（${this.config.characterName}思考了一下）这个问题很有意思...让我想想...`,
      `（${this.config.characterName}看着你）你为什么会这么问？`,
      `关于这件事...我觉得我们应该先弄清楚${this.config.missionObjective}。`,
      `（${this.config.characterName}叹了口气）事情比你想象的要复杂得多...`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 更新当前阶段目标
   */
  updatePhase(phase: string, goal: string, objective: string) {
    this.config.currentPhase = phase;
    this.config.currentGoal = goal;
    this.config.missionObjective = objective;
    
    // 更新系统提示
    this.systemPrompt = generateAgentSystemPrompt({
      characterName: this.config.characterName,
      scriptName: this.config.scriptId,
      traits: this.config.traits,
      hiddenSecret: this.config.hiddenSecret,
      currentGoal: goal,
      missionObjective: objective,
      correctionStrategies: ['mental', 'blackout', 'emotional', 'environmental']
    });
    
    // 更新对话历史中的系统消息
    this.conversationHistory[0] = {
      role: 'system',
      content: this.systemPrompt
    };
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = [{
      role: 'system',
      content: this.systemPrompt
    }];
  }
}

export default {
  getLLMConfigFromEnv,
  callLLM,
  CharacterAgent
};
