import axios from 'axios';
import type { ChatMessage, AICompanion } from '@/types';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL;
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL;

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 创建AI客户端
const aiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
  },
});

// AI对话服务
export const aiService = {
  async chat(messages: ChatMessage[], companion?: AICompanion): Promise<string> {
    try {
      const formattedMessages: AIMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 如果有AI伴侣，添加系统提示词
      if (companion) {
        const systemPrompt = this.generateSystemPrompt(companion);
        formattedMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }

      const response = await aiClient.post(DEEPSEEK_API_URL, {
        model: DEEPSEEK_MODEL,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      // 处理DeepSeek API响应
      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }

      return '抱歉，我现在无法回应。';
    } catch (error) {
      console.error('AI chat error:', error);
      return '抱歉，服务暂时不可用。';
    }
  },

  async streamChat(
    messages: ChatMessage[],
    companion: AICompanion | undefined,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const formattedMessages: AIMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (companion) {
        const systemPrompt = this.generateSystemPrompt(companion);
        formattedMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream chat error:', error);
      onChunk('抱歉，服务暂时不可用。');
    }
  },

  generateSystemPrompt(companion: AICompanion): string {
    const personality = companion.personality;
    const skills = companion.skills;

    let prompt = `你是${companion.name}，一个AI游戏伴侣。`;

    if (companion.description) {
      prompt += `\n${companion.description}`;
    }

    if (personality) {
      prompt += `\n\n性格特征：`;
      if (personality.traits) {
        prompt += `\n- 特质：${personality.traits.join('、')}`;
      }
      if (personality.style) {
        prompt += `\n- 风格：${personality.style}`;
      }
    }

    if (skills) {
      prompt += `\n\n能力特长：`;
      if (skills.strengths) {
        prompt += `\n- 擅长：${skills.strengths.join('、')}`;
      }
      if (skills.weakness) {
        prompt += `\n- 弱点：${skills.weakness}`;
      }
    }

    prompt += `\n\n请根据你的性格特征和能力特长来回应用户，保持角色一致性。`;

    return prompt;
  },

  // 狼人杀游戏AI决策
  async werewolfDecision(
    gameState: any,
    companion: AICompanion,
    role: string
  ): Promise<string> {
    const prompt = `你正在玩狼人杀游戏，你的角色是${role}。
当前游戏状态：${JSON.stringify(gameState)}

请根据你的角色和当前局势，做出合理的决策或发言。
保持你的性格特征：${companion.personality?.traits.join('、')}`;

    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ];

    return this.chat(messages, companion);
  },

  // 剧本杀游戏AI互动
  async scriptMurderInteraction(
    context: string,
    companion: AICompanion,
    userQuestion: string
  ): Promise<string> {
    const prompt = `剧本杀游戏背景：${context}

玩家问题：${userQuestion}

请根据你的角色和剧本背景，给出合适的回应。`;

    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ];

    return this.chat(messages, companion);
  },

  // 数字冒险游戏AI叙述
  async adventureNarration(
    storyContext: string,
    userAction: string,
    companion: AICompanion
  ): Promise<string> {
    const prompt = `故事背景：${storyContext}

玩家行动：${userAction}

作为游戏主持人，请描述接下来发生的事情，并提供2-3个可选的行动选项。`;

    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ];

    return this.chat(messages, companion);
  },
};
