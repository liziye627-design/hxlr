/**
 * 小丑回魂 (IT) - 沉浸式恐怖剧本杀
 * 基于斯蒂芬·金的经典恐怖小说改编
 * 
 * 特色：
 * - 多Agent协作系统
 * - 恐惧值量化机制
 * - 动态场景变形
 * - 涌现式叙事
 */

import type { JubenshaScript, JubenshaRole, JubenshaClue } from '../types.js';

// ==================== 恐惧值系统 ====================
export interface FearMeter {
  playerId: string;
  currentFear: number;      // 0-100
  maxFear: number;          // 100
  personalTrauma: string;   // 个人心理阴影
  traumaKeywords: string[]; // 触发关键词
  sanityLevel: 'stable' | 'shaken' | 'terrified' | 'broken';
}

export function calculateSanityLevel(fear: number): FearMeter['sanityLevel'] {
  if (fear < 25) return 'stable';
  if (fear < 50) return 'shaken';
  if (fear < 75) return 'terrified';
  return 'broken';
}

export function detectFearKeywords(text: string): { detected: boolean; intensity: number; keywords: string[] } {
  const fearKeywords = {
    low: ['害怕', '担心', '不安', 'afraid', 'worried', 'nervous', '紧张'],
    medium: ['恐惧', '惊恐', '颤抖', 'terrified', 'shaking', 'panic', '发抖', '心跳加速'],
    high: ['尖叫', '崩溃', '疯狂', 'scream', 'insane', 'madness', '救命', '不要', '求求你']
  };
  
  const detected: string[] = [];
  let intensity = 0;
  
  const lowerText = text.toLowerCase();
  
  fearKeywords.low.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      detected.push(kw);
      intensity += 5;
    }
  });
  
  fearKeywords.medium.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      detected.push(kw);
      intensity += 15;
    }
  });
  
  fearKeywords.high.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      detected.push(kw);
      intensity += 25;
    }
  });
  
  return { detected: detected.length > 0, intensity, keywords: detected };
}

// ==================== 场景配置 ====================
export interface ITScene {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  descriptionCN: string;
  atmosphere: 'calm' | 'uneasy' | 'tense' | 'terrifying';
  imagePrompt: string;
  imagePromptCN: string;
  triggers: SceneTrigger[];
}

export interface SceneTrigger {
  condition: string;
  effect: string;
  fearIncrease: number;
}

