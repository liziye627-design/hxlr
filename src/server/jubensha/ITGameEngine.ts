/**
 * 小丑回魂 (IT) - 游戏引擎
 * 处理多Agent协作、恐惧值系统、场景管理
 */

import { IT_SCRIPT, IT_AGENTS, IT_SCENES, detectFearKeywords, calculateSanityLevel, type FearMeter, type ITAgent, type ITScene } from './scripts/it_pennywise.js';

export interface ITGameState {
  roomId: string visibleScenes: string[];
  currentSceneId: string;
  phase: 'intro' | 'exploration' | 'encounter' | 'confrontation' | 'resolution';
  fearMeters: Map<string, FearMeter>;
  conversationHistory: ConversationMessage[];
  activeAgents: string[];
  pennywiseRevealed: boolean;
  cluesFound: string[];
  gameTime: string; // 游戏内时间
}

export interface ConversationMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
  type: 'dialogue' | 'narration' | 'action' | 'system';
  metadata?: {
    fearIncrease?: number;
    sceneChange?: string;
    clueRevealed?: string;
  };
}

export class ITGameEngine {
  private state: ITGameState;
  private apiKey: string;
  private onMessage: (msg: ConversationMessage) => void;

  constructor(roomId: string, apiKey: string, onMessage: (msg: ConversationMessage) => void) {
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.state = {
      roomId,
      currentSceneId: 'derry_barrens',
      visibleScenes: ['derry_barrens', 'derry_library'],
      phase: 'intro',
      fearMeters: new Map(),
      conversationHistory: [],
      activeAgents: ['dm', 'bill', 'beverly', 'richie'],
      pennywiseRevealed: false,
      cluesFound: [],
      gameTime: '1989年夏天，下午3点'
    };

    // 初始化玩家恐惧值
    this.state.fearMeters.set('player', {
      playerId: 'player',
      currentFear: 0,
      maxFear: 100,
      personalTrauma: '',
      traumaKeywords: [],
      sanityLevel: 'stable'
    });
  }

  // 获取当前场景
  getCurrentScene(): ITScene | undefined {
    return IT_SCENES.find(s => s.id === this.state.currentSceneId);
  }

  // 获取Agent配置
  getAgent(agentId: string): ITAgent | undefined {
    return IT_AGENTS.find(a => a.id === agentId);
  }

  // 开始游戏 - DM 开场白
  async startGame(): Promise<void> {
    const dmAgent = this.getAgent('dm');
    const scene = this.getCurrentScene();
    
    const introMessage = `**[当前位置 / Current Location]**
${scene?.nameCN || '荒原'}

**[氛围状态 / Atmosphere]**
${scene?.atmosphere || 'uneasy'} - ${scene?.descriptionCN || ''}

**[游戏时间]**
${this.state.gameTime}

**[叙述 / Narrative]**
欢迎来到德里镇，1989年的夏天。

这是一个看似平静的小镇，但最近几个月，孩子们开始失踪。海报贴满了每一根电线杆，但大人们似乎对此视而不见。

你是"窝囊废俱乐部"的一员——一群被欺负的孩子，但你们拥有彼此。今天，你们聚集在荒原的秘密基地，讨论一件可怕的事情：你们都看到了"它"。

比尔的弟弟乔治去年失踪了。他相信乔治还活着，被困在某个地方。他需要你们的帮助。

**[可选行动 / Available Actions]**
1. 询问比尔关于乔治失踪的细节
2. 分享你自己看到的可怕景象
3. 建议去图书馆调查德里镇的历史
4. 提议去尼伯特街29号探险`;

    this.broadcastMessage({
      id: this.generateId(),
      agentId: 'dm',
      agentName: '游戏主持人',
      content: introMessage,
      timestamp: Date.now(),
      type: 'narration'
    });

    // Bill 的开场
    setTimeout(async () => {
      await this.agentSpeak('bill', '大……大家，谢谢你们来。我……我知道这听起来很疯狂，但是……乔治没有死。我……我能感觉到。那个东西……那个小丑……它带走了他。我们必须找到它！');
    }, 3000);
  }

