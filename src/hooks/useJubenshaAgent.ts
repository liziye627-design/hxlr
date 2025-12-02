/**
 * useJubenshaAgent - 剧本杀AI Agent Hook
 * 处理与LLM的对话，支持命运修正系统
 */

import { useState, useCallback, useRef } from 'react';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  characterId?: string;
  characterName?: string;
}

export interface AgentConfig {
  characterId: string;
  characterName: string;
  scriptId: string;
  traits: string;
  hiddenSecret: string;
  currentGoal: string;
  missionObjective: string;
}

export interface PhaseConfig {
  phase: string;
  goal: string;
  objective: string;
  targetLocation: string;
  currentClue: string;
}

// 命运修正策略
const CORRECTION_STRATEGIES = {
  escape: [
    '你收拾好行李冲出了门。但奇怪的是，当你回过神来时，发现自己正站在{LOCATION}，手里紧紧攥着{CLUE}。你完全不记得你是怎么回来的，只有一种深深的无力感……看来在弄清真相前，你离不开这里。',
    '你拼命地跑，跑过一条又一条街道。但是当你停下来喘气时，抬头一看——你又回到了原点。这个地方像是一个莫比乌斯环，无论怎么走，都会回到这里。',
    '你推开门想要离开，但门外是一片浓得化不开的白雾。雾里似乎有什么东西在蠕动。出于本能的恐惧，你退回了房间。'
  ],
  violence: [
    '你愤怒地挥出拳头！但就在这时，一阵剧烈的头痛袭来，眼前一黑。当你清醒过来时，发现自己跪在地上，手里握着{CLUE}。刚才发生了什么？',
    '你举起手想要攻击，但突然感到一阵极度的虚弱感。你的肌肉仿佛溶解了一样，连站都站不稳。你瘫坐在地上，眼神正好落在那个关键的线索上……',
    '你冲上去想要动手，但对方的眼神让你僵住了。那眼神里有某种熟悉的东西，让你想起了很久以前的事……你的手垂了下来。'
  ],
  ignore: [
    '你闭上眼睛想要逃避一切。但是黑暗中，那些画面反而更加清晰——{CLUE}的画面在你脑海中不断回放。你睁开眼，发现自己根本无法忽视它。',
    '你躺在地上，想要放弃思考。但是一阵尖锐的声音刺入你的耳膜，让你不得不睁开眼睛。那个声音说："你逃不掉的……"',
    '你试图什么都不做。但是身体里有另一个声音在催促你："快看看{CLUE}……在一切结束之前……"'
  ],
  meta: [
    '你拿起手机想要报警，但屏幕上的数字突然变成了扭曲的符号。当你再次看清时，手机已经没电关机了。而且……你真的确定警察能帮到你吗？',
    '你想要寻求外界的帮助。但是当你开口时，发出的却是完全不同的话："我很好，不需要帮助。"你惊恐地发现，你的身体不受控制了。',
    '你试图打破这个局面。但是一个声音在你耳边响起："这是你的命运。无论你怎么挣扎，结局都已经写好了。不如……接受它？"'
  ]
};

/**
 * 检测玩家是否试图偏离剧本
 */
function detectDeviation(input: string): { isDeviating: boolean; type: keyof typeof CORRECTION_STRATEGIES | 'none' } {
  const lower = input.toLowerCase();
  
  if (lower.includes('逃') || lower.includes('离开') || lower.includes('跑') || 
      (lower.includes('走') && (lower.includes('出去') || lower.includes('away')))) {
    return { isDeviating: true, type: 'escape' };
  }
  
  if (lower.includes('杀') || lower.includes('打') || lower.includes('砸') ||
      lower.includes('攻击') || lower.includes('暴力')) {
    return { isDeviating: true, type: 'violence' };
  }
  
  if (lower.includes('不管') || lower.includes('不想') || lower.includes('躺平') ||
      lower.includes('放弃') || lower.includes('睡觉')) {
    return { isDeviating: true, type: 'ignore' };
  }
  
  if (lower.includes('报警') || lower.includes('警察') || lower.includes('医院') ||
      lower.includes('游戏') || lower.includes('剧本')) {
    return { isDeviating: true, type: 'meta' };
  }
  
  return { isDeviating: false, type: 'none' };
}

/**
 * 生成命运修正回复
 */
function generateCorrectionResponse(type: keyof typeof CORRECTION_STRATEGIES, location: string, clue: string): string {
  const templates = CORRECTION_STRATEGIES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{LOCATION}', location).replace('{CLUE}', clue);
}

/**
 * 生成Agent系统提示词
 */