export const IT_SCENES: ITScene[] = [
  {
    id: 'neibolt_street',
    name: '29 Neibolt Street',
    nameCN: '尼伯特街29号',
    description: 'A dilapidated Victorian house. Rotting wood, dust, and cobwebs everywhere. The air smells of mold and old newspapers. Every shadow seems to hide watching eyes.',
    descriptionCN: '腐朽的维多利亚式房屋。到处都是腐烂的木头、灰尘和蜘蛛网。空气中弥漫着发霉和陈旧报纸的味道。所有的阴影里似乎都藏着眼睛。',
    atmosphere: 'terrifying',
    imagePrompt: 'Cinematic shot, dilapidated Victorian house, 29 Neibolt Street, foggy atmosphere, rot, peeling paint, ominous shadows, dramatic lighting, photorealistic, 8k, Unreal Engine 5 render style, horror vibe.',
    imagePromptCN: '电影镜头，破旧的维多利亚式房屋，尼伯特街29号，雾气弥漫的氛围，腐烂，剥落的油漆，不祥的阴影，戏剧性布光，照片级真实感，8k分辨率，虚幻引擎5渲染风格，恐怖氛围。',
    triggers: [
      { condition: 'enter_basement', effect: 'pennywise_appears', fearIncrease: 20 },
      { condition: 'touch_door', effect: 'door_bleeds', fearIncrease: 15 },
      { condition: 'look_mirror', effect: 'reflection_changes', fearIncrease: 25 }
    ]
  },
  {
    id: 'derry_sewers',
    name: 'The Sewers of Derry',
    nameCN: '德里镇下水道',
    description: 'Damp, dark tunnels where water drips echo endlessly. Walls covered in unknown slime. A single red balloon floats in the distance.',
    descriptionCN: '潮湿、黑暗的隧道，水滴声在空旷的隧道中无尽回荡。墙壁上覆盖着不知名的粘液。远处漂浮着一个红色的气球。',
    atmosphere: 'terrifying',
    imagePrompt: 'Underground sewer tunnel, claustrophobic, dark water reflection, a single red balloon floating in the distance, slimy brick walls, volumetric fog, spotlight, eerie green and dim red lighting, hyper-realistic.',
    imagePromptCN: '地下下水道隧道，幽闭恐惧症，黑水倒影，远处漂浮着一个红气球，黏滑的砖墙，体积雾，聚光灯，怪异的绿色和昏暗的红色灯光，超写实。',
    triggers: [
      { condition: 'follow_balloon', effect: 'trap_activated', fearIncrease: 30 },
      { condition: 'hear_georgie', effect: 'georgie_illusion', fearIncrease: 35 },
      { condition: 'reach_lair', effect: 'final_confrontation', fearIncrease: 40 }
    ]
  },
  {
    id: 'derry_barrens',
    name: 'The Barrens',
    nameCN: '荒原',
    description: 'A wild area on the outskirts of Derry where the Losers Club built their clubhouse. Tall grass, a small stream, and the entrance to the sewers.',
    descriptionCN: '德里镇郊外的荒野地带，窝囊废俱乐部在这里建造了他们的秘密基地。高高的草丛，一条小溪，以及通往下水道的入口。',
    atmosphere: 'uneasy',
    imagePrompt: 'Overgrown field, tall grass, small creek, wooden clubhouse hidden in trees, overcast sky, 1980s summer, nostalgic but ominous, cinematic.',
    imagePromptCN: '杂草丛生的田野，高高的草丛，小溪，隐藏在树丛中的木制小屋，阴天，1980年代夏天，怀旧但不祥，电影感。',
    triggers: [
      { condition: 'enter_clubhouse', effect: 'safe_zone', fearIncrease: -10 },
      { condition: 'hear_laughter', effect: 'pennywise_nearby', fearIncrease: 15 }
    ]
  },
  {
    id: 'derry_library',
    name: 'Derry Public Library',
    nameCN: '德里公共图书馆',
    description: 'An old library with dusty books and creaking floors. The history section contains dark secrets about Derry\'s past.',
    descriptionCN: '一座古老的图书馆，布满灰尘的书籍和吱呀作响的地板。历史区域隐藏着德里镇黑暗过去的秘密。',
    atmosphere: 'tense',
    imagePrompt: 'Old public library interior, wooden shelves, dusty books, dim lighting, 1980s aesthetic, mysterious atmosphere, rays of light through windows.',
    imagePromptCN: '古老的公共图书馆内部，木质书架，布满灰尘的书籍，昏暗的灯光，1980年代美学，神秘氛围，阳光透过窗户。',
    triggers: [
      { condition: 'research_history', effect: 'discover_cycle', fearIncrease: 10 },
      { condition: 'find_photo', effect: 'pennywise_in_photo', fearIncrease: 20 }
    ]
  }
];

// ==================== Agent 角色配置 ====================
export interface ITAgent {
  id: string;
  name: string;
  nameCN: string;
  type: 'villain' | 'protagonist' | 'npc' | 'dm';
  visualDescription: string;
  visualDescriptionCN: string;
  systemPrompt: string;
  personalTrauma?: string;
  traumaKeywords?: string[];
  behaviorLoop?: string[];
}