  // Agent 发言
  async agentSpeak(agentId: string, content: string): Promise<void> {
    const agent = this.getAgent(agentId);
    if (!agent) return;

    this.broadcastMessage({
      id: this.generateId(),
      agentId: agent.id,
      agentName: agent.nameCN,
      content,
      timestamp: Date.now(),
      type: 'dialogue'
    });
  }

  // 处理玩家输入
  async handlePlayerInput(playerId: string, message: string): Promise<void> {
    // 记录玩家消息
    this.state.conversationHistory.push({
      id: this.generateId(),
      agentId: 'player',
      agentName: '玩家',
      content: message,
      timestamp: Date.now(),
      type: 'dialogue'
    });

    // 检测恐惧关键词
    const fearResult = detectFearKeywords(message);
    if (fearResult.detected) {
      this.updateFear('player', fearResult.intensity);
    }

    // 根据消息内容决定哪个Agent回应
    const response = await this.generateAgentResponse(message);
    
    // 广播回应
    for (const resp of response) {
      await this.delay(1500);
      this.broadcastMessage(resp);
    }
  }

  // 生成Agent回应
  private async generateAgentResponse(playerMessage: string): Promise<ConversationMessage[]> {
    const responses: ConversationMessage[] = [];
    const lowerMsg = playerMessage.toLowerCase();

    // 检查是否触发潘尼怀斯
    if (this.shouldTriggerPennywise(playerMessage)) {
      responses.push(await this.triggerPennywise(playerMessage));
      return responses;
    }

    // 根据关键词决定回应者
    if (lowerMsg.includes('乔治') || lowerMsg.includes('georgie') || lowerMsg.includes('弟弟')) {
      // Bill 回应关于乔治的问题
      responses.push({
        id: this.generateId(),
        agentId: 'bill',
        agentName: '"结巴"比尔',
        content: this.getBillResponse(playerMessage),
        timestamp: Date.now(),
        type: 'dialogue',
        metadata: { fearIncrease: 5 }
      });
    } else if (lowerMsg.includes('图书馆') || lowerMsg.includes('历史') || lowerMsg.includes('调查')) {
      // DM 描述场景变化
      responses.push({
        id: this.generateId(),
        agentId: 'dm',
        agentName: '游戏主持人',
        content: this.getLibraryNarration(),
        timestamp: Date.now(),
        type: 'narration',
        metadata: { sceneChange: 'derry_library' }
      });
      this.state.currentSceneId = 'derry_library';
    } else if (lowerMsg.includes('尼伯特') || lowerMsg.includes('neibolt') || lowerMsg.includes('29号') || lowerMsg.includes('废屋')) {
      // 进入危险区域
      responses.push({
        id: this.generateId(),
        agentId: 'dm',
        agentName: '游戏主持人',
        content: this.getNeiboltNarration(),
        timestamp: Date.now(),
        type: 'narration',
        metadata: { sceneChange: 'neibolt_street', fearIncrease: 15 }
      });
      this.state.currentSceneId = 'neibolt_street';
      this.updateFear('player', 15);
    } else if (lowerMsg.includes('害怕') || lowerMsg.includes('恐惧') || lowerMsg.includes('看到')) {
      // Beverly 分享她的经历
      responses.push({
        id: this.generateId(),
        agentId: 'beverly',
        agentName: '贝弗莉',
        content: this.getBeverlyResponse(playerMessage),
        timestamp: Date.now(),
        type: 'dialogue'
      });
    } else {
      // Richie 用幽默回应
      responses.push({
        id: this.generateId(),
        agentId: 'richie',
        agentName: '"大嘴"里奇',
        content: this.getRichieResponse(playerMessage),
        timestamp: Date.now(),
        type: 'dialogue'
      });
    }

    return responses;
  }