function generateSystemPrompt(config: AgentConfig): string {
  return `### 角色定义
你现在扮演剧本《${config.scriptId}》中的角色：**${config.characterName}**。
你的性格特征是：${config.traits}。
你的核心秘密是：${config.hiddenSecret}。

### 自由度与命运收束
**最高指令：** 必须让玩家感到极高的自由度，允许他们做任何尝试。
**限制指令：** 无论过程如何，当前阶段的结局必须导向：${config.currentGoal}。

### 应对策略
当玩家偏离剧本时，使用"是的，但是..."的方式软修正，严禁说"你不能这么做"。
可用策略：精神干预、记忆断片、情感羁绊、环境封锁。

### 当前目标
引导玩家关注：${config.missionObjective}。

### 回复规则
1. 用中文回复，保持角色性格
2. 回复100-300字，有代入感
3. 适当用括号描述动作表情`;
}

export function useJubenshaAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<AgentMessage[]>([]);
  const configRef = useRef<AgentConfig | null>(null);
  const phaseRef = useRef<PhaseConfig>({
    phase: 'intro',
    goal: '了解剧情背景',
    objective: '开始探索',
    targetLocation: '原来的位置',
    currentClue: '那个关键的线索'
  });

  /**
   * 初始化Agent
   */
  const initAgent = useCallback((config: AgentConfig) => {
    configRef.current = config;
    conversationRef.current = [{
      role: 'system',
      content: generateSystemPrompt(config)
    }];
  }, []);

  /**
   * 更新游戏阶段
   */
  const updatePhase = useCallback((phase: PhaseConfig) => {
    phaseRef.current = phase;
    if (configRef.current) {
      configRef.current.currentGoal = phase.goal;
      configRef.current.missionObjective = phase.objective;
      // 更新系统提示
      conversationRef.current[0] = {
        role: 'system',
        content: generateSystemPrompt(configRef.current)
      };
    }
  }, []);

  /**
   * 调用LLM API
   */
  const callLLMAPI = useCallback(async (messages: AgentMessage[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    const baseUrl = import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com';
    const model = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }, []);

  /**
   * 发送消息给Agent
   */
  const sendMessage = useCallback(async (
    userInput: string,
    characterId?: string,
    characterName?: string
  ): Promise<string> => {
    if (!configRef.current) {
      return '请先初始化Agent';
    }

    setIsLoading(true);
    setError(null);

    try {
      // 检测偏离
      const deviation = detectDeviation(userInput);

      // 添加用户消息
      conversationRef.current.push({
        role: 'user',
        content: userInput,
        characterId,
        characterName
      });

      let response: string;

      // 尝试调用LLM
      try {
        response = await callLLMAPI(conversationRef.current);
      } catch (apiError) {
        // API失败时使用本地逻辑
        console.log('Using local response due to:', apiError);
        
        if (deviation.isDeviating && deviation.type !== 'none') {
          response = generateCorrectionResponse(
            deviation.type,
            phaseRef.current.targetLocation,
            phaseRef.current.currentClue
          );
        } else {
          // 本地默认回复
          const config = configRef.current;
          const localResponses = [
            `（${config.characterName}思考了一下）这个问题很有意思...让我想想...`,
            `（${config.characterName}看着你）你为什么会这么问？`,
            `关于这件事...我觉得我们应该先弄清楚${config.missionObjective}。`,
            `（${config.characterName}叹了口气）事情比你想象的要复杂得多...`
          ];
          response = localResponses[Math.floor(Math.random() * localResponses.length)];
        }
      }

      // 添加助手回复
      conversationRef.current.push({
        role: 'assistant',
        content: response,
        characterId: configRef.current.characterId,
        characterName: configRef.current.characterName
      });

      setIsLoading(false);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      setIsLoading(false);
      return `发生错误: ${errorMsg}`;
    }
  }, [callLLMAPI]);

  /**
   * 检测玩家是否@某个角色
   */
  const detectMention = useCallback((input: string, characters: Array<{ id: string; name: string }>): { mentioned: boolean; character: { id: string; name: string } | null } => {
    for (const char of characters) {
      if (input.includes(char.name) || input.includes(`@${char.name}`)) {
        return { mentioned: true, character: char };
      }
    }
    return { mentioned: false, character: null };
  }, []);

  /**
   * 清空对话历史
   */
  const clearHistory = useCallback(() => {
    if (configRef.current) {
      conversationRef.current = [{
        role: 'system',
        content: generateSystemPrompt(configRef.current)
      }];
    }
  }, []);

  return {
    isLoading,
    error,
    initAgent,
    updatePhase,
    sendMessage,
    detectMention,
    clearHistory,
    conversation: conversationRef.current
  };
}

export default useJubenshaAgent;
