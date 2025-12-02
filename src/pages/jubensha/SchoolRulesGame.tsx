/**
 * 第二十二条校规 - 游戏房间
 * 校园恐怖剧本杀
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Send, Skull, Heart, ArrowLeft, AlertTriangle, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { tts } from '@/services/TTSService';

interface GameMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
  type: 'dialogue' | 'narration' | 'player' | 'horror';
  avatar?: string;
}

interface GameScene {
  id: string;
  name: string;
  description: string;
  atmosphere: 'calm' | 'uneasy' | 'tense' | 'terrifying';
  backgroundImage: string;
}

interface SanityStatus {
  current: number;
  max: number;
  level: 'stable' | 'anxious' | 'panicked' | 'broken';
}

// 头像
const AVATARS: Record<string, string> = {
  dm: 'https://api.dicebear.com/7.x/bottts/svg?seed=schooldm&backgroundColor=6366f1',
  xuanxuan: 'https://api.dicebear.com/7.x/adventurer/svg?seed=xuanxuan&backgroundColor=ec4899&glasses=variant01',
  yuqing: 'https://api.dicebear.com/7.x/adventurer/svg?seed=yuqing&hair=long&backgroundColor=f59e0b',
  siqi: 'https://api.dicebear.com/7.x/adventurer/svg?seed=siqi&backgroundColor=10b981',
  qingfeng: 'https://api.dicebear.com/7.x/adventurer/svg?seed=qingfeng&backgroundColor=22c55e',
  lengxing: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lengxing&backgroundColor=3b82f6',
  huangfu: 'https://api.dicebear.com/7.x/adventurer/svg?seed=huangfu&backgroundColor=8b5cf6',
  ghost: 'https://api.dicebear.com/7.x/bottts/svg?seed=whiteghost&backgroundColor=dc2626',
  player: 'https://api.dicebear.com/7.x/adventurer/svg?seed=schoolplayer&backgroundColor=6366f1'
};

// 场景背景
const BACKGROUNDS: Record<string, string> = {
  classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&fit=crop',
  corridor: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&fit=crop',
  rooftop: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&fit=crop',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&fit=crop'
};

export default function SchoolRulesGame() {
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'intro' | 'night1' | 'day2' | 'climax' | 'ending'>('intro');
  
  const [currentScene, setCurrentScene] = useState<GameScene>({
    id: 'classroom',
    name: '高二3班教室',
    description: '40套桌椅的教室里，只有寥寥数人。空气中弥漫着压抑的寂静。',
    atmosphere: 'uneasy',
    backgroundImage: BACKGROUNDS.classroom
  });
  
  const [sanity, setSanity] = useState<SanityStatus>({
    current: 100,
    max: 100,
    level: 'stable'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((msg: GameMessage) => {
    setMessages(prev => [...prev, msg]);
    if (!isMuted && (msg.type === 'dialogue' || msg.type === 'narration')) {
      try {
        const clean = msg.content.replace(/\*\*\[.*?\]\*\*/g, '').replace(/\*\*/g, '').substring(0, 400);
        tts.speak(clean, msg.agentId);
      } catch (e) { console.error(e); }
    }
  }, [isMuted]);

  const updateSanity = useCallback((amount: number) => {
    setSanity(prev => {
      const newVal = Math.min(100, Math.max(0, prev.current + amount));
      let level: SanityStatus['level'] = 'stable';
      if (newVal <= 25) level = 'broken';
      else if (newVal <= 50) level = 'panicked';
      else if (newVal <= 75) level = 'anxious';
      return { ...prev, current: newVal, level };
    });
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGamePhase('intro');
    
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `**[第二十二条校规]**
**[地点：真相高中 高二3班]**
**[时间：2月26日 下午]**

欢迎来到"真相高中"。这里是本市升学率最高的名校，而你们，是高二3班的天之骄子。

尽管这个班级有40套桌椅，但实际上，只有你们寥寥数人坐在空旷的教室里。空气中弥漫着压抑的寂静。

今天，班主任李老师带来了一位新的转校生——皇甫青。

那过于惊艳的外表似乎让班级的气氛发生了一些微妙的变化。

**[请选择你的行动]**
1. 观察新来的转校生
2. 和身边的同学交谈
3. 查看课桌上的校规手册
4. 回忆这个班级的往事`,
        timestamp: Date.now(),
        type: 'narration'
      });
    }, 500);

    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        agentId: 'huangfu',
        agentName: '皇甫青',
        avatar: AVATARS.huangfu,
        content: '......我叫皇甫青。请多指教。',
        timestamp: Date.now() + 1,
        type: 'dialogue'
      });
    }, 4000);

    setTimeout(() => {
      addMessage({
        id: (Date.now() + 2).toString(),
        agentId: 'yuqing',
        agentName: '谢雨晴',
        avatar: AVATARS.yuqing,
        content: '（轻笑）又来一个帅哥呢。欢迎来到我们班，皇甫同学。我是谢雨晴，有什么不懂的可以问我哦~',
        timestamp: Date.now() + 2,
        type: 'dialogue'
      });
    }, 6000);
  }, [addMessage]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    const playerMsg = inputText.trim();
    setInputText('');
    setIsLoading(true);

    addMessage({
      id: Date.now().toString(),
      agentId: 'player',
      agentName: '你',
      avatar: AVATARS.player,
      content: playerMsg,
      timestamp: Date.now(),
      type: 'player'
    });

    await handleAgentResponse(playerMsg);
    setIsLoading(false);
  }, [inputText, isLoading, addMessage]);

  const handleAgentResponse = async (msg: string) => {
    const lower = msg.toLowerCase();
    await new Promise(r => setTimeout(r, 1500));

    if (lower.includes('校规') || lower.includes('手册') || lower.includes('规则')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `你翻开了课桌上那本陈旧的《校规手册》。

大部分规则都很正常，直到你看到了第22条：

**【第二十二条】**
"若在校园内遇到不认识的'同学'，请不要与其交谈，不要直视其眼睛，不要询问其姓名。请立即前往最近的教师办公室报告。"

这条规则用红色墨水特别标注，旁边还有人用铅笔写了一行小字：

*"她还在找我们..."*

**[理智值 -5]**`,
        timestamp: Date.now(),
        type: 'narration'
      });
      updateSanity(-5);
    } else if (lower.includes('转校生') || lower.includes('皇甫') || lower.includes('观察')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'xuanxuan',
        agentName: '李萱萱',
        avatar: AVATARS.xuanxuan,
        content: '（推了推眼镜，小声说）他...好奇怪。你有没有发现，他的影子...好像和别人不太一样？',
        timestamp: Date.now(),
        type: 'dialogue'
      });
    } else if (lower.includes('往事') || lower.includes('回忆') || lower.includes('以前')) {
      updateSanity(-10);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `你试图回忆这个班级的往事...

但奇怪的是，你的记忆似乎有一块空白。

你隐约记得，这个班级曾经有更多人。有一个女生...她叫什么来着？

一个模糊的画面闪过：一个瘦弱的女孩被关在纸箱里，周围是嘲笑的声音...

**"小病猫！小病猫！"**

你猛地回过神来，发现自己在发抖。

**[理智值 -10]**
**[获得记忆碎片：纸箱]**`,
        timestamp: Date.now(),
        type: 'horror'
      });
    } else if (lower.includes('夜晚') || lower.includes('回家') || lower.includes('晚上') || gamePhase === 'intro' && lower.includes('继续')) {
      setGamePhase('night1');
      setCurrentScene({
        id: 'corridor',
        name: '夜晚的走廊',
        description: '午夜时分，走廊里只有应急灯的微光。',
        atmosphere: 'terrifying',
        backgroundImage: BACKGROUNDS.corridor
      });
      
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `**[时间推进：2月26日 午夜]**

夜幕降临，你回到了宿舍。

就在你即将入睡时，手机突然亮了。

一条短信，发送者是...你自己的号码？

**"明天，去天台。"**

你惊出一身冷汗，想要删除这条短信，却发现手机屏幕上出现了一张照片——

那是你们班级的合照，但照片里多了一个人。

一个穿着白色连衣裙的女孩，站在最后一排，脸被长发遮住...

**[理智值 -15]**

**[可选行动]**
1. 仔细查看照片中的女孩
2. 立即给同学打电话
3. 假装什么都没发生，强迫自己入睡`,
        timestamp: Date.now(),
        type: 'horror'
      });
      updateSanity(-15);
    } else if (lower.includes('天台') || lower.includes('上去') || gamePhase === 'night1') {
      setGamePhase('climax');
      setCurrentScene({
        id: 'rooftop',
        name: '天台',
        description: '浓雾弥漫，蓄水池在黑暗中若隐若现。',
        atmosphere: 'terrifying',
        backgroundImage: BACKGROUNDS.rooftop
      });
      
      updateSanity(-20);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `**[场景切换：天台]**
**[时间：2月27日 深夜]**

你们终于在天台汇合了。四周是无尽的黑暗与浓雾。

蓄水池就在不远处，发出令人不安的水声。

突然，铁门被推开——

另一个"叶冷星"冲了出来！

"快跑！她来了！"

话音未落，一只苍白的巨大手掌从浓雾中伸出，将那个"叶冷星"抓起，塞入了蓄水池中！

**[理智值 -20]**

从蓄水池中，缓缓升起一个巨大的白色身影...

两米宽的巨口张开，发出令人毛骨悚然的声音...`,
        timestamp: Date.now(),
        type: 'horror'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'ghost',
          agentName: '白衣恶灵',
          avatar: AVATARS.ghost,
          content: `你...们...

忘...了...我...

忘了我的...名字...

**我叫什么？**

**说出来...说出我的名字...**

**否则...你们都要...陪我...一起...死...**`,
          timestamp: Date.now() + 1,
          type: 'horror'
        });
      }, 3000);

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 2).toString(),
          agentId: 'qingfeng',
          agentName: '姚青峰',
          avatar: AVATARS.qingfeng,
          content: '（通灵宝玉发出耀眼的绿光）我...我看到了！那个女孩...她叫...她叫蒋...蒋什么来着？！大家快想！我们只有30分钟！',
          timestamp: Date.now() + 2,
          type: 'dialogue'
        });
      }, 6000);
    } else if (lower.includes('蒋温灵') || lower.includes('温灵')) {
      setGamePhase('ending');
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `**"蒋温灵！"**

你大声喊出了那个被遗忘的名字。

白衣恶灵的动作停住了。

那张扭曲的脸上，竟然流下了眼泪。

**"你们...终于...记起我了..."**

浓雾开始消散，恶灵的身影逐渐变得透明。

一个瘦弱的女孩出现在你们面前——那是蒋温灵生前的模样。

**"我只是...想要有人记得我..."**

**"谢谢你们...终于...叫出了我的名字..."**

随着第一缕阳光照射到天台，蒋温灵的身影彻底消失了。

**[恭喜！你们成功破解了诅咒！]**
**[真相大白：蒋温灵因校园霸凌而死，她的怨念让所有人遗忘了她的存在。只有记起她的名字，才能让她安息。]**`,
        timestamp: Date.now(),
        type: 'narration'
      });
      updateSanity(30);
    } else {
      // 检测@角色
      const mentionedChar = detectMentionedCharacter(lower);
      // 检测偏离剧本
      const deviation = detectDeviation(lower);
      
      if (deviation.isDeviating) {
        // 命运修正
        const correction = generateFateCorrection(deviation.type);
        addMessage({
          id: Date.now().toString(),
          agentId: 'dm',
          agentName: '主持人',
          avatar: AVATARS.dm,
          content: correction,
          timestamp: Date.now(),
          type: 'horror'
        });
        updateSanity(-5);
      } else if (mentionedChar) {
        // @角色回应
        const response = await generateCharacterResponse(mentionedChar.id, msg);
        addMessage({
          id: Date.now().toString(),
          agentId: mentionedChar.id,
          agentName: mentionedChar.name,
          avatar: AVATARS[mentionedChar.id] || AVATARS.dm,
          content: response,
          timestamp: Date.now(),
          type: 'dialogue'
        });
      } else {
        // 默认回应
        const responses = [
          { id: 'lengxing', name: '叶冷星', content: '（严肃地）我们需要冷静分析。这所学校一定隐藏着什么秘密。' },
          { id: 'siqi', name: '吕思琦', content: '（眼神闪躲）我...我好像想起了什么...但是...算了，应该是我记错了。' },
          { id: 'qingfeng', name: '姚青峰', content: '（摸着胸前的玉佩）这地方阴气太重了。我的玉都开始发烫了。' }
        ];
        const r = responses[Math.floor(Math.random() * responses.length)];
        addMessage({
          id: Date.now().toString(),
          agentId: r.id,
          agentName: r.name,
          avatar: AVATARS[r.id],
          content: r.content,
          timestamp: Date.now(),
          type: 'dialogue'
        });
      }
    }
  };

  // 检测@角色
  const detectMentionedCharacter = (input: string): { id: string; name: string } | null => {
    const chars = [
      { id: 'xuanxuan', name: '李萱萱', keywords: ['萱萱', '李萱萱', '眼镜'] },
      { id: 'yuqing', name: '谢雨晴', keywords: ['雨晴', '谢雨晴', '校花'] },
      { id: 'siqi', name: '吕思琦', keywords: ['思琦', '吕思琦', '课代表'] },
      { id: 'qingfeng', name: '姚青峰', keywords: ['青峰', '姚青峰', '玉佩'] },
      { id: 'lengxing', name: '叶冷星', keywords: ['冷星', '叶冷星', '班长'] },
      { id: 'huangfu', name: '皇甫青', keywords: ['皇甫', '皇甫青', '转校生'] },
      { id: 'ghost', name: '白衣恶灵', keywords: ['恶灵', '白衣', '鬼', '蒋温灵'] }
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
    if (input.includes('报警') || input.includes('警察') || input.includes('老师')) return { isDeviating: true, type: 'meta' };
    return { isDeviating: false, type: 'none' };
  };

  // 命运修正
  const generateFateCorrection = (type: string): string => {
    const corrections: Record<string, string[]> = {
      escape: [
        '你冲出教室想要逃跑，但走廊变得无限长。无论你跑多快，教室的门始终在你身后。当你停下来喘气时，发现自己又回到了原来的位置。\n\n**这所学校不会让你离开的。**',
        '你推开校门想要离开，但门外是一片浓得化不开的白雾。雾中有什么东西在蠕动...你本能地退了回来。\n\n**[理智值 -5]**'
      ],
      violence: [
        '你举起拳头想要攻击，但一阵剧烈的头痛袭来。你的视线模糊了，看到了那个被关在纸箱里的女孩...\n\n当你清醒过来时，发现自己跪在地上，手里紧紧攥着一张旧照片。',
        '你冲上去想要动手，但对方的眼神让你僵住了。那眼神里有某种熟悉的东西，让你想起了很久以前的事...'
      ],
      ignore: [
        '你闭上眼睛想要忽视一切。但黑暗中，那些画面反而更加清晰——"小病猫"的哭声在你脑海中回响...\n\n你无法忽视她。你必须记起她的名字。',
        '你试图什么都不做。但身体里有另一个声音在催促你："快想起来...在时间耗尽之前..."'
      ],
      meta: [
        '你想要找老师帮忙。但你突然发现，老师们的眼神都是空洞的，就像被什么东西控制了一样。他们看不到那些怪事。\n\n**只有你们才能解开这个诅咒。**',
        '你拿起手机想要报警，但屏幕上出现了一行字："你们忘了我...现在轮到你们了..."\n\n手机随即黑屏关机。'
      ]
    };
    const responses = corrections[type] || corrections.escape;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 生成角色回复（支持LLM）
  const generateCharacterResponse = async (charId: string, playerInput: string): Promise<string> => {
    const charTraits: Record<string, { traits: string; style: string }> = {
      xuanxuan: { traits: '戴眼镜的书卷气女生，表面乖巧内心阴暗', style: '轻声细语，偶尔露出阴森笑容' },
      yuqing: { traits: '极美的校花，傲慢伪善', style: '高傲，带优越感' },
      siqi: { traits: '温婉的课代表，藏着秘密', style: '温柔，有时突然沉默' },
      qingfeng: { traits: '风水世家富二代，戴通灵宝玉', style: '痞气，偶尔说风水术语' },
      lengxing: { traits: '严肃的班长学霸', style: '简洁有力，逻辑清晰' },
      huangfu: { traits: '神秘的转校生，冷酷帅气', style: '惜字如金' },
      ghost: { traits: '蒋温灵的怨灵，被遗忘的女孩', style: '断断续续，充满怨恨' }
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
              { role: 'system', content: `你是《第二十二条校规》中的角色。性格：${char.traits}。说话风格：${char.style}。背景：真相高中高二3班，有个被遗忘的女孩蒋温灵因校园霸凌而死。用中文回复，100-200字，保持角色性格。` },
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
      xuanxuan: ['（推眼镜，小声）你有没有觉得...这个班级少了什么人？', '（阴森地笑）有些事情...还是不知道比较好...'],
      yuqing: ['（轻蔑）这种事情和我有什么关系？我可是谢家的千金。', '（摸着戒指）这个四叶草戒指...是很久以前的事了...'],
      siqi: ['（眼神闪躲）我...我什么都不知道...', '（低声）李老师...他知道一些事情...'],
      qingfeng: ['（摸玉佩）这地方阴气太重了，我的玉都在发烫。', '（严肃）有东西...一直在看着我们。'],
      lengxing: ['（冷静）我们需要系统地分析这些线索。', '（皱眉）学校的历史档案里...似乎少了一些记录。'],
      huangfu: ['......', '（冷冷地）我来这里...是有原因的。'],
      ghost: ['你...们...忘了我...', '说出...我的名字...']
    };
    const responses = localResponses[charId] || ['（沉默）'];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickReplies = gamePhase === 'intro' 
    ? ['查看校规手册', '观察转校生', '@皇甫青 你是谁？', '我要逃离这里']
    : gamePhase === 'climax'
    ? ['蒋温灵！', '@姚青峰 你看到了什么？', '快跑！']
    : ['@李萱萱 你知道什么？', '调查线索', '前往天台'];

  const getSanityColor = () => {
    switch (sanity.level) {
      case 'broken': return 'bg-red-500';
      case 'panicked': return 'bg-orange-500';
      case 'anxious': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* 顶部栏 */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-4 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/script-murder')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Ghost className="w-5 h-5 text-purple-500" />
              第二十二条校规
            </h2>
            <p className="text-sm text-gray-400">{currentScene.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${sanity.current < 50 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span>理智值</span>
                <span>{sanity.current}%</span>
              </div>
              <Progress value={sanity.current} className={`h-2 ${getSanityColor()}`} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* 场景背景 */}
      <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${currentScene.backgroundImage})` }}>
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

      {/* 开始按钮 */}
      {!gameStarted && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <Ghost className="w-20 h-20 text-purple-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">第二十二条校规</h2>
            <p className="text-gray-400 mb-8 max-w-md">真相高中，升学率最高的名校。<br/>但这里隐藏着一个被遗忘的秘密...</p>
            <Button size="lg" onClick={startGame} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
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
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, i) => (
                <Button key={i} variant="outline" size="sm" className="text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" onClick={() => setInputText(reply)}>
                  {reply}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入你的行动或对话..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="rounded-full bg-purple-600 hover:bg-purple-700 h-12 w-12">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: GameMessage }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isPlayer = message.type === 'player';
  const isHorror = message.type === 'horror';
  const isGhost = message.agentId === 'ghost';

  useEffect(() => {
    if (!isPlayer) {
      setIsTyping(true);
      let i = 0;
      const speed = isGhost ? 50 : 25;
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
  }, [message.content, isPlayer, isGhost]);

  if (message.type === 'narration' || isHorror) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-4 border ${isHorror ? 'bg-red-900/30 border-red-700' : 'bg-gray-800/80 border-gray-700'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6"><AvatarImage src={message.avatar} /><AvatarFallback>DM</AvatarFallback></Avatar>
          <span className={`text-sm font-medium ${isHorror ? 'text-red-400' : 'text-purple-400'}`}>{message.agentName}</span>
        </div>
        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isHorror ? 'text-red-200' : 'text-gray-300'}`}>
          {displayedText}
          {isTyping && <span className="animate-pulse text-purple-400">▊</span>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: isPlayer ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isPlayer && (
        <Avatar className={`w-10 h-10 ${isGhost ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
          <AvatarImage src={message.avatar} /><AvatarFallback>{message.agentName[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%]`}>
        {!isPlayer && <span className={`text-xs mb-1 block ${isGhost ? 'text-red-400' : 'text-gray-400'}`}>{message.agentName}</span>}
        <div className={`px-4 py-2 rounded-2xl ${isPlayer ? 'bg-purple-600 text-white rounded-br-sm' : isGhost ? 'bg-red-900/80 text-red-100 border border-red-700 rounded-bl-sm' : 'bg-gray-700 text-gray-100 rounded-bl-sm'}`}>
          <p className="text-sm whitespace-pre-wrap">{displayedText}{isTyping && <span className="animate-pulse">▊</span>}</p>
        </div>
      </div>
      {isPlayer && <Avatar className="w-10 h-10"><AvatarImage src={message.avatar} /><AvatarFallback>你</AvatarFallback></Avatar>}
    </motion.div>
  );
}