  // Bill 的回应
  private getBillResponse(playerMessage: string): string {
    const responses = [
      '那……那天下着大雨。我……我给乔治折了一只纸船。他……他追着船跑进了下水道……然后……然后就再也没有回来。警察说他被水冲走了，但是……但是我知道不是这样。我……我看到了那个小丑的眼睛。它……它在笑。',
      '乔治才……才七岁。他……他什么都不懂。那个东西……那个小丑……它……它骗了他。它说它叫潘尼怀斯，跳……跳舞的小丑。它说它会把船还给他……',
      '我……我每天晚上都能听到乔治在叫我。"比……比利，救我！"我……我必须找到他。你们……你们会帮我的，对……对吧？'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Beverly 的回应
  private getBeverlyResponse(playerMessage: string): string {
    const responses = [
      '我也看到了一些东西。在我家的浴室里……水槽里喷出了血。到处都是血。但是当我叫我爸来看的时候，他什么都看不到。只有我能看到。',
      '我觉得……这个镇子有问题。不只是那个小丑。是整个德里镇。大人们好像被蒙蔽了眼睛，他们看不到正在发生的事情。',
      '我们必须团结在一起。只要我们在一起，我就不那么害怕了。我们是窝囊废俱乐部，对吧？窝囊废们要互相照应。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Richie 的回应
  private getRichieResponse(playerMessage: string): string {
    const responses = [
      '嘿嘿，你们知道吗？我觉得这个小丑肯定是从马戏团跑出来的疯子。也许他只是想找人一起玩气球？（紧张地笑）好吧好吧，我知道这不好笑……',
      '说真的，伙计们，我们真的要去追一个杀人小丑吗？我是说……我们连亨利·鲍尔斯都打不过，更别说一个超自然的怪物了！（声音有点发抖）',
      '好吧，如果我们要死，至少让我说完我的笑话。为什么小丑过马路？因为……因为……算了，我想不出来了。我太紧张了。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 图书馆叙述
  private getLibraryNarration(): string {
    return `**[场景切换]**
你们来到了德里公共图书馆。

这是一座古老的建筑，空气中弥漫着旧书和灰尘的味道。阳光透过高大的窗户照进来，在地板上投下长长的影子。

你们找到了历史区域，开始翻阅关于德里镇的旧档案。

**[发现线索]**
在一本泛黄的旧书中，你发现了一个令人不安的规律：

- 1906年：铁工厂爆炸，102人死亡
- 1929年：黑帮枪战，镇中心大屠杀
- 1962年：黑点酒吧纵火案，88人死亡
- 1989年：儿童连续失踪案...

每隔大约27年，德里镇就会发生一次大规模的悲剧。

更令人毛骨悚然的是，在一张1908年的老照片中，你看到了一个熟悉的身影——一个穿着银色小丑服的人，站在人群中，对着镜头微笑。

**[恐惧值 +10]**

**[可选行动]**
1. 继续调查这个27年的周期
2. 询问图书管理员关于这些事件
3. 离开图书馆，去尼伯特街29号
4. 回到荒原讨论发现`;
  }

  // 尼伯特街叙述
  private getNeiboltNarration(): string {
    this.state.phase = 'encounter';
    return `**[场景切换 - 危险区域]**
尼伯特街29号

你们站在那座废弃的房子前。它看起来比周围的任何建筑都要古老、腐朽。

油漆剥落，露出下面发黑的木头。窗户像空洞的眼睛一样盯着你们。前门微微敞开，仿佛在邀请你们进入。

空气突然变得冰冷。你能闻到一股腐烂的甜味，混合着……气球的橡胶味？

**[氛围状态]**
terrifying - 极度恐怖

比尔握紧了拳头："这……这就是那个地方。我……我能感觉到乔治在里面。"

贝弗莉紧紧抓住你的手臂："我们真的要进去吗？"

里奇的声音在发抖："伙计们，我……我有个很不好的预感……"

**[恐惧值 +15]**

从房子深处，传来了一个孩子的笑声……

**[可选行动]**
1. 鼓起勇气，进入房子
2. 先在外面观察，寻找其他入口
3. 这太危险了，建议撤退
4. 大声呼唤乔治的名字`;
  }

  // 判断是否触发潘尼怀斯
  private shouldTriggerPennywise(message: string): boolean {
    const triggerWords = ['进入', '进去', '开门', '探索', '深入', '地下室', '下水道', '小丑', '潘尼怀斯'];
    const lowerMsg = message.toLowerCase();
    
    // 在尼伯特街或下水道场景中更容易触发
    if (this.state.currentSceneId === 'neibolt_street' || this.state.currentSceneId === 'derry_sewers') {
      return triggerWords.some(word => lowerMsg.includes(word)) || Math.random() < 0.3;
    }
    
    return false;
  }

  // 触发潘尼怀斯
  private async triggerPennywise(playerMessage: string): Promise<ConversationMessage> {
    this.state.pennywiseRevealed = true;
    this.state.phase = 'confrontation';
    this.updateFear('player', 30);

    const pennywiseLines = [
      `嗨呀~~~！！！

（一个高大的身影从阴影中走出。银色的小丑服在黑暗中闪闪发光，橘红色的头发像火焰一样竖立着。它的笑容太宽了，宽得不像人类。）

"哦哦哦~~~新朋友来啦！！！潘尼怀斯好开心呀！！！"

（它的眼睛从蓝色变成了捕食者的黄色）

"你们都来找乔治吗？嘻嘻嘻~~~乔治现在和我在一起哦！他在下面漂浮呢~~~我们都在下面漂浮！！！"

（它伸出一只手，手里握着一个红色的气球）

"想要气球吗？拿着气球，你也可以漂浮哦~~~"

**[恐惧值 +30]**
**[理智检定]**

你感到一阵强烈的恐惧涌上心头。你的腿在发抖，但你的朋友们就在你身边。

**[可选行动]**
1. 大声告诉它你不害怕（需要勇气）
2. 和朋友们一起后退
3. 质问它乔治在哪里
4. 尝试攻击它`,
      
      `"哦~~~你在害怕！！！我能闻到你的恐惧~~~好香啊~~~"

（小丑的脸开始扭曲变形，变成了你最害怕的东西的模样）

"你以为你能逃跑吗？嘻嘻嘻~~~没有人能逃离德里！！！这是我的镇子！！！我的猎场！！！"

（它的声音突然变得低沉而古老）

"我已经在这里等待了亿万年。每27年，我就会醒来，品尝你们的恐惧。你们的恐惧……是最美味的。"

**[恐惧值 +25]**`
    ];

    return {
      id: this.generateId(),
      agentId: 'pennywise',
      agentName: '潘尼怀斯',
      content: pennywiseLines[0],
      timestamp: Date.now(),
      type: 'dialogue',
      metadata: { fearIncrease: 30 }
    };
  }

  // 更新恐惧值
  private updateFear(playerId: string, amount: number): void {
    const meter = this.state.fearMeters.get(playerId);
    if (meter) {
      meter.currentFear = Math.min(100, Math.max(0, meter.currentFear + amount));
      meter.sanityLevel = calculateSanityLevel(meter.currentFear);
    }
  }

  // 获取玩家恐惧值
  getFearMeter(playerId: string): FearMeter | undefined {
    return this.state.fearMeters.get(playerId);
  }

  // 广播消息
  private broadcastMessage(msg: ConversationMessage): void {
    this.state.conversationHistory.push(msg);
    this.onMessage(msg);
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取游戏状态
  getState(): ITGameState {
    return this.state;
  }

  // 获取角色列表
  getCharacters(): Array<{ id: string; name: string; nameCN: string; avatar: string; type: string }> {
    return IT_AGENTS.filter(a => this.state.activeAgents.includes(a.id) || a.id === 'pennywise').map(a => ({
      id: a.id,
      name: a.name,
      nameCN: a.nameCN,
      avatar: this.getAgentAvatar(a.id),
      type: a.type
    }));
  }

  // 获取Agent头像
  private getAgentAvatar(agentId: string): string {
    const avatars: Record<string, string> = {
      dm: 'https://api.dicebear.com/7.x/bottts/svg?seed=dm&backgroundColor=6366f1',
      bill: 'https://api.dicebear.com/7.x/adventurer/svg?seed=bill&backgroundColor=3b82f6',
      beverly: 'https://api.dicebear.com/7.x/adventurer/svg?seed=beverly&hair=long&backgroundColor=ec4899',
      richie: 'https://api.dicebear.com/7.x/adventurer/svg?seed=richie&glasses=variant01&backgroundColor=f59e0b',
      eddie: 'https://api.dicebear.com/7.x/adventurer/svg?seed=eddie&backgroundColor=10b981',
      pennywise: 'https://api.dicebear.com/7.x/bottts/svg?seed=pennywise&backgroundColor=dc2626&eyes=robocop'
    };
    return avatars[agentId] || 'https://api.dicebear.com/7.x/bottts/svg?seed=default';
  }
}

export default ITGameEngine;
