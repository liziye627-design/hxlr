import axios from 'axios';
const isViteEnv = typeof import.meta !== 'undefined' && import.meta?.env;
const env = (isViteEnv ? import.meta.env : process.env);
const AI_PROVIDER = (env?.VITE_AI_PROVIDER || env?.AI_PROVIDER || 'deepseek').toLowerCase();
const DEEPSEEK_API_KEY = env?.VITE_DEEPSEEK_API_KEY || env?.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = env?.VITE_DEEPSEEK_API_URL || env?.DEEPSEEK_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
const DEEPSEEK_MODEL = env?.VITE_DEEPSEEK_MODEL || env?.DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3.1-Terminus';
const GEMINI_API_KEY = env?.VITE_GEMINI_API_KEY || env?.GEMINI_API_KEY || '';
const GEMINI_MODEL = env?.VITE_GEMINI_MODEL || env?.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_URL = (env?.VITE_GEMINI_API_URL || env?.GEMINI_API_URL || '')
    || `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
if (AI_PROVIDER === 'deepseek') {
    if (!DEEPSEEK_API_KEY) {
        console.warn('DeepSeek API key is not configured. AI features will not work.');
    }
    if (!env?.VITE_DEEPSEEK_API_URL && !env?.DEEPSEEK_API_URL) {
        console.warn('DeepSeek API URL not set, using default:', DEEPSEEK_API_URL);
    }
}
else if (AI_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
    console.warn('Gemini API key is not configured. AI features will not work.');
}
const aiClient = axios.create({
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
});
function buildOfficialPersonaPrompt(companion) {
    const officialPersona = companion.officialPersona;
    if (!officialPersona) {
        return '';
    }
    const lines = [
        'Official persona seed:',
        `- Official name: ${officialPersona.officialName}`,
        `- Asset type: ${officialPersona.assetType}`,
        `- Source: ${officialPersona.sourceLabel} (${officialPersona.sourceUrl})`,
        `- Role anchor: ${officialPersona.promptSeed.role}`,
        `- Visual cues: ${officialPersona.promptSeed.visual.join(', ')}`,
        `- Behavior cues: ${officialPersona.promptSeed.behavior.join(', ')}`,
        `- Voice cues: ${officialPersona.promptSeed.voice.join(', ')}`,
        'Usage constraints:',
        `- Compliance status: ${officialPersona.compliance.status}`,
        ...officialPersona.compliance.notes.map((note) => `- ${note}`),
        '- Use these cues as source material for tone, identity, and asset selection while keeping the current product role intact.',
    ];
    return `\n\n${lines.join('\n')}`;
}
async function chatWithGemini(messages, companion) {
    if (!GEMINI_API_KEY) {
        return '抱歉，Gemini 服务未配置，请联系管理员。';
    }
    const toGeminiContents = (items) => items.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
    }));
    const formatted = [...messages];
    if (companion) {
        formatted.unshift({ role: 'system', content: aiService.generateSystemPrompt(companion) });
    }
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: toGeminiContents(formatted) }),
        });
        if (!response.ok) {
            throw new Error(`Gemini http ${response.status}`);
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.candidates?.[0]?.output_text
            || '';
        return text || '抱歉，我现在无法回应。';
    }
    catch (error) {
        console.error('Gemini chat error:', error);
        return '抱歉，服务暂时不可用。';
    }
}
export const aiService = {
    async chat(messages, companion) {
        const formattedMessages = messages.map((message) => ({
            role: message.role,
            content: message.content,
        }));
        if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) {
            return chatWithGemini(formattedMessages, companion);
        }
        if (!DEEPSEEK_API_KEY) {
            console.error('AI service not configured: Missing API key');
            return '抱歉，AI 服务未配置，请联系管理员。';
        }
        try {
            const withSystem = [...formattedMessages];
            if (companion) {
                withSystem.unshift({ role: 'system', content: this.generateSystemPrompt(companion) });
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
        }
        catch (error) {
            console.error('AI chat error:', error);
            return '抱歉，服务暂时不可用。';
        }
    },
    async streamChat(messages, companion, onChunk) {
        if (!DEEPSEEK_API_KEY) {
            console.error('AI service not configured: Missing API key');
            onChunk('抱歉，AI 服务未配置，请联系管理员。');
            return;
        }
        try {
            const formattedMessages = messages.map((message) => ({
                role: message.role,
                content: message.content,
            }));
            if (companion) {
                formattedMessages.unshift({
                    role: 'system',
                    content: this.generateSystemPrompt(companion),
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
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) {
                        continue;
                    }
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices?.[0]?.delta?.content) {
                            onChunk(parsed.choices[0].delta.content);
                        }
                    }
                    catch {
                        // Ignore malformed stream chunks.
                    }
                }
            }
        }
        catch (error) {
            console.error('Stream chat error:', error);
            onChunk('抱歉，服务暂时不可用。');
        }
    },
    generateSystemPrompt(companion) {
        const lines = [`你是${companion.name}，一个AI游戏伴侣。`];
        if (companion.description) {
            lines.push(companion.description);
        }
        if (companion.personality) {
            lines.push('', '性格特征：');
            if (companion.personality.traits?.length) {
                lines.push(`- 特质：${companion.personality.traits.join('、')}`);
            }
            if (companion.personality.style) {
                lines.push(`- 风格：${companion.personality.style}`);
            }
        }
        if (companion.skills) {
            lines.push('', '能力特长：');
            if (companion.skills.strengths?.length) {
                lines.push(`- 擅长：${companion.skills.strengths.join('、')}`);
            }
            if (companion.skills.weakness) {
                lines.push(`- 弱点：${companion.skills.weakness}`);
            }
        }
        const officialPersonaPrompt = buildOfficialPersonaPrompt(companion);
        if (officialPersonaPrompt) {
            lines.push(officialPersonaPrompt);
        }
        lines.push('', '请根据你的性格特征和能力特长来回应用户，保持角色一致性。');
        return lines.join('\n');
    },
    async werewolfDecision(gameState, companion, role) {
        const prompt = `你正在玩狼人杀游戏，你的角色是${role}。当前游戏状态：${JSON.stringify(gameState)}

请根据你的角色和当前局势，做出合理的决策或发言。保持你的性格特征：${companion.personality?.traits.join('、') ?? ''}`;
        return this.chat([
            {
                id: '1',
                role: 'user',
                content: prompt,
                timestamp: new Date().toISOString(),
            },
        ], companion);
    },
    async scriptMurderInteraction(context, companion, userQuestion) {
        const prompt = `剧本杀背景：${context}

玩家问题：${userQuestion}

请根据你的角色和剧本背景，给出合适的回应。`;
        return this.chat([
            {
                id: '1',
                role: 'user',
                content: prompt,
                timestamp: new Date().toISOString(),
            },
        ], companion);
    },
    async adventureNarration(storyContext, userAction, companion) {
        const prompt = `你是高级文本冒险主持人，请用沉浸式叙事继续故事，并给出明确的选项。

【故事背景】${storyContext}

【玩家行动】${userAction}

【要求】
1. 先用 2-3 段文字描述新的场景与结果，保持连贯、具体、可视化。
2. 然后以“可选行动”列出 3 个选项，每项使用“①②③”起始，句式简洁，便于点击选择。
3. 如果存在风险或隐藏信息，请自然提示但不要剧透。
4. 风格需要与伴侣角色设定一致。`;
        return this.chat([
            {
                id: '1',
                role: 'user',
                content: prompt,
                timestamp: new Date().toISOString(),
            },
        ], companion);
    },
};
//# sourceMappingURL=ai.js.map