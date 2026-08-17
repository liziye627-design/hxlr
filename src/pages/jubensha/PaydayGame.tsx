/**
 * 收获日 (Payday) - 游戏房间
 * 犯罪黑色电影剧本杀
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Send, Timer, ArrowLeft, AlertTriangle, Crosshair, DollarSign } from 'lucide-react';
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
  type: 'dialogue' | 'narration' | 'player' | 'crisis' | 'action';
  avatar?: string;
}

// 头像配置
const AVATARS: Record<string, string> = {
  dm: 'https://api.dicebear.com/7.x/bottts/svg?seed=heistdm&backgroundColor=1f2937',
  architect: 'https://api.dicebear.com/7.x/bottts/svg?seed=architect&backgroundColor=374151',
  hammer: 'https://api.dicebear.com/7.x/bottts/svg?seed=hammer&backgroundColor=dc2626',
  ghost: 'https://api.dicebear.com/7.x/bottts/svg?seed=ghost&backgroundColor=3b82f6',
  viper: 'https://api.dicebear.com/7.x/adventurer/svg?seed=viper&backgroundColor=dc2626&hair=long',
  driver: 'https://api.dicebear.com/7.x/bottts/svg?seed=driver&backgroundColor=6366f1',
  joker: 'https://api.dicebear.com/7.x/bottts/svg?seed=jokerclown&backgroundColor=f59e0b',
  doc: 'https://api.dicebear.com/7.x/bottts/svg?seed=doc&backgroundColor=10b981',
  player: 'https://api.dicebear.com/7.x/bottts/svg?seed=heistplayer&backgroundColor=8b5cf6'
};

// 角色名称
const AGENT_NAMES: Record<string, string> = {
  dm: '主持人',
  architect: '建筑师',
  hammer: '重锤',
  ghost: '幽灵',
  viper: '蝰蛇',
  driver: '车手',
  joker: '小丑',
  doc: '医生'
};

export default function PaydayGame() {
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'standoff' | 'twist' | 'climax' | 'ending'>('standoff');
  const [timeLeft, setTimeLeft] = useState(30); // 30分钟倒计时
  const [tension, setTension] = useState(0); // 紧张度 0-100
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 倒计时
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGamePhase('climax');
            return 0;
          }
          // 时间越少，紧张度越高
          if (prev === 20) setGamePhase('twist');
          return prev - 1;
        });
      }, 60000); // 每分钟减1
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted]);

  const addMessage = useCallback((msg: GameMessage) => {
    setMessages(prev => [...prev, msg]);
    if (!isMuted && (msg.type === 'dialogue' || msg.type === 'narration')) {
      try {
        const clean = msg.content.replace(/\*\*\[.*?\]\*\*/g, '').replace(/\*\*/g, '').substring(0, 400);
        tts.speak(clean, msg.agentId);
      } catch (e) { console.error(e); }
    }
  }, [isMuted]);

  const updateTension = useCallback((amount: number) => {
    setTension(prev => Math.min(100, Math.max(0, prev + amount)));
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGamePhase('standoff');
    
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `**[收获日 - 最后的狂欢]**
**[地点：废弃地铁维护站]**
**[时间：警察到达前30分钟]**

荧光灯闪烁着，发出令人不安的嗡嗡声。

你们刚刚完成了历史上最大的银行劫案——抢劫了"奥林匹斯金库"。现在，你们躲在这个废弃的地铁维护站里，等待接应的直升机。

金属桌上堆满了黑色旅行袋，里面装着数不清的现金。空气中弥漫着机油和紧张的气息。

突然，建筑师的手机响了。他看了一眼，脸色变了。

**"坏消息。直升机...只能坐3个人。"**

而你们，有7个人。

远处，警笛声隐约可闻。

**[紧张度 +20]**

**[可选行动]**
1. 质问建筑师为什么会这样
2. 提议检查赃款
3. 观察其他人的反应
4. 建议投票决定谁走`,
        timestamp: Date.now(),
        type: 'narration'
      });
      updateTension(20);
    }, 500);

    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        agentId: 'hammer',
        agentName: '重锤',
        avatar: AVATARS.hammer,
        content: '（猛地站起来，手按在枪套上）什么他妈的意思？！只能坐3个人？！建筑师，你最好给我一个解释！',
        timestamp: Date.now() + 1,
        type: 'dialogue'
      });
    }, 4000);

    setTimeout(() => {
      addMessage({
        id: (Date.now() + 2).toString(),
        agentId: 'joker',
        agentName: '小丑',
        avatar: AVATARS.joker,
        content: '（疯狂地笑起来）哈哈哈哈！太棒了！这才是派对的开始啊！你们不觉得这样更刺激吗？',
        timestamp: Date.now() + 2,
        type: 'dialogue'
      });
    }, 6000);

    setTimeout(() => {
      addMessage({
        id: (Date.now() + 3).toString(),
        agentId: 'viper',
        agentName: '蝰蛇',
        avatar: AVATARS.viper,
        content: '（冷冷地看着幽灵）在我们决定谁走之前...也许应该先检查一下，每个人都拿了什么。',
        timestamp: Date.now() + 3,
        type: 'dialogue'
      });
    }, 8000);
  }, [addMessage, updateTension]);

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

    if (lower.includes('检查') || lower.includes('赃款') || lower.includes('袋子') || lower.includes('钱')) {
      updateTension(15);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `你提议检查赃款。

气氛瞬间变得更加紧张。

**小丑**的笑容僵住了一瞬间。
**幽灵**下意识地把手伸向背包。
**建筑师**的眼神闪过一丝不易察觉的慌乱。

**[紧张度 +15]**

当你打开第一个袋子时，里面确实是成捆的现金。但是...

等等，袋子底部有什么东西在闪烁？

是一个...红色的LED灯？`,
        timestamp: Date.now(),
        type: 'crisis'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'ghost',
          agentName: '幽灵',
          avatar: AVATARS.ghost,
          content: '（紧张地）那...那是追踪器！金库里一定有追踪器混进来了！我们必须把它扔掉！',
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 2000);

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 2).toString(),
          agentId: 'joker',
          agentName: '小丑',
          avatar: AVATARS.joker,
          content: '（突然严肃）别动那个袋子。相信我，你不会想动它的。',
          timestamp: Date.now() + 2,
          type: 'dialogue'
        });
      }, 4000);
    } else if (lower.includes('投票') || lower.includes('决定') || lower.includes('谁走')) {
      updateTension(20);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `投票？有趣的提议。

**建筑师**点了点头："民主的方式。很好。"

**重锤**冷笑："投票？我手里的枪就是我的选票。"

**医生**温和地说："也许我们应该冷静下来，理性讨论..."（他的目光一直停留在重锤身上）

**车手**沉默地站在门口，似乎在观察什么。

**[紧张度 +20]**

现在，每个人都在互相打量。
信任已经开始崩塌。

**[可选行动]**
1. 提议自己应该留下的理由
2. 指出某个人可疑
3. 询问车手为什么一直看门口`,
        timestamp: Date.now(),
        type: 'narration'
      });
    } else if (lower.includes('车手') || lower.includes('门口') || lower.includes('可疑')) {
      setGamePhase('twist');
      updateTension(30);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `你注意到车手一直在看门口。

就在这时，建筑师的手机又响了。

他接起电话，脸色骤变。

**"什么？！"**

他挂断电话，看向车手，眼中满是杀意。

**"警方谈判专家刚才打来的。他们问我...'张警官在不在？'"**

所有人的目光都转向了车手。

**[紧张度 +30]**
**[危机：卧底暴露？]**`,
        timestamp: Date.now(),
        type: 'crisis'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'driver',
          agentName: '车手',
          avatar: AVATARS.driver,
          content: '（面无表情）...我不知道你在说什么。也许是打错了。',
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 2000);

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 2).toString(),
          agentId: 'hammer',
          agentName: '重锤',
          avatar: AVATARS.hammer,
          content: '（拔出枪指向车手）条子？！我就知道有内鬼！',
          timestamp: Date.now() + 2,
          type: 'dialogue'
        });
      }, 4000);
    } else if (lower.includes('硬盘') || lower.includes('幽灵') || lower.includes('蝰蛇')) {
      updateTension(25);
      addMessage({
        id: Date.now().toString(),
        agentId: 'viper',
        agentName: '蝰蛇',
        avatar: AVATARS.viper,
        content: `（眼神危险地眯起）幽灵，亲爱的...你的背包里装的是什么？

我记得金库里不只有钱。还有一个...加密硬盘？

（她的手悄悄伸向风衣里的消音手枪）

那个硬盘，我要了。`,
        timestamp: Date.now(),
        type: 'dialogue'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'ghost',
          agentName: '幽灵',
          avatar: AVATARS.ghost,
          content: '（后退一步）你...你怎么知道硬盘的事？！除非...你就是想销毁证据的那个人！',
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 2000);
    } else if (lower.includes('炸弹') || lower.includes('爆炸') || lower.includes('小丑')) {
      setGamePhase('climax');
      updateTension(40);
      addMessage({
        id: Date.now().toString(),
        agentId: 'joker',
        agentName: '小丑',
        avatar: AVATARS.joker,
        content: `（疯狂大笑）

哈哈哈哈哈！！！

你们终于发现了！

没错，那不是追踪器...那是我的杰作！

（他从口袋里掏出一个遥控器）

**"这不是关于钱的问题...这是关于传递信息！"**

还有5分钟，这里就会变成最美丽的烟花！

而你们...都会陪我一起欣赏！

**[炸弹倒计时：5分钟]**
**[紧张度 MAX]**`,
        timestamp: Date.now(),
        type: 'crisis'
      });
      setTension(100);
    } else if (lower.includes('医生') || lower.includes('重锤') || lower.includes('手术刀')) {
      updateTension(20);
      addMessage({
        id: Date.now().toString(),
        agentId: 'doc',
        agentName: '医生',
        avatar: AVATARS.doc,
        content: `（温和地微笑，但眼神冰冷）

重锤...你还记得我吗？

15年前，芝加哥，那个雨夜...

你是唯一一个从我手下逃掉的人。

（他缓缓从医疗包里抽出一把闪亮的手术刀）

我等这一天...等了很久了。`,
        timestamp: Date.now(),
        type: 'dialogue'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'hammer',
          agentName: '重锤',
          avatar: AVATARS.hammer,
          content: '（瞳孔收缩）...是你？！那个...连环杀手？！',
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 2000);
    } else if (lower.includes('下水道') || lower.includes('隧道')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'architect',
        agentName: '建筑师',
        avatar: AVATARS.architect,
        content: `（冷静地）

既然直升机只能坐3个人...也许我们应该考虑其他选择。

（他指向远处的隧道）

下水道。我研究过这里的地图。那条隧道通向城外。

当然...只有我知道正确的路线。

所以，谁想跟我走？`,
        timestamp: Date.now(),
        type: 'dialogue'
      });
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
          type: 'crisis'
        });
        updateTension(10);
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
        // 随机回应
        const responses = [
          { id: 'architect', content: '（冷静地分析）我们需要保持理性。内斗只会让警察得逞。' },
          { id: 'hammer', content: '（烦躁地）废话少说！谁再BB我就先崩了谁！' },
          { id: 'ghost', content: '（紧张地看着电脑）警方的无线电...他们在调动特警...' },
          { id: 'viper', content: '（妩媚地笑）也许我们可以...私下谈谈？' },
          { id: 'joker', content: '（唱歌）Tick tock, tick tock~ 时间不多了哦~' },
          { id: 'doc', content: '（温和地）大家冷静，我这里有镇定剂，需要的话...' }
        ];
        const r = responses[Math.floor(Math.random() * responses.length)];
        addMessage({
          id: Date.now().toString(),
          agentId: r.id,
          agentName: AGENT_NAMES[r.id],
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
      { id: 'architect', name: '建筑师', keywords: ['建筑师', '策划', 'architect'] },
      { id: 'hammer', name: '重锤', keywords: ['重锤', '火力', 'hammer'] },
      { id: 'ghost', name: '幽灵', keywords: ['幽灵', '黑客', 'ghost'] },
      { id: 'viper', name: '蝰蛇', keywords: ['蝰蛇', '内应', 'viper'] },
      { id: 'driver', name: '车手', keywords: ['车手', '司机', 'driver'] },
      { id: 'joker', name: '小丑', keywords: ['小丑', '爆破', 'joker'] },
      { id: 'doc', name: '医生', keywords: ['医生', '急救', 'doc'] }
    ];
    for (const c of chars) {
      if (c.keywords.some(k => input.includes(k))) return { id: c.id, name: c.name };
    }
    return null;
  };

  // 检测偏离剧本
  const detectDeviation = (input: string): { isDeviating: boolean; type: string } => {
    if (input.includes('逃') || input.includes('离开') || input.includes('跑')) return { isDeviating: true, type: 'escape' };
    if (input.includes('投降') || input.includes('自首') || input.includes('放弃')) return { isDeviating: true, type: 'surrender' };
    if (input.includes('不管') || input.includes('躺平') || input.includes('睡觉')) return { isDeviating: true, type: 'ignore' };
    if (input.includes('报警') || input.includes('警察') || input.includes('谈判')) return { isDeviating: true, type: 'meta' };
    return { isDeviating: false, type: 'none' };
  };

  // 命运修正
  const generateFateCorrection = (type: string): string => {
    const corrections: Record<string, string[]> = {
      escape: [
        '你转身想要逃跑，但重锤的枪口已经对准了你的后脑勺。\n\n"想跑？钱还没分呢，兄弟。"\n\n你只能慢慢转回身来。\n\n**[紧张度 +10]**',
        '你试图冲向出口，但建筑师按下了什么按钮——铁门轰然落下，封住了唯一的出路。\n\n"没人能离开...除非我说可以。"'
      ],
      surrender: [
        '你举起双手想要投降。但蝰蛇的消音手枪已经抵住了你的太阳穴。\n\n"投降？你知道太多了，亲爱的。死人才能保守秘密。"\n\n你只能放下手。',
        '你想要自首，但小丑疯狂地笑着晃动遥控器。\n\n"投降？那我的烟花表演怎么办？不行不行，你必须留下来看完！"'
      ],
      ignore: [
        '你试图置身事外。但医生温和地走过来，手里拿着注射器。\n\n"你看起来很紧张...需要来一针吗？"\n\n他的眼神让你不寒而栗。你决定还是参与讨论比较安全。',
        '你想要什么都不做。但幽灵的声音在你耳边响起：\n\n"警方的热成像已经锁定了我们所有人。没有人能置身事外。"'
      ],
      meta: [
        '你想要和警察谈判。但建筑师冷笑着展示了手机屏幕——上面是你家人的照片。\n\n"我有你所有人的资料。谁敢报警...后果自负。"\n\n**[紧张度 +10]**',
        '你试图联系外界。但车手——或者说"张警官"——摇了摇头。\n\n"外面有50个狙击手。你一露头就是死。相信我，我知道。"'
      ]
    };
    const responses = corrections[type] || corrections.escape;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 生成角色回复（支持LLM）
  const generateCharacterResponse = async (charId: string, playerInput: string): Promise<string> => {
    const charTraits: Record<string, { traits: string; style: string; secret: string }> = {
      architect: { traits: '冷静的策划者', style: '理性分析，城府深', secret: '没安排直升机，要独吞赃款' },
      hammer: { traits: '暴躁的火力手', style: '粗暴直接，动不动就拔枪', secret: '欠黑帮债，要杀光所有人' },
      ghost: { traits: '紧张的黑客', style: '技术宅，说话快', secret: '商业间谍，要带走硬盘' },
      viper: { traits: '妩媚的内应', style: '性感危险，话里有话', secret: '硬盘有她的罪证，要杀幽灵' },
      driver: { traits: '沉默的车手', style: '惜字如金，观察力强', secret: '警方卧底，要拖延时间' },
      joker: { traits: '疯狂的爆破手', style: '癫狂，爱唱歌，不可预测', secret: '纵火狂，放了炸弹' },
      doc: { traits: '温和的医生', style: '温文尔雅，关心他人', secret: '连环杀手，要解剖重锤' }
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
              { role: 'system', content: `你是《收获日》中的${AGENT_NAMES[charId]}。性格：${char.traits}。说话风格：${char.style}。隐藏秘密：${char.secret}（不要直接说出）。背景：银行劫案后，7人分赃，直升机只能坐3人。用中文回复，100-200字，保持角色性格。` },
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
      architect: ['（冷静地）我们需要理性分析。内斗只会让警察得逞。', '（看着地图）我有一个计划...但需要你们的配合。'],
      hammer: ['（拔枪）谁再废话我就先崩了谁！', '（烦躁）老子欠的债...今天必须还清！'],
      ghost: ['（紧张地敲键盘）警方在调动特警...我们时间不多了。', '（护住背包）这个硬盘...比钱更重要。'],
      viper: ['（妩媚地笑）也许我们可以...私下谈谈？', '（眼神危险）幽灵，你的背包里装的是什么？'],
      driver: ['......', '（看向门口）外面有动静。'],
      joker: ['（唱歌）Tick tock~ 时间不多了哦~', '（疯笑）想知道袋子里是什么吗？嘻嘻嘻~'],
      doc: ['（温和地）大家冷静，我这里有镇定剂。', '（看着重锤）你的伤口...需要我处理一下吗？']
    };
    const responses = localResponses[charId] || ['（沉默）'];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickReplies = gamePhase === 'standoff'
    ? ['检查赃款', '提议投票', '@车手 你为什么一直看门口？', '@建筑师 直升机在哪？']
    : gamePhase === 'twist'
    ? ['@车手 你是卧底？', '@小丑 袋子里是什么？', '检查炸弹', '我要逃跑']
    : ['拆除炸弹', '@医生 你能帮忙吗？', '制服小丑', '投降'];

  const getTensionColor = () => {
    if (tension >= 80) return 'bg-red-500';
    if (tension >= 50) return 'bg-orange-500';
    if (tension >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* 顶部栏 */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/script-murder')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              收获日
            </h2>
            <p className="text-sm text-gray-400">废弃地铁维护站</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 倒计时 */}
          <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1 rounded-full">
            <Timer className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-mono font-bold">{timeLeft}:00</span>
          </div>

          {/* 紧张度 */}
          <div className="flex items-center gap-2">
            <Crosshair className={`w-5 h-5 ${tension > 50 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-20">
              <div className="flex justify-between text-xs mb-1">
                <span>紧张度</span>
              </div>
              <Progress value={tension} className={`h-2 ${getTensionColor()}`} />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* 场景背景 */}
      <div 
        className="h-32 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/70 to-gray-950" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <p className="text-sm text-gray-300">昏暗的工业风格，荧光灯闪烁，金属桌上堆满黑色旅行袋...</p>
          {tension > 70 && (
            <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>局势失控</span>
            </div>
          )}
        </div>
      </div>

      {/* 开始按钮 */}
      {!gameStarted && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <DollarSign className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">收获日</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              史上最大的银行劫案刚刚完成。<br/>
              但直升机只能坐3个人。<br/>
              而你们有7个人。
            </p>
            <Button size="lg" onClick={startGame} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-6 text-lg">
              开始行动
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
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, i) => (
                <Button key={i} variant="outline" size="sm" className="text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-yellow-400" onClick={() => setInputText(reply)}>
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
                placeholder="说点什么，或者采取行动..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="rounded-full bg-yellow-600 hover:bg-yellow-700 h-12 w-12">
                <Send className="w-5 h-5 text-black" />
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
  const isCrisis = message.type === 'crisis';

  useEffect(() => {
    if (!isPlayer) {
      setIsTyping(true);
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText(message.content.slice(0, i));
        i++;
        if (i > message.content.length) {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, 20);
      return () => clearInterval(timer);
    } else {
      setDisplayedText(message.content);
    }
  }, [message.content, isPlayer]);

  if (message.type === 'narration' || isCrisis) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-4 border ${isCrisis ? 'bg-red-950/50 border-red-800' : 'bg-gray-900/80 border-gray-800'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6"><AvatarImage src={message.avatar} /><AvatarFallback>DM</AvatarFallback></Avatar>
          <span className={`text-sm font-medium ${isCrisis ? 'text-red-400' : 'text-yellow-400'}`}>{message.agentName}</span>
        </div>
        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isCrisis ? 'text-red-200' : 'text-gray-300'}`}>
          {displayedText}
          {isTyping && <span className="animate-pulse text-yellow-400">▊</span>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: isPlayer ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isPlayer && (
        <Avatar className="w-10 h-10">
          <AvatarImage src={message.avatar} /><AvatarFallback>{message.agentName[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-[75%]">
        {!isPlayer && <span className="text-xs mb-1 block text-gray-500">{message.agentName}</span>}
        <div className={`px-4 py-2 rounded-2xl ${isPlayer ? 'bg-yellow-600 text-black rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
          <p className="text-sm whitespace-pre-wrap">{displayedText}{isTyping && <span className="animate-pulse">▊</span>}</p>
        </div>
      </div>
      {isPlayer && <Avatar className="w-10 h-10"><AvatarImage src={message.avatar} /><AvatarFallback>你</AvatarFallback></Avatar>}
    </motion.div>
  );
}
