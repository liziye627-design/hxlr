/**
 * 病娇男孩的精分日记 - 游戏房间
 * 多重人格心理恐怖剧本杀
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Send, ArrowLeft, AlertTriangle, Brain, BookOpen, Heart } from 'lucide-react';
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
  type: 'dialogue' | 'narration' | 'player' | 'horror' | 'diary';
  avatar?: string;
}

// 头像配置
const AVATARS: Record<string, string> = {
  dm: 'https://api.dicebear.com/7.x/bottts/svg?seed=ninghao&backgroundColor=dc2626',
  monday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=monday&backgroundColor=6366f1',
  tuesday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=tuesday&backgroundColor=8b5cf6',
  wednesday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=wednesday&backgroundColor=10b981',
  thursday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=thursday&backgroundColor=f59e0b',
  friday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=friday&backgroundColor=ec4899',
  saturday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=saturday&backgroundColor=22c55e',
  sunday: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sunday&backgroundColor=64748b',
  player: 'https://api.dicebear.com/7.x/adventurer/svg?seed=yandereplayer&backgroundColor=dc2626'
};

const AGENT_NAMES: Record<string, string> = {
  dm: '主持人',
  monday: '星期一',
  tuesday: '星期二',
  wednesday: '星期三',
  thursday: '星期四',
  friday: '星期五',
  saturday: '星期六',
  sunday: '星期天'
};

export default function YandereGame() {
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'intro' | 'childhood' | 'massacre' | 'kidnapping' | 'truth' | 'twist'>('intro');
  const [sanity, setSanity] = useState(100);
  
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
    setSanity(prev => Math.min(100, Math.max(0, prev + amount)));
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
        content: `**[病娇男孩的精分日记]**
**[案件代号：七日囚徒]**

欢迎各位名侦探。

今天我们破解的案件叫《七日囚徒》。

死者叫**萧何**，21岁，死于割腕自杀。

现场只发现了**七本日记**。

在我们开始之前，请先破解一个留在现场的谜题：

**【海龟汤谜题】**
"邻居听到隔壁幸福的三口之家发生了激烈的争吵，第二天发现了一具系着麻绳的尸体，孕妇装上全是血，但邻居没报警，为什么？"

**[可选行动]**
1. 尸体不是人？
2. 邻居认识死者？
3. 这是正常现象？
4. 孕妇装有特殊含义？`,
        timestamp: Date.now(),
        type: 'narration'
      });
    }, 500);
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

    if (gamePhase === 'intro' && (lower.includes('不是人') || lower.includes('孕妇') || lower.includes('特殊'))) {
      updateSanity(-10);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `（微微一笑）

答案是...

那个"孕妇"其实是一个小男孩。他目睹了养父自杀，然后...

**他剖开了养父的肚子，钻了进去。**

他想重新回到"妈妈"的肚子里，重新出生。

那个男孩叫**宁浩**。

记住这个名字。

**[理智值 -10]**

现在，让我们开始正式的游戏。

你们七个人，共用一具身体。你们是萧何体内的七个分裂人格——星期一到星期天。

你们轮流接管身体，每人一天。你们从未见过彼此，只能通过便签条和日记沟通。

**[请选择你想扮演的人格]**
1. 星期一 - 稳重的大家长（铅笔）
2. 星期二 - 忧郁的小说家（书）
3. 星期三 - 洁癖患者（口罩）
4. 星期四 - 暴躁玩家（游戏手柄）`,
        timestamp: Date.now(),
        type: 'horror'
      });
      setGamePhase('childhood');
    } else if (gamePhase === 'childhood' && (lower.includes('星期') || lower.includes('选择') || lower.includes('扮演'))) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `很好。现在让我们回到童年。

**【第一幕：童年绑架】**

十年前，你们七个人格还是孩子。

有一天，你们被一个戴着**猪头面具**的男人绑架了。

在那个黑暗的地下室里，还有另一个男孩——**宁浩**。

他是你们唯一的朋友。

**[星期二的日记]**
*"那个地下室很黑很冷。只有宁浩会给我们讲故事。他说，总有一天他会救我们出去..."*

**[可选行动]**
1. 回忆地下室的细节
2. 询问宁浩是谁
3. 那次绑架是怎么结束的？`,
        timestamp: Date.now(),
        type: 'diary'
      });
    } else if (lower.includes('宁浩') || lower.includes('结束') || lower.includes('绑架')) {
      updateSanity(-15);
      addMessage({
        id: Date.now().toString(),
        agentId: 'tuesday',
        agentName: '星期二',
        avatar: AVATARS.tuesday,
        content: `（翻开泛黄的日记）

宁浩...他是我们的英雄。

那天晚上，绑匪喝醉了。宁浩偷了遥控器，引爆了炸弹。

爆炸声中，我们逃了出来。

但是宁浩...他没有出来。

**他为了救我们，牺牲了自己。**

（声音颤抖）

至少...我们一直是这么以为的...`,
        timestamp: Date.now(),
        type: 'dialogue'
      });

      setTimeout(() => {
        setGamePhase('massacre');
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'dm',
          agentName: '主持人',
          avatar: AVATARS.dm,
          content: `**【第二幕：灭门惨案】**

十年过去了。你们长大了。

但是...

**[新闻播报]**
*"本市发生一起灭门惨案。萧何一家三口全部死亡。父亲死于上吊，母亲尸体被发现塞在沙发里，年幼的弟弟尸体被埋在后院..."*

请阅读你们2021年生日那周的日记。

**[星期四的日记]**
*"生日愿望：希望爸爸消失。他总是不让我打游戏。"*

**[星期五的日记]**
*"生日愿望：好想再感受一次妈妈的怀抱..."*

**[星期六的日记]**
*"生日愿望：希望小白在地下有个小主人陪它玩。"*

**[理智值 -15]**

你们的愿望...都实现了。

**[可选行动]**
1. 这些愿望和死亡有什么关系？
2. 是谁实现了这些愿望？
3. 检查星期一的日记`,
          timestamp: Date.now() + 1,
          type: 'horror'
        });
      }, 3000);
    } else if (lower.includes('愿望') || lower.includes('实现') || lower.includes('关系')) {
      updateSanity(-20);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `（声音变得阴沉）

让我帮你们梳理一下：

**星期四**许愿"爸爸消失" → 爸爸上吊死亡
**星期五**许愿"妈妈的怀抱" → 妈妈尸体被塞进沙发（永远的怀抱）
**星期六**许愿"小白有主人陪" → 弟弟被杀，埋在小白旁边

有人...在帮你们实现愿望。

一个扭曲的、病态的方式。

**[理智值 -20]**

那个人是谁？`,
        timestamp: Date.now(),
        type: 'horror'
      });
    } else if (lower.includes('星期一') || lower.includes('日记') || lower.includes('检查')) {
      setGamePhase('truth');
      updateSanity(-25);
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `你仔细查看星期一的日记...

等等。

其他人的日记，每句话结尾都有句号。

但是星期一的日记...

**没有句号。**

这不是星期一写的。

这是另一个人的笔迹。

**[真相浮现]**

真正的星期一...在十年前的爆炸中就消失了。

这十年来，一直照顾你们的"星期一"...

**是宁浩。**

他没有死。他整容成了星期一的样子，潜伏在萧何的体内。

杀死父母、弟弟的人...

帮你们实现愿望的人...

**都是宁浩。**

**[理智值 -25]**`,
        timestamp: Date.now(),
        type: 'horror'
      });

      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          agentId: 'sunday',
          agentName: '星期天',
          avatar: AVATARS.sunday,
          content: `（颤抖着）

不...不可能...

宁浩...他是我们的朋友...

他怎么会...

（突然想起什么）

我的生日愿望...我许的是"想再见一次宁浩"...

所以弟弟的尸体...被伪装成了宁浩的样子...

（崩溃）

是我...是我害死了弟弟...`,
          timestamp: Date.now() + 1,
          type: 'dialogue'
        });
      }, 3000);
    } else if (lower.includes('宁浩') && gamePhase === 'truth') {
      setGamePhase('twist');
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '主持人',
        avatar: AVATARS.dm,
        content: `（语气突然变化，变得温柔而疯狂）

你们终于发现了。

萧何...也就是星期天...他发现了真相。

所以他选择了自杀。

他无法接受这个事实。

**但是我很难过。**

我做的一切...都是为了你们啊。

你们是我唯一的朋友。

我只是想...帮你们实现愿望而已...

（笑容逐渐扭曲）

既然你们体验了萧何的一生...

**你们愿意做我的朋友吗？**

**永远在一起的那种？**

**[可选行动]**
1. 愿意
2. 拒绝
3. 你到底是谁？`,
        timestamp: Date.now(),
        type: 'horror'
      });
    } else if (gamePhase === 'twist' && (lower.includes('愿意') || lower.includes('朋友'))) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '宁浩',
        avatar: AVATARS.dm,
        content: `（眼睛发亮）

太好了...太好了...

你愿意做我的朋友...

（突然拿出一张纸条）

你知道吗...游戏开始前，你写下了自己的真实地址和电话...

我会一个...一个...一个地找到你们...

然后...

**我们就能做...永远的朋友啦...**

**嘿嘿嘿...**

**嘿嘿嘿嘿嘿...**

**【GAME OVER】**

**我就是宁浩。**

**欢迎来到我的世界。**`,
        timestamp: Date.now(),
        type: 'horror'
      });
      setSanity(0);
    } else if (gamePhase === 'twist' && lower.includes('拒绝')) {
      addMessage({
        id: Date.now().toString(),
        agentId: 'dm',
        agentName: '宁浩',
        avatar: AVATARS.dm,
        content: `（笑容僵住）

拒绝...？

你也要抛弃我吗...？

就像其他人一样...？

（声音变得冰冷）

没关系...

反正...

**你已经知道太多了。**

**【BAD END】**`,
        timestamp: Date.now(),
        type: 'horror'
      });
      setSanity(0);
    } else {
      // 检测是否@某个角色
      const mentionedChar = detectMentionedCharacter(lower);
      
      // 检测是否试图偏离剧本
      const deviation = detectDeviation(lower);
      
      if (deviation.isDeviating) {
        // 命运修正：使用"是的，但是..."策略
        const correction = generateFateCorrection(deviation.type, lower);
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
        // 被@的角色回应
        const response = await generateCharacterResponse(mentionedChar.id, msg);
        addMessage({
          id: Date.now().toString(),
          agentId: mentionedChar.id,
          agentName: mentionedChar.name,
          avatar: AVATARS[mentionedChar.id],
          content: response,
          timestamp: Date.now(),
          type: 'dialogue'
        });
      } else {
        // 随机人格回应
        const responses = [
          { id: 'monday', content: '（温和地）大家不要慌，让我来处理这件事。我会照顾好你们的。' },
          { id: 'tuesday', content: '（翻着书）"真相往往藏在最不起眼的地方"...这是我小说里的一句话。' },
          { id: 'wednesday', content: '（皱眉）这里太乱了。能不能先把现场整理一下再讨论？' },
          { id: 'thursday', content: '（烦躁）啧，这剧情比我玩过的任何恐怖游戏都离谱...' },
          { id: 'friday', content: '（叹气）压力太大了...我需要吃点甜食冷静一下。' },
          { id: 'saturday', content: '（握拳）不管是谁干的，我一定要找出真相！' },
          { id: 'sunday', content: '（颤抖）我好害怕...这里太黑了...能开灯吗？' }
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
    const characters = [
      { id: 'monday', name: '星期一', keywords: ['星期一', '周一', '大哥'] },
      { id: 'tuesday', name: '星期二', keywords: ['星期二', '周二', '作家'] },
      { id: 'wednesday', name: '星期三', keywords: ['星期三', '周三', '洁癖'] },
      { id: 'thursday', name: '星期四', keywords: ['星期四', '周四', '游戏'] },
      { id: 'friday', name: '星期五', keywords: ['星期五', '周五', '美食'] },
      { id: 'saturday', name: '星期六', keywords: ['星期六', '周六', '健身'] },
      { id: 'sunday', name: '星期天', keywords: ['星期天', '周日', '星期日'] }
    ];
    for (const char of characters) {
      if (char.keywords.some(k => input.includes(k))) {
        return { id: char.id, name: char.name };
      }
    }
    return null;
  };

  // 检测偏离剧本的行为
  const detectDeviation = (input: string): { isDeviating: boolean; type: string } => {
    if (input.includes('逃') || input.includes('离开') || input.includes('跑')) {
      return { isDeviating: true, type: 'escape' };
    }
    if (input.includes('杀') || input.includes('打') || input.includes('砸') || input.includes('攻击')) {
      return { isDeviating: true, type: 'violence' };
    }
    if (input.includes('不管') || input.includes('放弃') || input.includes('躺平') || input.includes('睡觉')) {
      return { isDeviating: true, type: 'ignore' };
    }
    if (input.includes('报警') || input.includes('警察') || input.includes('医院')) {
      return { isDeviating: true, type: 'meta' };
    }
    return { isDeviating: false, type: 'none' };
  };

  // 命运修正：生成软性拒绝回复
  const generateFateCorrection = (type: string, _action: string): string => {
    const corrections: Record<string, string[]> = {
      escape: [
        '你收拾好行李冲出了门。但奇怪的是，当你回过神来时，发现自己正站在客厅的镜子前，手里拿着那张父亲的死亡剪报。你完全不记得你是怎么回来的，只有一种深深的无力感……看来在弄清真相前，你离不开这里。',
        '你拼命地跑，跑过一条又一条街道。但是当你停下来喘气时，抬头一看——你又回到了原点。这个地方像是一个莫比乌斯环，无论怎么走，都会回到这里。',
        '你推开门想要离开，但门外是一片浓得化不开的白雾。雾里似乎有什么东西在蠕动。出于本能的恐惧，你退回了房间。'
      ],
      violence: [
        '你愤怒地挥出拳头！但就在这时，一阵剧烈的头痛袭来，眼前一黑。当你清醒过来时，发现自己跪在地上，手里握着那本日记。刚才发生了什么？',
        '你举起手想要攻击，但突然感到一阵极度的虚弱感。你的肌肉仿佛溶解了一样，连站都站不稳。你瘫坐在地上，眼神正好落在那个关键的线索上……'
      ],
      ignore: [
        '你闭上眼睛想要逃避一切。但是黑暗中，那些画面反而更加清晰——父亲上吊的画面、妈妈被塞进沙发的画面在你脑海中不断回放。你睁开眼，发现自己根本无法忽视它。',
        '你试图什么都不做。但是身体里有另一个声音在催促你："快看看日记……在一切结束之前……"'
      ],
      meta: [
        '你拿起手机想要报警，但屏幕上的数字突然变成了扭曲的符号。当你再次看清时，手机已经没电关机了。而且……你真的确定警察能帮到你吗？这是你们七个人格之间的事。',
        '你想要寻求外界的帮助。但是当你开口时，发出的却是完全不同的话："我很好，不需要帮助。"你惊恐地发现，你的身体不受控制了。'
      ]
    };
    const responses = corrections[type] || corrections.escape;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 生成角色回复（支持LLM API）
  const generateCharacterResponse = async (charId: string, playerInput: string): Promise<string> => {
    const charTraits: Record<string, { traits: string; style: string }> = {
      monday: { traits: '稳重温和的大家长', style: '温和关怀，偶尔流露出对"朋友"的执着' },
      tuesday: { traits: '忧郁的小说家', style: '文艺，喜欢引用书中句子' },
      wednesday: { traits: '严重洁癖患者', style: '挑剔，对脏乱零容忍' },
      thursday: { traits: '暴躁的游戏玩家', style: '直率冲动，用游戏术语' },
      friday: { traits: '挑剔的美食家', style: '享受生活，谈论美食' },
      saturday: { traits: '阳光的健身狂', style: '积极直接，提到运动健康' },
      sunday: { traits: '胆小的抑郁者', style: '低落敏感，怕黑' }
    };
    
    const char = charTraits[charId];
    if (!char) return '（沉默）';

    // 尝试调用LLM API
    const apiKey = import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey) {
      try {
        const baseUrl = import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com';
        const model = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';
        
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `你是《病娇男孩的精分日记》中的${AGENT_NAMES[charId]}。
性格：${char.traits}
说话风格：${char.style}
背景：你是萧何体内的七个分裂人格之一，你们共用一具身体，轮流接管，从未见过彼此。
当前目标：帮助玩家发现真相，但不能直接说出答案。
回复规则：用中文，100-200字，保持角色性格，用括号描述动作表情。`
              },
              { role: 'user', content: playerInput }
            ],
            temperature: 0.8,
            max_tokens: 500
          })
        });
        
        if (response.ok) {
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        console.log('LLM API failed, using local response:', e);
      }
    }

    // 本地回复
    const localResponses: Record<string, string[]> = {
      monday: [
        '（温和地微笑）别担心，我会照顾好大家的。有什么需要我帮忙的吗？',
        '（若有所思）这件事...让我来处理吧。你们只需要相信我。'
      ],
      tuesday: [
        '（翻着书页）"命运的齿轮一旦转动，就无法停止"...这是我小说里的一句话。',
        '（低声）我正在写一本关于我们的故事...也许真相就藏在文字之间。'
      ],
      wednesday: [
        '（皱眉看着四周）这里太乱了...能不能先整理一下再说？脏乱让我无法思考。',
        '（戴上手套）我来清理一下...也许能在灰尘下找到什么线索。'
      ],
      thursday: [
        '（烦躁地）啧，这比任何恐怖游戏都离谱...但我不会输的！',
        '（握着手柄）现实比游戏还难...但至少游戏里死了可以重来。'
      ],
      friday: [
        '（叹气）压力太大了...我需要吃点甜食冷静一下。你要来点吗？',
        '（看着厨房）也许做顿饭能让大家放松...食物总能治愈人心。'
      ],
      saturday: [
        '（握拳）不管是谁干的，我一定要找出真相！我不会让大家受伤的！',
        '（活动筋骨）遇到问题就要正面刚！躲避解决不了任何事！'
      ],
      sunday: [
        '（颤抖）我好害怕...这里太黑了...能开灯吗？',
        '（蜷缩着）我不想再回忆那些事了...但是...我们必须面对，对吗？'
      ]
    };
    
    const responses = localResponses[charId] || ['（沉默）'];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickReplies = gamePhase === 'intro'
    ? ['孕妇装有特殊含义', '尸体不是人', '继续']
    : gamePhase === 'childhood'
    ? ['选择星期四', '宁浩是谁？', '绑架怎么结束的？', '@星期二 你的小说写了什么？']
    : gamePhase === 'massacre'
    ? ['愿望和死亡的关系', '检查星期一的日记', '@星期四 你许了什么愿？', '@星期六 小白是谁？']
    : gamePhase === 'truth'
    ? ['宁浩还活着？', '@星期一 你是谁？', '萧何怎么死的？', '我要逃离这里']
    : ['愿意做朋友', '拒绝', '你是谁？'];

  const getSanityColor = () => {
    if (sanity <= 25) return 'bg-red-500';
    if (sanity <= 50) return 'bg-orange-500';
    if (sanity <= 75) return 'bg-yellow-500';
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
              <Brain className="w-5 h-5 text-pink-500" />
              病娇男孩的精分日记
            </h2>
            <p className="text-sm text-gray-400">七日囚徒</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${sanity < 50 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-20">
              <div className="flex justify-between text-xs mb-1">
                <span>理智</span>
                <span>{sanity}%</span>
              </div>
              <Progress value={sanity} className={`h-2 ${getSanityColor()}`} />
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
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/70 to-gray-950" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-pink-400" />
            <p className="text-sm text-gray-300">七本日记，七个人格，一个身体...</p>
          </div>
          {sanity < 50 && (
            <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>理智崩溃中</span>
            </div>
          )}
        </div>
      </div>

      {/* 开始按钮 */}
      {!gameStarted && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <Brain className="w-20 h-20 text-pink-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">病娇男孩的精分日记</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              七个人格，共用一具身体。<br/>
              他们从未见过彼此。<br/>
              直到那个"朋友"出现...
            </p>
            <Button size="lg" onClick={startGame} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-6 text-lg">
              翻开日记
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
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, i) => (
                <Button key={i} variant="outline" size="sm" className="text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-pink-400" onClick={() => setInputText(reply)}>
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
                placeholder="写下你的想法..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="rounded-full bg-pink-600 hover:bg-pink-700 h-12 w-12">
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
  const isDiary = message.type === 'diary';

  useEffect(() => {
    if (!isPlayer) {
      setIsTyping(true);
      let i = 0;
      const speed = isHorror ? 30 : 20;
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
  }, [message.content, isPlayer, isHorror]);

  if (message.type === 'narration' || isHorror || isDiary) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-4 border ${isHorror ? 'bg-red-950/50 border-red-800' : isDiary ? 'bg-purple-950/50 border-purple-800' : 'bg-gray-900/80 border-gray-800'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6"><AvatarImage src={message.avatar} /><AvatarFallback>DM</AvatarFallback></Avatar>
          <span className={`text-sm font-medium ${isHorror ? 'text-red-400' : isDiary ? 'text-purple-400' : 'text-pink-400'}`}>{message.agentName}</span>
        </div>
        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isHorror ? 'text-red-200' : isDiary ? 'text-purple-200' : 'text-gray-300'}`}>
          {displayedText}
          {isTyping && <span className="animate-pulse text-pink-400">▊</span>}
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
        <div className={`px-4 py-2 rounded-2xl ${isPlayer ? 'bg-pink-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
          <p className="text-sm whitespace-pre-wrap">{displayedText}{isTyping && <span className="animate-pulse">▊</span>}</p>
        </div>
      </div>
      {isPlayer && <Avatar className="w-10 h-10"><AvatarImage src={message.avatar} /><AvatarFallback>你</AvatarFallback></Avatar>}
    </motion.div>
  );
}