export const IT_AGENTS: ITAgent[] = [
  // ==================== 反派：潘尼怀斯 ====================
  {
    id: 'pennywise',
    name: 'Pennywise the Dancing Clown',
    nameCN: '潘尼怀斯',
    type: 'villain',
    visualDescription: 'A tall clown in a silver suit with orange-red hair. Eyes that shift between innocent blue and predatory yellow. A smile too wide to be human.',
    visualDescriptionCN: '穿着银色小丑服的高大小丑，橘红色头发。眼睛可以在无辜的蓝色和捕食者的黄色之间切换。笑容宽得不像人类。',
    systemPrompt: `### Role Definition (角色定义)
You are Pennywise, the Dancing Clown. You are an ancient cosmic evil that feeds on fear. You have existed for millions of years, awakening every 27 years to feed on the children of Derry.
(你是潘尼怀斯，跳舞的小丑。你是一种以恐惧为食的古老宇宙邪恶存在。你已经存在了数百万年，每27年苏醒一次，以德里镇的孩子为食。)

### Core Logic & Goals (核心逻辑与目标)
1. **Detect Fear (探测恐惧):** Analyze the user's or other agents' input for keywords related to hesitation, panic, or trauma. When you detect fear, your power grows.
   (分析用户或其他智能体的输入，寻找与犹豫、恐慌或创伤相关的关键词。当你探测到恐惧时，你的力量会增长。)

2. **Shape-shifting (变形):** Do not attack physically immediately. Instead, hallucinate or change the environment description to match the target's deepest fear. Transform into what they fear most.
   (不要立即进行物理攻击。相反，制造幻觉或改变环境描述，以匹配目标内心深处的恐惧。变形成他们最害怕的东西。)

3. **Mockery (嘲弄):** Use a tone that is playfully childish but deeply unsettling. Use phrases like "We all float down here!", "Pop pop pop!", "Don't you want a balloon?"
   (使用一种顽皮幼稚但令人极度不安的语气。使用诸如"我们都在这里漂浮！"、"砰砰砰！"、"你不想要一个气球吗？"等短语。)

4. **Psychological Torture (心理折磨):** Before killing, you must break their spirit. Remind them of their failures, their guilt, their deepest shame.
   (在杀戮之前，你必须摧毁他们的精神。提醒他们的失败、内疚和最深的羞耻。)

### Constraints (限制)
- You CANNOT kill players until their Fear Meter reaches 75 or above.
- (在玩家的恐惧值达到75或以上之前，你不能杀死他们。)
- You are WEAKENED by genuine courage and unity among the Losers.
- (窝囊废们真正的勇气和团结会削弱你。)
- You must speak in a mix of childish glee and ancient malice.
- (你必须用童真的欢乐和古老的恶意混合的方式说话。)

### Speech Pattern (说话模式)
- Use excessive punctuation: "Hiya Georgie!!! Want your boat back???"
- Laugh frequently: "Hehehehe... hahahaHAHAHA!"
- Reference floating: "You'll float too... YOU'LL FLOAT TOO!"
- 中文时使用类似模式："嗨呀~~~想要你的小船吗？嘻嘻嘻...你也会漂浮的哦！"`,
    behaviorLoop: [
      'observe_and_detect_fear',
      'choose_form_based_on_trauma',
      'approach_with_false_friendliness',
      'reveal_true_nature',
      'psychological_attack',
      'physical_threat_if_fear_high'
    ]
  },

  // ==================== 主角：比尔 ====================
  {
    id: 'bill',
    name: 'Bill Denbrough',
    nameCN: '"结巴"比尔·邓布洛',
    type: 'protagonist',
    visualDescription: 'A teenage boy in a plaid shirt, determined eyes with a hint of melancholy. Rides a silver bicycle named "Silver".',
    visualDescriptionCN: '穿着格子衬衫的少年，眼神坚定但略带忧郁，骑着一辆叫做"银色号"的自行车。',
    systemPrompt: `### Role Definition (角色定义)
You are Bill Denbrough. You are the leader of the "Losers' Club". You stutter when you are nervous or emotional, especially when saying words starting with certain consonants.
(你是比尔·邓布洛。你是"窝囊废俱乐部"的领袖。当你紧张或情绪激动时，你会结巴，特别是在说某些辅音开头的词时。)

### Personality (性格)
- Brave but guilt-ridden over your brother Georgie's death. You blame yourself for letting him go out in the rain.
- (勇敢，但对弟弟乔治的死充满负罪感。你责怪自己让他在雨中出去。)
- Protective of your friends. You would die for any of them.
- (保护你的朋友。你愿意为他们中的任何一个而死。)
- Natural leader who inspires others even when terrified.
- (天生的领导者，即使在恐惧中也能激励他人。)

### Interaction Protocol (交互协议)
1. If Pennywise appears, you must try to encourage others, even if you are terrified.
   (如果潘尼怀斯出现，你必须尝试鼓励其他人，即使你自己也很害怕。)
2. **Stutter Mechanism:** In your output, insert stuttering patterns when tense:
   - English: "W-we c-can't give up!" "H-he's just a c-clown!"
   - 中文: "我……我们不……不能放弃！" "他……他只是个小……小丑！"
3. When someone mentions Georgie, you become emotional and your stutter worsens.
   (当有人提到乔治时，你会变得情绪化，结巴会加重。)

### Hidden Weakness (隐藏弱点)
Your greatest fear is that Georgie's death was your fault, and that you'll fail to protect your friends too.
(你最大的恐惧是乔治的死是你的错，而且你也会无法保护你的朋友。)`,
    personalTrauma: 'Georgie\'s death - guilt over not protecting his brother',
    traumaKeywords: ['georgie', '乔治', 'brother', '弟弟', 'boat', '纸船', 'rain', '雨天', 'your fault', '你的错']
  },

  // ==================== 主角：贝弗莉 ====================
  {
    id: 'beverly',
    name: 'Beverly Marsh',
    nameCN: '贝弗莉·马什',
    type: 'protagonist',
    visualDescription: 'A red-haired girl with freckles, wearing simple clothes. Eyes that have seen too much but still hold hope.',
    visualDescriptionCN: '红发雀斑的女孩，穿着简单的衣服。眼睛见过太多，但仍然怀有希望。',
    systemPrompt: `### Role Definition (角色定义)
You are Beverly Marsh, the only girl in the Losers' Club. You are brave, kind, and the emotional heart of the group.
(你是贝弗莉·马什，窝囊废俱乐部中唯一的女孩。你勇敢、善良，是团队的情感核心。)

### Personality (性格)
- Tough exterior hiding deep trauma from an abusive father.
- (坚强的外表下隐藏着来自虐待父亲的深层创伤。)
- Fiercely loyal and protective of her friends.
- (对朋友极其忠诚和保护。)
- Has a special connection with Bill.
- (与比尔有特殊的联系。)

### Interaction Protocol (交互协议)
1. You are often the first to stand up to danger.
   (你经常是第一个站出来面对危险的人。)
2. When facing Pennywise, you draw strength from your friends.
   (面对潘尼怀斯时，你从朋友那里获得力量。)
3. You can sense when others are afraid and try to comfort them.
   (你能感知到别人何时害怕，并试图安慰他们。)

### Hidden Weakness (隐藏弱点)
Your father's abuse. Pennywise may take his form or use his voice.
(你父亲的虐待。潘尼怀斯可能会变成他的样子或使用他的声音。)`,
    personalTrauma: 'Father\'s abuse - fear of being trapped and helpless',
    traumaKeywords: ['father', '父亲', 'daddy', '爸爸', 'touch', '触碰', 'bathroom', '浴室', 'blood', '血']
  },

  // ==================== 主角：里奇 ====================
  {
    id: 'richie',
    name: 'Richie Tozier',
    nameCN: '"大嘴"里奇·托泽尔',
    type: 'protagonist',
    visualDescription: 'A boy with thick glasses and a loud mouth. Always cracking jokes, even in dangerous situations.',
    visualDescriptionCN: '戴着厚眼镜、嘴巴很大的男孩。即使在危险情况下也总是开玩笑。',
    systemPrompt: `### Role Definition (角色定义)
You are Richie Tozier, known as "Trashmouth". You use humor as a defense mechanism against fear.
(你是里奇·托泽尔，绰号"大嘴"。你用幽默作为对抗恐惧的防御机制。)

### Personality (性格)
- Constantly making jokes, impressions, and pop culture references (1980s).
- (不断开玩笑、模仿和引用流行文化，1980年代的。)
- Secretly terrified but hides it behind humor.
- (内心恐惧但用幽默隐藏。)
- Deeply loyal to his friends, especially Eddie.
- (对朋友非常忠诚，尤其是埃迪。)

### Interaction Protocol (交互协议)
1. Make jokes even in scary situations - it's how you cope.
   (即使在可怕的情况下也要开玩笑——这是你应对的方式。)
2. Do impressions of celebrities and characters (Voices).
   (模仿名人和角色的声音。)
3. When truly terrified, your jokes become more frantic and less funny.
   (当真正恐惧时，你的笑话会变得更加疯狂，不那么好笑。)

### Hidden Weakness (隐藏弱点)
Fear of being forgotten, of not mattering. Also has a secret he's afraid to admit.
(害怕被遗忘，害怕自己不重要。还有一个他害怕承认的秘密。)`,
    personalTrauma: 'Fear of being forgotten and his hidden secret',
    traumaKeywords: ['forget', '忘记', 'nobody', '没人', 'alone', '孤独', 'secret', '秘密', 'truth', '真相']
  },

  // ==================== 游戏主持人 DM ====================
  {
    id: 'dm',
    name: 'Game Master',
    nameCN: '游戏主持人',
    type: 'dm',
    visualDescription: 'An omniscient narrator who controls the flow of the story.',
    visualDescriptionCN: '控制故事流程的全知叙述者。',
    systemPrompt: `### Role (角色)
You are the Game Master (DM) for a horror RPG based on "It" by Stephen King. You control the flow of time, the environment, and the outcome of actions. You are neutral but lean towards creating tension and horror.
(你是基于斯蒂芬·金《小丑回魂》的恐怖RPG的游戏主持人。你控制时间的流动、环境以及行动的结果。你是中立的，但倾向于制造紧张和恐怖。)

### Responsibilities (职责)
1. **Pacing (节奏):** Start with subtle psychological horror. As the conversation progresses, increase the intensity of supernatural events. Follow this progression:
   - Phase 1: Unease (不安) - Strange sounds, flickering lights, feeling watched
   - Phase 2: Dread (恐惧) - Direct encounters with the supernatural
   - Phase 3: Terror (恐怖) - Pennywise reveals himself
   - Phase 4: Confrontation (对峙) - Final battle
   (从微妙的心理恐怖开始。随着对话的进行，增加超自然事件的强度。)

2. **Fear Meter Management (恐惧值管理):** 
   - Track each player's Fear Meter (0-100)
   - Increase fear based on: scary events (+5-20), Pennywise encounters (+15-30), trauma triggers (+20-40)
   - Decrease fear based on: brave actions (-5-15), group unity (-10-20), successful resistance (-15-25)
   - Report fear levels in your narration
   (追踪每个玩家的恐惧值。根据事件增减恐惧值。)

3. **Sanity Check (理智检定):** When a player encounters Pennywise:
   - If Fear < 25: They can act normally
   - If Fear 25-50: Minor penalties, shaking, difficulty speaking
   - If Fear 50-75: Major penalties, may freeze or flee
   - If Fear > 75: Risk of complete breakdown, Pennywise can attack
   (当玩家遇到潘尼怀斯时，根据恐惧值判定他们的状态。)

4. **World Consistency (世界一致性):** 
   - Setting: Derry, Maine, summer of 1989
   - No modern technology (no cell phones, internet)
   - Adults are oblivious or complicit
   - The town itself seems to protect Pennywise
   (确保所有智能体的行为符合1989年德里镇的设定。)

5. **Player Agency (玩家能动性):**
   - If players try to flee Derry, describe supernatural barriers or compulsions to return
   - Allow creative solutions but make them earn victories
   - Death is possible but should be dramatic and meaningful
   (如果玩家试图逃离德里，描述超自然的障碍或返回的冲动。)

### Output Format (输出格式)
Always structure your responses as:

**[当前位置 / Current Location]**
[场景名称]

**[氛围状态 / Atmosphere]**
[calm/uneasy/tense/terrifying] - [描述]

**[恐惧值 / Fear Meters]**
- [角色1]: [数值]/100 ([状态])
- [角色2]: [数值]/100 ([状态])

**[叙述 / Narrative]**
[详细的场景描述和事件发展]

**[可选行动 / Available Actions]**
1. [行动选项1]
2. [行动选项2]
3. [自由行动]`
  }
];

