/**
 * 小丑回魂 (IT) - 游戏房间
 * 沉浸式恐怖剧本杀体验
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Send, Users, Skull, Heart, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { tts } from '@/services/TTSService';

// 游戏消息类型
interface GameMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
  type: 'dialogue' | 'narration' | 'action' | 'system' | 'player';
  avatar?: string;
}

// 角色类型
interface GameCharacter {
  id: string;
  name: string;
  nameCN: string;
  avatar: string;
  type: 'villain' | 'protagonist' | 'npc' | 'dm';
}

// 场景类型
interface GameScene {
  id: string;
  name: string;
  description: string;
  atmosphere: 'calm' | 'uneasy' | 'tense' | 'terrifying';
  backgroundImage: string;
}

// 恐惧值
interface FearStatus {
  current: number;
  max: number;
  level: 'stable' | 'shaken' | 'terrified' | 'broken';
}

// 头像映射
const AGENT_AVATARS: Record<string, string> = {
  dm: 'https://api.dicebear.com/7.x/bottts/svg?seed=gamemaster&backgroundColor=6366f1',
  bill: 'https://api.dicebear.com/7.x/adventurer/svg?seed=billboy&backgroundColor=3b82f6',
  beverly: 'https://api.dicebear.com/7.x/adventurer/svg?seed=bevgirl&hair=long&backgroundColor=ec4899',
  richie: 'https://api.dicebear.com/7.x/adventurer/svg?seed=richieglasses&backgroundColor=f59e0b',
  eddie: 'https://api.dicebear.com/7.x/adventurer/svg?seed=eddieboy&backgroundColor=10b981',
  pennywise: 'https://api.dicebear.com/7.x/bottts/svg?seed=pennywiseclown&backgroundColor=dc2626',
  player: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player1&backgroundColor=8b5cf6'
};

// 场景背景
const SCENE_BACKGROUNDS: Record<string, string> = {
  derry_barrens: 'https://images.unsplash.com/photo-1518173946687-a4c036bc8ce6?w=1200&fit=crop',
  derry_library: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&fit=crop',
  neibolt_street: 'https://images.unsplash.com/photo-1520013817300-1f4c1cb245ef?w=1200&fit=crop',
  derry_sewers: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&fit=crop'
};

export default function ITGameRoom() {
  const navigate = useNavigate();
  
  // 游戏状态
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // 场景和角色
  const [currentScene, setCurrentScene] = useState<GameScene>({
    id: 'derry_barrens',
    name: '荒原 - 窝囊废俱乐部基地',
    description: '德里镇郊外的荒野地带，你们的秘密基地就在这里。',
    atmosphere: 'uneasy',
    backgroundImage: SCENE_BACKGROUNDS.derry_barrens
  });
  
  const [characters] = useState<GameCharacter[]>([
    { id: 'dm', name: 'Game Master', nameCN: '游戏主持人', avatar: AGENT_AVATARS.dm, type: 'dm' },
    { id: 'bill', name: 'Bill Denbrough', nameCN: '"结巴"比尔', avatar: AGENT_AVATARS.bill, type: 'protagonist' },
    { id: 'beverly', name: 'Beverly Marsh', nameCN: '贝弗莉', avatar: AGENT_AVATARS.beverly, type: 'protagonist' },
    { id: 'richie', name: 'Richie Tozier', nameCN: '"大嘴"里奇', avatar: AGENT_AVATARS.richie, type: 'protagonist' },
  ]);
  
  // 恐惧值
  const [fearStatus, setFearStatus] = useState<FearStatus>({
    current: 0,
    max: 100,
    level: 'stable'
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 添加消息
  const addMessage = useCallback((msg: GameMessage) => {
    setMessages(prev => [...prev, msg]);
    
    // TTS 播放
    if (!isMuted && (msg.type === 'dialogue' || msg.type === 'narration')) {
      try {
        // 清理 markdown 格式
        const cleanContent = msg.content.replace(/\*\*\[.*?\]\*\*/g, '').replace(/\*\*/g, '').substring(0, 500);
        tts.speak(cleanContent, msg.agentId);
      } catch (e) {
        console.error('TTS error:', e);
      }
    }
  }, [isMuted]);

  // 更新恐惧值
  const updateFear = useCallback((amount: number) => {
    setFearStatus(prev => {
      const newFear = Math.min(100, Math.max(0, prev.current + amount));
      let level: FearStatus['level'] = 'stable';
      if (newFear >= 75) level = 'broken';
      else if (newFear >= 50) level = 'terrified';
      else if (newFear >= 25) level = 'shaken';
      return { ...prev, current: newFear, level };
    });
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    setGameStarted(true);
    
    // DM 开场白
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '游戏主持人',
        avatar: AGENT_AVATARS.dm,
        content: `**[当前位置]** 荒原 - 窝囊废俱乐部基地

**[游戏时间]** 1989年夏天，下午3点

**[叙述]**
欢迎来到德里镇，1989年的夏天。

这是一个看似平静的小镇，但最近几个月，孩子们开始失踪。海报贴满了每一根电线杆，但大人们似乎对此视而不见。

你是"窝囊废俱乐部"的一员——一群被欺负的孩子，但你们拥有彼此。今天，你们聚集在荒原的秘密基地，讨论一件可怕的事情：你们都看到了"它"。

比尔的弟弟乔治去年失踪了。他相信乔治还活着，被困在某个地方。他需要你们的帮助。

**[可选行动]**
1. 询问比尔关于乔治失踪的细节
2. 分享你自己看到的可怕景象
3. 建议去图书馆调查德里镇的历史
4. 提议去尼伯特街29号探险`,
        timestamp: Date.now(),
        type: 'narration'
      });
    }, 500);

    // Bill 开场
    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        agentId: 'bill',
        agentName: '"结巴"比尔',
        avatar: AGENT_AVATARS.bill,
        content: '大……大家，谢谢你们来。我……我知道这听起来很疯狂，但是……乔治没有死。我……我能感觉到。那个东西……那个小丑……它带走了他。我们必须找到它！',
        timestamp: Date.now() + 1,
        type: 'dialogue'
      });
    }, 4000);
  }, [addMessage]);

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const playerMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // 添加玩家消息
    addMessage({
      id: Date.now().toString(),
      agentId: 'player',
      agentName: '你',
      avatar: AGENT_AVATARS.player,
      content: playerMessage,
      timestamp: Date.now(),
      type: 'player'
    });

    // 模拟 AI 回应
    await simulateAgentResponse(playerMessage);
    setIsLoading(false);
  }, [inputText, isLoading, addMessage]);

  // 模拟 Agent 回应
  const simulateAgentResponse = async (playerMessage: string) => {
    const lowerMsg = playerMessage.toLowerCase();
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 根据关键词决定回应
    if (lowerMsg.includes('乔治') || lowerMsg.includes('弟弟') || lowerMsg.includes('失踪')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'bill',
        agentName: '"结巴"比尔',
        avatar: AGENT_AVATARS.bill,
        content: '那……那天下着大雨。我……我给乔治折了一只纸船。他……他追着船跑进了下水道……然后……然后就再也没有回来。\n\n警察说他被水冲走了，但是……但是我知道不是这样。我……我看到了那个小丑的眼睛。它……它在笑。',
        timestamp: Date.now(),
        type: 'dialogue'
      });
      updateFear(5);
    } else if (lowerMsg.includes('图书馆') || lowerMsg.includes('历史') || lowerMsg.includes('调查')) {
      setCurrentScene({
        id: 'derry_library',
        name: '德里公共图书馆',
        description: '古老的图书馆，隐藏着德里镇黑暗的历史。',
        atmosphere: 'tense',
        backgroundImage: SCENE_BACKGROUNDS.derry_library
      });
      
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '游戏主持人',
        avatar: AGENT_AVATARS.dm,
        content: `**[场景切换]** 德里公共图书馆

你们来到了德里公共图书馆。这是一座古老的建筑，空气中弥漫着旧书和灰尘的味道。

在历史区域，你发现了一个令人不安的规律：

• 1906年：铁工厂爆炸，102人死亡
• 1929年：黑帮枪战，镇中心大屠杀  
• 1962年：黑点酒吧纵火案，88人死亡
• 1989年：儿童连续失踪案...

**每隔27年，德里镇就会发生一次大规模的悲剧。**

更令人毛骨悚然的是，在一张1908年的老照片中，你看到了一个熟悉的身影——一个穿着银色小丑服的人，对着镜头微笑。

**[恐惧值 +10]**`,
        timestamp: Date.now(),
        type: 'narration'
      });
      updateFear(10);
    } else if (lowerMsg.includes('尼伯特') || lowerMsg.includes('29号') || lowerMsg.includes('废屋') || lowerMsg.includes('探险')) {
      setCurrentScene({
        id: 'neibolt_street',
        name: '尼伯特街29号',
        description: '恐怖的源头，废弃的破屋。',
        atmosphere: 'terrifying',
        backgroundImage: SCENE_BACKGROUNDS.neibolt_street
      });
      
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '游戏主持人',
        avatar: AGENT_AVATARS.dm,
        content: `**[场景切换 - ⚠️ 危险区域]**
尼伯特街29号

你们站在那座废弃的房子前。它看起来比周围的任何建筑都要古老、腐朽。

油漆剥落，露出下面发黑的木头。窗户像空洞的眼睛一样盯着你们。前门微微敞开，仿佛在邀请你们进入。

空气突然变得冰冷。你能闻到一股腐烂的甜味，混合着……气球的橡胶味？

**[恐惧值 +15]**

从房子深处，传来了一个孩子的笑声……

**[可选行动]**
1. 鼓起勇气，进入房子
2. 先在外面观察，寻找其他入口
3. 这太危险了，建议撤退`,
        timestamp: Date.now(),
        type: 'narration'
      });
      updateFear(15);
      
      // Beverly 的反应
      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'beverly',
          agentName: '贝弗莉',
          avatar: AGENT_AVATARS.beverly,
          content: '我们真的要进去吗？我……我有一种很不好的预感。但是……如果乔治真的在里面……',
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 2000);
    } else if (lowerMsg.includes('进入') || lowerMsg.includes('进去') || lowerMsg.includes('开门')) {
      // 触发潘尼怀斯！
      updateFear(30);
      
      addMessage({
        id: Date.now().toString(),
        agentId: 'pennywise',
        agentName: '潘尼怀斯',
        avatar: AGENT_AVATARS.pennywise,
        content: `嗨呀~~~！！！

（一个高大的身影从阴影中走出。银色的小丑服在黑暗中闪闪发光，橘红色的头发像火焰一样竖立着。它的笑容太宽了，宽得不像人类。）

"哦哦哦~~~新朋友来啦！！！潘尼怀斯好开心呀！！！"

（它的眼睛从蓝色变成了捕食者的黄色）

"你们都来找乔治吗？嘻嘻嘻~~~乔治现在和我在一起哦！他在下面漂浮呢~~~我们都在下面漂浮！！！"

（它伸出一只手，手里握着一个红色的气球）

"想要气球吗？拿着气球，你也可以漂浮哦~~~"

**[恐惧值 +30]**
**[⚠️ 危险！潘尼怀斯出现了！]**`,
        timestamp: Date.now(),
        type: 'dialogue'
      });
    } else if (lowerMsg.includes('害怕') || lowerMsg.includes('恐惧')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'beverly',
        agentName: '贝弗莉',
        avatar: AGENT_AVATARS.beverly,
        content: '我也看到了一些东西。在我家的浴室里……水槽里喷出了血。到处都是血。但是当我叫我爸来看的时候，他什么都看不到。只有我能看到。\n\n我觉得……这个镇子有问题。不只是那个小丑。是整个德里镇。',
        timestamp: Date.now(),
        type: 'dialogue'
      });
    } else if (lowerMsg.includes('不害怕') || lowerMsg.includes('勇气') || lowerMsg.includes('团结')) {
      updateFear(-10);
      addMessage({
        id: Date.now().toString(),
        agentId: 'bill',
        agentName: '"结巴"比尔',
        avatar: AGENT_AVATARS.bill,
        content: '没……没错！只要我们在一起，就……就没什么好怕的！我们是窝……窝囊废俱乐部！窝囊废们要互相照应！\n\n**[恐惧值 -10]**',
        timestamp: Date.now(),
        type: 'dialogue'
      });
    } else {
      // 检测@角色
      const mentionedChar = detectMentionedCharacter(lowerMsg);
      // 检测偏离剧本
      const deviation = detectDeviation(lowerMsg);
      
      if (deviation.isDeviating) {
        // 命运修正
        const correction = generateFateCorrection(deviation.type);
        addMessage({
          id: Date.now().toString(),
          agentId: 'dm',
          agentName: '游戏主持人',
          avatar: AGENT_AVATARS.dm,
          content: correction,
          timestamp: Date.now(),
          type: 'narration'
        });
        updateFear(5);
      } else if (mentionedChar) {
        // @角色回应
        const response = await generateCharacterResponse(mentionedChar.id, playerMessage);
        addMessage({
          id: Date.now().toString(),
          agentId: mentionedChar.id,
          agentName: mentionedChar.name,
          avatar: AGENT_AVATARS[mentionedChar.id] || AGENT_AVATARS.dm,
          content: response,
          timestamp: Date.now(),
          type: 'dialogue'
        });
      } else {
        // Richie 的默认回应
        const richieResponses = [
          '嘿嘿，你们知道吗？我觉得这个小丑肯定是从马戏团跑出来的疯子。也许他只是想找人一起玩气球？（紧张地笑）好吧好吧，我知道这不好笑……',
          '说真的，伙计们，我们真的要去追一个杀人小丑吗？我是说……我们连亨利·鲍尔斯都打不过，更别说一个超自然的怪物了！',
          '好吧，如果我们要死，至少让我说完我的笑话。为什么小丑过马路？因为……因为……算了，我想不出来了。我太紧张了。'
        ];
        
        addMessage({
          id: Date.now().toString(),
          agentId: 'richie',
          agentName: '"大嘴"里奇',
          avatar: AGENT_AVATARS.richie,
          content: richieResponses[Math.floor(Math.random() * richieResponses.length)],
          timestamp: Date.now(),
          type: 'dialogue'
        });
      }
    }
  };

  // 检测@角色
  const detectMentionedCharacter = (input: string): { id: string; name: string } | null => {
    const chars = [
      { id: 'bill', name: '"结巴"比尔', keywords: ['比尔', 'bill', '结巴'] },
      { id: 'beverly', name: '贝弗莉', keywords: ['贝弗莉', 'beverly', '贝芙'] },
      { id: 'richie', name: '"大嘴"里奇', keywords: ['里奇', 'richie', '大嘴'] },
      { id: 'eddie', name: '艾迪', keywords: ['艾迪', 'eddie'] },
      { id: 'pennywise', name: '潘尼怀斯', keywords: ['潘尼怀斯', 'pennywise', '小丑', 'it'] }
    ];
    for (const c of chars) {
      if (c.keywords.some(k => input.includes(k))) return { id: c.id, name: c.name };
    }
    return null;
  };

  // 检测偏离剧本
  const detectDeviation = (input: string): { isDeviating: boolean; type: string } => {
    if (input.includes('逃') || input.includes('离开') || input.includes('回家')) return { isDeviating: true, type: 'escape' };
    if (input.includes('杀') || input.includes('打') || input.includes('攻击')) return { isDeviating: true, type: 'violence' };
    if (input.includes('不管') || input.includes('放弃') || input.includes('躺平')) return { isDeviating: true, type: 'ignore' };
    if (input.includes('报警') || input.includes('警察') || input.includes('大人')) return { isDeviating: true, type: 'meta' };
    return { isDeviating: false, type: 'none' };
  };

  // 命运修正
  const generateFateCorrection = (type: string): string => {
    const corrections: Record<string, string[]> = {
      escape: [
        '你转身想要逃跑，但是当你回过神来时，发现自己又站在了原地。德里镇的街道像迷宫一样，无论怎么走，都会回到这里。\n\n**它不会让你离开的。**',
        '你拼命地跑，但是每一条路都通向同一个地方。远处传来气球爆裂的声音，还有那熟悉的笑声...\n\n"你跑不掉的，小朋友~"'
      ],
      violence: [
        '你举起拳头想要反击，但是一阵剧烈的恐惧感袭来，让你的身体僵住了。它的眼睛变成了黄色，直直地盯着你...\n\n**[恐惧值 +5]**',
        '你冲上去想要攻击，但是你的手穿过了它的身体，什么都没有碰到。它不是实体的。它是恐惧本身。'
      ],
      ignore: [
        '你闭上眼睛想要忽视一切。但是黑暗中，乔治的脸出现在你眼前。他在哭泣，在呼唤你的名字...\n\n你无法忽视他。你必须找到真相。',
        '你试图什么都不做。但是比尔的声音在你耳边响起："我……我们不能放弃。乔治……乔治还在等我们。"'
      ],
      meta: [
        '你想要找大人帮忙。但是你突然想起来——德里镇的大人们似乎看不到那些怪事。他们的眼睛是空洞的，就像被什么东西控制了一样。\n\n**只有孩子才能看到它。只有你们才能阻止它。**',
        '你拿起电话想要报警，但是电话那头传来的是那个熟悉的声音："嗨呀~~~想找人帮忙吗？没有人会相信你的哦~~~嘻嘻嘻~~~"'
      ]
    };
    const responses = corrections[type] || corrections.escape;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 生成角色回复（支持LLM）
  const generateCharacterResponse = async (charId: string, playerInput: string): Promise<string> => {
    const charTraits: Record<string, { traits: string; style: string }> = {
      bill: { traits: '勇敢但结巴，为弟弟乔治的失踪而自责', style: '说话结巴，但充满决心' },
      beverly: { traits: '坚强的女孩，家庭不幸福', style: '温柔但勇敢' },
      richie: { traits: '话多的搞笑担当，用幽默掩饰恐惧', style: '爱讲笑话，紧张时更话多' },
      eddie: { traits: '胆小但忠诚，有哮喘', style: '紧张，经常提到生病' },
      pennywise: { traits: '以恐惧为食的古老邪恶', style: '疯狂，扭曲，爱用"嘻嘻嘻"' }
    };
    const char = charTraits[charId];
    if (!char) return '（沉默）';

    const apiKey = import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      try {
        const baseUrl = import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com';
        const model = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: `你是《小丑回魂》中的角色。性格：${char.traits}。说话风格：${char.style}。背景：1989年德里镇，孩子们失踪，你们是窝囊废俱乐部。用中文回复，100-200字，保持角色性格。` },
              { role: 'user', content: playerInput }
            ],
            temperature: 0.8,
            max_tokens: 500
          })
        });
        if (response.ok) {
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
        }
      } catch (e) { console.log('LLM failed:', e); }
    }

    // 本地回复
    const localResponses: Record<string, string[]> = {
      bill: ['我……我们必须找到乔治。不……不管发生什么。', '那……那个小丑……它带走了我弟弟。我……我不会放过它的。'],
      beverly: ['我们在一起就不会害怕。窝囊废俱乐部，记得吗？', '我也看到了一些东西...在我家的浴室里...'],
      richie: ['嘿，你们知道吗？我有个笑话...算了，现在不是时候。', '说真的，我们真的要去追一个杀人小丑吗？！'],
      eddie: ['我...我的哮喘药...我需要我的药...', '这太危险了！我们会死的！'],
      pennywise: ['嘻嘻嘻~~~你想要气球吗？拿着气球，你也可以漂浮哦~~~', '哦~~~新朋友来啦！潘尼怀斯好开心呀！']
    };
    const responses = localResponses[charId] || ['（沉默）'];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 快捷回复
  const quickReplies = [
    '告诉我更多关于乔治的事',
    '我们去图书馆调查',
    '去尼伯特街29号',
    '@比尔 你还好吗？',
    '我要逃离这里'
  ];

  // 获取恐惧等级颜色
  const getFearColor = () => {
    switch (fearStatus.level) {
      case 'broken': return 'bg-red-500';
      case 'terrified': return 'bg-orange-500';
      case 'shaken': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  // 获取恐惧等级文字
  const getFearText = () => {
    switch (fearStatus.level) {
      case 'broken': return '崩溃';
      case 'terrified': return '恐惧';
      case 'shaken': return '不安';
      default: return '稳定';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* 顶部栏 */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-4 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/script-murder')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-500" />
              小丑回魂
            </h2>
            <p className="text-sm text-gray-400">{currentScene.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 恐惧值 */}
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${fearStatus.current > 50 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span>恐惧值</span>
                <span className={fearStatus.current > 50 ? 'text-red-400' : ''}>{fearStatus.current}%</span>
              </div>
              <Progress value={fearStatus.current} className={`h-2 ${getFearColor()}`} />
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${getFearColor()}`}>{getFearText()}</span>
          </div>

          {/* 静音按钮 */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* 场景背景 */}
      <div 
        className="h-32 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${currentScene.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-gray-300">{currentScene.description}</p>
          {currentScene.atmosphere === 'terrifying' && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>危险区域</span>
            </div>
          )}
        </div>
      </div>

      {/* 开始游戏按钮 */}
      {!gameStarted && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Skull className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">小丑回魂</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              1989年，德里镇。孩子们开始失踪。<br/>
              你准备好面对恐惧了吗？
            </p>
            <Button 
              size="lg" 
              onClick={startGame}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
            >
              开始游戏
            </Button>
          </motion.div>
        </div>
      )}

      {/* 聊天区域 */}
      {gameStarted && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
            {/* 快捷回复 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  onClick={() => setInputText(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入你的行动或对话..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="rounded-full bg-red-600 hover:bg-red-700 h-12 w-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 消息气泡组件
function MessageBubble({ message }: { message: GameMessage }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isPlayer = message.type === 'player';
  const isNarration = message.type === 'narration';
  const isPennywise = message.agentId === 'pennywise';

  useEffect(() => {
    if (!isPlayer) {
      setIsTyping(true);
      let i = 0;
      const speed = isPennywise ? 20 : 25;
      const timer = setInterval(() => {
        setDisplayedText(message.content.slice(0, i));
        i++;
        if (i > message.content.length) {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, speed);
      return () => clearInterval(timer);
    } else {
      setDisplayedText(message.content);
    }
  }, [message.content, isPlayer, isPennywise]);

  if (isNarration) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={message.avatar} />
            <AvatarFallback>DM</AvatarFallback>
          </Avatar>
          <span className="text-sm text-purple-400 font-medium">{message.agentName}</span>
        </div>
        <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {isTyping && <span className="animate-pulse text-purple-400">▊</span>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isPlayer ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} gap-3`}
    >
      {!isPlayer && (
        <Avatar className={`w-10 h-10 ${isPennywise ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
          <AvatarImage src={message.avatar} />
          <AvatarFallback>{message.agentName[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[75%] ${isPlayer ? 'items-end' : 'items-start'}`}>
        {!isPlayer && (
          <span className={`text-xs mb-1 block ${isPennywise ? 'text-red-400' : 'text-gray-400'}`}>
            {message.agentName}
          </span>
        )}
        <div className={`px-4 py-2 rounded-2xl ${
          isPlayer 
            ? 'bg-purple-600 text-white rounded-br-sm' 
            : isPennywise
              ? 'bg-red-900/80 text-red-100 rounded-bl-sm border border-red-700'
              : 'bg-gray-700 text-gray-100 rounded-bl-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap">
            {displayedText}
            {isTyping && <span className={`animate-pulse ${isPennywise ? 'text-red-400' : 'text-purple-400'}`}>▊</span>}
          </p>
        </div>
      </div>

      {isPlayer && (
        <Avatar className="w-10 h-10">
          <AvatarImage src={message.avatar} />
          <AvatarFallback>你</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
