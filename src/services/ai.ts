import axios from 'axios';
import type { ChatMessage, AICompanion } from '@/types';

const isViteEnv = typeof import.meta !== 'undefined' && (import.meta as any)?.env;
const env: Record<string, string | undefined> =
  (isViteEnv ? ((import.meta as any).env as Record<string, string | undefined>) : process.env);

// Provider selection
const AI_PROVIDER = (env?.VITE_AI_PROVIDER || env?.AI_PROVIDER || 'deepseek').toLowerCase();

// DeepSeek config
const DEEPSEEK_API_KEY = env?.VITE_DEEPSEEK_API_KEY || env?.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL =
  env?.VITE_DEEPSEEK_API_URL || env?.DEEPSEEK_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
const DEEPSEEK_MODEL = env?.VITE_DEEPSEEK_MODEL || env?.DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3.1-Terminus';

// Gemini config
const GEMINI_API_KEY = env?.VITE_GEMINI_API_KEY || env?.GEMINI_API_KEY || '';
const GEMINI_MODEL = env?.VITE_GEMINI_MODEL || env?.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_URL = (env?.VITE_GEMINI_API_URL || env?.GEMINI_API_URL || '')
  || `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Validate API configuration
if (AI_PROVIDER === 'deepseek') {
  if (!DEEPSEEK_API_KEY) {
    console.warn('⚠️ DeepSeek API key is not configured. AI features will not work.');
  }
  if (!env?.VITE_DEEPSEEK_API_URL && !env?.DEEPSEEK_API_URL) {
    console.warn('⚠️ DeepSeek API URL not set, using default:', DEEPSEEK_API_URL);
  }
} else if (AI_PROVIDER === 'gemini') {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ Gemini API key is not configured. AI features will not work.');
  }
}

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 创建DeepSeek客户端
const aiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
  },
});

// Gemini请求封装
async function chatWithGemini(messages: AIMessage[], companion?: AICompanion): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '抱歉，Gemini服务未配置，请联系管理员。';
  }

  const toGeminiContents = (msgs: AIMessage[]) => {
    return msgs.map((m) => ({
      role: m.role === 'assistant' ? 'model' : (m.role === 'system' ? 'user' : 'user'),
      parts: [{ text: m.content }],
    }));
  };

  const formatted = [...messages];
  if (companion) {
    const systemPrompt = aiService.generateSystemPrompt(companion);
    formatted.unshift({ role: 'system', content: systemPrompt });
  }

  const payload = { contents: toGeminiContents(formatted) };

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Gemini http ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || data?.candidates?.[0]?.output_text
      || '';
    return text || '抱歉，我现在无法回应。';
  } catch (e) {
    console.error('Gemini chat error:', e);
    return '抱歉，服务暂时不可用。';
  }
}

// AI对话服务
export const aiService = {
  async chat(messages: ChatMessage[], companion?: AICompanion): Promise<string> {
    const formattedMessages: AIMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) {
      return chatWithGemini(formattedMessages, companion);
    }

    if (!DEEPSEEK_API_KEY) {
      console.error('AI service not configured: Missing API key');
      return '抱歉，AI服务未配置，请联系管理员。';
    }

    try {
      // DeepSeek
      const withSystem = [...formattedMessages];
      if (companion) {
        const systemPrompt = this.generateSystemPrompt(companion);
        withSystem.unshift({ role: 'system', content: systemPrompt });
      }
      const response = await aiClient.post(DEEPSEEK_API_URL, {
        model: DEEPSEEK_MODEL,
        messages: withSystem,
        temperature: 0.7,
        max_tokens: 2000,
      });
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
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    if (!DEEPSEEK_API_KEY) {
      console.error('AI service not configured: Missing API key');
      onChunk('抱歉，AI服务未配置，请联系管理员。');
      return;
    }

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
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
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
    gameState: Record<string, unknown>,
    companion: AICompanion,
    role: string,
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
    userQuestion: string,
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
    companion: AICompanion,
  ): Promise<string> {
    const prompt = `你是高级文本冒险主持人，请用沉浸式叙述继续故事，并给出明确的选项：
【故事背景】
${storyContext}

【玩家行动】
${userAction}

【要求】
1. 先用2-3段文字描述新的场景与结果，保持连贯、具体、可视化。
2. 然后以“可选行动”列出3个可选项，每项使用“•”起始，句式简洁，利于点击选择。
3. 若存在风险或隐藏信息，请自然提示但不剧透。
4. 风格需与伴侣角色设定一致。`;

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