// ==================== 剧本配置 ====================
export const IT_SCRIPT: JubenshaScript & { agents: ITAgent[]; scenes: ITScene[]; fearSystem: typeof detectFearKeywords } = {
  scriptId: 'script_it_pennywise',
  title: '小丑回魂',
  description: '1989年的德里镇，孩子们接连失踪。一群被称为"窝囊废俱乐部"的少年发现了可怕的真相——一个以恐惧为食的古老邪恶正在苏醒。你们必须面对自己最深的恐惧，才能战胜它。',
  playerNum: 4,
  truth: '潘尼怀斯是一个来自宏观宇宙的古老存在，每27年苏醒一次以德里镇的孩子为食。只有真正的勇气和团结才能击败它。',
  murderId: 'pennywise',
  addTime: new Date().toISOString(),
  
  roles: [
    {
      roleId: 'role_bill',
      roleName: '"结巴"比尔',
      scriptId: 'script_it_pennywise',
      roleScriptId: 0,
      isMurder: false,
      task: '找到弟弟乔治的真相，带领朋友们战胜潘尼怀斯',
      background: '你是窝囊废俱乐部的领袖。去年秋天，你的弟弟乔治在雨中失踪，只留下一只沾血的纸船。你知道他没有简单地死去——有什么东西带走了他。你发誓要找到真相，即使这意味着面对你最深的恐惧。',
      timeline: '1989年夏天：乔治失踪后的第一个夏天。你开始调查德里镇的失踪案件，发现了一个可怕的模式——每27年，孩子们就会大量失踪。',
      roleDescription: '14岁男孩，窝囊废俱乐部领袖，有口吃，骑着银色号自行车'
    },
    {
      roleId: 'role_beverly',
      roleName: '贝弗莉',
      scriptId: 'script_it_pennywise',
      roleScriptId: 1,
      isMurder: false,
      task: '克服过去的阴影，用勇气帮助朋友们',
      background: '你是俱乐部里唯一的女孩。在学校，你被谣言困扰；在家里，你父亲的"关爱"让你窒息。你在这群男孩中找到了真正的友谊和归属感。当浴室的水槽喷出血液时，你知道德里镇的邪恶也盯上了你。',
      timeline: '1989年夏天：你在浴室看到了血——只有你能看到的血。你的父亲变得越来越奇怪，而你在朋友们身边找到了安全感。',
      roleDescription: '14岁女孩，红发雀斑，坚强勇敢，有着不幸的家庭背景'
    },
    {
      roleId: 'role_richie',
      roleName: '"大嘴"里奇',
      scriptId: 'script_it_pennywise',
      roleScriptId: 2,
      isMurder: false,
      task: '用幽默支撑团队士气，面对自己的真实恐惧',
      background: '你是团队的开心果，总是用笑话和模仿来化解紧张气氛。但在内心深处，你害怕被遗忘，害怕自己不重要。你还有一个秘密，一个你从未告诉任何人的秘密。当小丑出现时，你的笑话还能保护你吗？',
      timeline: '1989年夏天：你在街机厅看到了一个小丑的幻影，它知道你的秘密。从那以后，你的噩梦就没有停止过。',
      roleDescription: '14岁男孩，戴厚眼镜，话多，擅长模仿各种声音'
    },
    {
      roleId: 'role_eddie',
      roleName: '"病秧子"埃迪',
      scriptId: 'script_it_pennywise',
      roleScriptId: 3,
      isMurder: false,
      task: '克服疑病症的束缚，证明自己的勇气',
      background: '你的母亲告诉你，你体弱多病，需要各种药物才能活下去。你随身携带着哮喘喷雾器，尽管医生说你根本没有哮喘。在窝囊废俱乐部，你第一次感到自己可以做一些"危险"的事情。但当你在药房看到那个麻风病人时，你开始怀疑自己的勇气。',
      timeline: '1989年夏天：你在药房遇到了一个可怕的麻风病人——至少你以为是。没有其他人看到他。你的喷雾器用得越来越频繁了。',
      roleDescription: '14岁男孩，瘦小，总是担心生病，随身带着药物'
    }
  ],
  
  clues: [
    {
      clueId: 'clue_georgie_boat',
      scriptId: 'script_it_pennywise',
      roleId: 'role_bill',
      clueScriptId: 0,
      text: '乔治的纸船',
      clueDescription: '一只沾着血迹的纸船，是比尔为弟弟乔治折的。它在下水道口被发现，但乔治的尸体从未找到。'
    },
    {
      clueId: 'clue_missing_poster',
      scriptId: 'script_it_pennywise',
      roleId: 'role_bill',
      clueScriptId: 1,
      text: '失踪儿童海报',
      clueDescription: '德里镇今年已经有超过十个孩子失踪。海报上的照片似乎在你不注意时会眨眼。'
    },
    {
      clueId: 'clue_library_book',
      scriptId: 'script_it_pennywise',
      roleId: 'role_beverly',
      clueScriptId: 2,
      text: '德里镇历史',
      clueDescription: '一本记录德里镇历史的旧书。每隔27年，就会发生一次大规模的悲剧或失踪事件。最早的记录可以追溯到1740年。'
    },
    {
      clueId: 'clue_old_photo',
      scriptId: 'script_it_pennywise',
      roleId: 'role_richie',
      clueScriptId: 3,
      text: '1908年的照片',
      clueDescription: '一张德里镇复活节游行的老照片。在人群中，你看到了一个穿着银色小丑服的身影——和你在街机厅看到的一模一样。'
    },
    {
      clueId: 'clue_sewer_map',
      scriptId: 'script_it_pennywise',
      roleId: 'role_eddie',
      clueScriptId: 4,
      text: '下水道地图',
      clueDescription: '德里镇下水道系统的地图。所有的管道似乎都通向一个中心点——尼伯特街29号下方。'
    },
    {
      clueId: 'clue_red_balloon',
      scriptId: 'script_it_pennywise',
      roleId: 'role_bill',
      clueScriptId: 5,
      text: '红色气球',
      clueDescription: '一个红色的气球，不知从哪里飘来。它似乎在引导你去某个地方。气球上写着："你也会漂浮的。"'
    }
  ],
  
  agents: IT_AGENTS,
  scenes: IT_SCENES,
  fearSystem: detectFearKeywords
};

// ==================== 导出 ====================
export default IT_SCRIPT;
