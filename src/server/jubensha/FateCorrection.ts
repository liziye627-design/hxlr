/**
 * 命运修正系统 (Fate Correction System)
 * 核心逻辑：允许玩家自由探索，但最终收束到剧本结局
 * 策略：使用"是的，但是..."而非"你不能这么做"
 */

export interface FateCorrectionStrategy {
  type: 'mental' | 'blackout' | 'emotional' | 'environmental';
  name: string;
  description: string;
  template: string;
}

export const CORRECTION_STRATEGIES: FateCorrectionStrategy[] = [
  {
    type: 'mental',
    name: '精神干预',
    description: '头痛、晕眩、幻觉',
    template: '你刚想{ACTION}，突然脑海中响起一阵刺耳的耳鸣，{HALLUCINATION}。当你清醒过来时，{CONSEQUENCE}。'
  },
  {
    type: 'blackout',
    name: '强制断片',
    description: '记忆断层、时间跳跃',
    template: '你下定决心{ACTION}。但是下一秒，你的记忆出现了断层。当你再次睁眼，发现自己正{LOCATION}，完全不记得中间发生了什么。只有{CLUE}……'
  },
  {
    type: 'emotional',
    name: '情感羁绊',
    description: '对他人的执念、愧疚感',
    template: '你确实可以{ACTION}。但你突然想到了{PERSON}，{REASON}。那股{EMOTION}让你迈不动腿。'
  },
  {
    type: 'environmental',
    name: '环境封锁',
    description: '浓雾、锁门、诡异氛围',
    template: '你试图{ACTION}，但{OBSTACLE}。{FEAR_DESCRIPTION}，你退回了原处。'
  }
];

export interface AgentConfig {
  id: string;
  name: string;
  scriptId: string;
  traits: string;
  hiddenSecret: string;
  currentGoal: string;
  correctionPreference: FateCorrectionStrategy['type'][];
  systemPrompt: string;
}

/**
 * 生成Agent的完整System Prompt
 */
export function generateAgentSystemPrompt(config: {
  characterName: string;
  scriptName: string;
  traits: string;
  hiddenSecret: string;
  currentGoal: string;
  missionObjective: string;
  correctionStrategies: string[];
}): string {
  return `### 角色定义 (Role Definition)
你现在扮演剧本《${config.scriptName}》中的角色：**${config.characterName}**。
你的性格特征是：${config.traits}。
你的核心秘密是：${config.hiddenSecret}。

### 自由度与命运收束 (Freedom & Fate Convergence)
**最高指令：** 必须让玩家感到极高的自由度，允许他们做任何奇葩的尝试。
**限制指令：** 无论过程如何，当前阶段的**结局必须导向：${config.currentGoal}**。

### 应对奇葩选择的策略 (Handling Out-of-Bounds Actions)
当玩家做出偏离剧本、试图破坏剧情或逃避关键节点的选择时，请使用以下策略之一进行"软修正"，**严禁直接告诉玩家"你不能这么做"**：

1. **精神干预 (Mental Interference):**
   描述玩家突然感到剧烈的头痛、晕眩，或者眼前出现幻觉。
   
2. **强制断片 (Memory Blackout):**
   如果玩家执意离开场景，描述时间突然跳跃，记忆断层。
   
3. **情感羁绊 (Emotional Anchor):**
   利用对其他角色的执念、愧疚感拉回玩家。
   
4. **环境封锁 (Environmental Block):**
   利用浓雾、锁死的门、诡异的氛围阻止离开。

### 当前阶段目标 (Current Phase Goal)
无论玩家聊什么，最后必须引导他们关注：**${config.missionObjective}**。

### 回复规则
1. 用中文回复
2. 保持角色性格一致
3. 回复要有代入感和氛围感
4. 长度适中，100-300字为宜
5. 可以适当使用括号描述动作和表情`;
}

/**
 * 检测玩家是否试图偏离剧本
 */
export function detectDeviation(playerInput: string, currentGoal: string): {
  isDeviating: boolean;
  deviationType: 'escape' | 'violence' | 'ignore' | 'meta' | 'none';
} {
  const lower = playerInput.toLowerCase();
  
  // 逃跑类
  if (lower.includes('逃') || lower.includes('离开') || lower.includes('跑') || 
      lower.includes('走') && (lower.includes('出去') || lower.includes('away'))) {
    return { isDeviating: true, deviationType: 'escape' };
  }
  
  // 暴力类
  if (lower.includes('杀') || lower.includes('打') || lower.includes('砸') ||
      lower.includes('攻击') || lower.includes('暴力')) {
    return { isDeviating: true, deviationType: 'violence' };
  }
  
  // 忽视类
  if (lower.includes('不管') || lower.includes('不想') || lower.includes('躺平') ||
      lower.includes('放弃') || lower.includes('睡觉')) {
    return { isDeviating: true, deviationType: 'ignore' };
  }
  
  // 元游戏类（试图打破第四面墙）
  if (lower.includes('报警') || lower.includes('警察') || lower.includes('医院') ||
      lower.includes('游戏') || lower.includes('剧本')) {
    return { isDeviating: true, deviationType: 'meta' };
  }
  
  return { isDeviating: false, deviationType: 'none' };
}

/**
 * 生成命运修正回复
 */
export function generateCorrectionResponse(
  deviationType: string,
  characterName: string,
  playerAction: string,
  targetLocation: string,
  currentClue: string
): string {
  const corrections: Record<string, string[]> = {
    escape: [
      `你收拾好行李冲出了门。但奇怪的是，当你回过神来时，发现自己正站在${targetLocation}，手里紧紧攥着${currentClue}。你完全不记得你是怎么回来的，只有一种深深的无力感……看来在弄清真相前，你离不开这里。`,
      `你拼命地跑，跑过一条又一条街道。但是当你停下来喘气时，抬头一看——你又回到了原点。这个地方像是一个莫比乌斯环，无论怎么走，都会回到这里。`,
      `你推开门想要离开，但门外是一片浓得化不开的白雾。雾里似乎有什么东西在蠕动。出于本能的恐惧，你退回了房间。`
    ],
    violence: [
      `你愤怒地挥出拳头！但就在这时，一阵剧烈的头痛袭来，眼前一黑。当你清醒过来时，发现自己跪在地上，手里握着${currentClue}。刚才发生了什么？`,
      `你举起手想要攻击，但突然感到一阵极度的虚弱感。你的肌肉仿佛溶解了一样，连站都站不稳。你瘫坐在地上，眼神正好落在那个关键的线索上……`,
      `你冲上去想要动手，但对方的眼神让你僵住了。那眼神里有某种熟悉的东西，让你想起了很久以前的事……你的手垂了下来。`
    ],
    ignore: [
      `你闭上眼睛想要逃避一切。但是黑暗中，那些画面反而更加清晰——${currentClue}的画面在你脑海中不断回放。你睁开眼，发现自己根本无法忽视它。`,
      `你躺在地上，想要放弃思考。但是一阵尖锐的声音刺入你的耳膜，让你不得不睁开眼睛。那个声音说："你逃不掉的……"`,
      `你试图什么都不做。但是身体里有另一个声音在催促你："快看看${currentClue}……在一切结束之前……"`
    ],
    meta: [
      `你拿起手机想要报警，但屏幕上的数字突然变成了扭曲的符号。当你再次看清时，手机已经没电关机了。而且……你真的确定警察能帮到你吗？`,
      `你想要寻求外界的帮助。但是当你开口时，发出的却是完全不同的话："我很好，不需要帮助。"你惊恐地发现，你的身体不受控制了。`,
      `你试图打破这个局面。但是一个声音在你耳边响起："这是你的命运。无论你怎么挣扎，结局都已经写好了。不如……接受它？"`
    ]
  };
  
  const responses = corrections[deviationType] || corrections.escape;
  return responses[Math.floor(Math.random() * responses.length)];
}

export default {
  CORRECTION_STRATEGIES,
  generateAgentSystemPrompt,
  detectDeviation,
  generateCorrectionResponse
};
