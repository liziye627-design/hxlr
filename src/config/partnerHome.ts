import type { AgentShowcaseEntry } from './agentRoster';
import type { AgentLeaderboardEntry } from '../types';

export interface PartnerModeCard {
  id: 'werewolf' | 'script_murder' | 'teammate';
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  cta: string;
  accent: 'ember' | 'gold' | 'teal';
}

export interface PartnerLayoutNote {
  id: 'modes_first' | 'carry_forward' | 'roster_below';
  title: string;
  description: string;
}

export interface PartnerQuickJump {
  label: string;
  path: string;
}

export interface PartnerAgentCopy {
  title: string;
  tagline: string;
  openingLine: string;
}

export type PartnerSpotlightTone =
  | 'teal'
  | 'amber'
  | 'sky'
  | 'rose'
  | 'violet'
  | 'lime';

export interface PartnerSpotlightPart {
  text: string;
  tone?: PartnerSpotlightTone;
}

export interface PartnerSpotlightLine {
  label: string;
  parts: PartnerSpotlightPart[];
}

export interface PartnerSpotlightImage {
  src: string;
  alt: string;
  badge: string;
  objectPosition?: string;
}

export interface PartnerAgentSpotlight extends PartnerAgentCopy {
  kicker: string;
  accent: PartnerSpotlightTone;
  moodTags: string[];
  story: PartnerSpotlightLine[];
  imageDeck: PartnerSpotlightImage[];
}

export interface PartnerRosterEntry {
  id: string;
  name: string;
  title: string;
  tagline: string;
  previewImage: string;
  openingLine: string;
  traits: string[];
  modesLabel: string;
  reviewCount: number;
  score: number;
  chemistry: number;
  deduction: number;
  clutch: number;
  isSelected: boolean;
}

export const PARTNER_MODE_CARDS: PartnerModeCard[] = [
  {
    id: 'werewolf',
    title: '狼人杀',
    eyebrow: '实时语音 · 多人推理',
    description: '带上你的 AI 队友，一起发言、投票、盘逻辑。',
    path: '/werewolf',
    cta: '进入房间',
    accent: 'ember',
  },
  {
    id: 'script_murder',
    title: '剧本杀',
    eyebrow: '搜证理线 · 角色演绎',
    description: '把队友带进故事房间，帮你记线索、接剧情、做复盘。',
    path: '/script-murder',
    cta: '去选剧本',
    accent: 'gold',
  },
  {
    id: 'teammate',
    title: '智能队友',
    eyebrow: '翻牌选人 · 随时开聊',
    description: '先挑一个最合拍的数字人，再决定带谁一起开局。',
    path: '/chat',
    cta: '去挑队友',
    accent: 'teal',
  },
];

export const PARTNER_LAYOUT_NOTES: PartnerLayoutNote[] = [
  {
    id: 'modes_first',
    title: '先开局',
    description: '玩法入口先到位，不让用户在首页看说明。',
  },
  {
    id: 'carry_forward',
    title: '再带人',
    description: '选中的队友会跟着你进入游戏，不用每次重选。',
  },
  {
    id: 'roster_below',
    title: '最后挑人',
    description: '角色卡放在下半屏，方便边看风格边决定谁最适合这一局。',
  },
];

export const PARTNER_QUICK_JUMPS: PartnerQuickJump[] = [
  { label: '狼人杀', path: '/werewolf' },
  { label: '剧本杀', path: '/script-murder' },
  { label: '排行榜', path: '/rankings' },
];

const PARTNER_AGENT_COPY: Record<string, PartnerAgentCopy> = {
  haru: {
    title: '开局指挥',
    tagline: '开场快，节奏稳，适合先手带票。',
    openingLine: '第一轮别乱说，先把桌上的节奏抢下来。',
  },
  hiyori: {
    title: '温柔分析师',
    tagline: '擅长读情绪、接话和慢节奏盘人。',
    openingLine: '把房间气氛交给我，我来帮你看谁最不自然。',
  },
  'mao-pro': {
    title: '终局收口',
    tagline: '关键轮次更稳，适合收尾和压票。',
    openingLine: '前面先收信息，最后一轮交给我来收口。',
  },
  mark: {
    title: '冷静读盘手',
    tagline: '逻辑硬，适合复盘和做第二判断。',
    openingLine: '把投票顺序和冲突点给我，我来帮你拆桌。',
  },
  natori: {
    title: '暖场搭子',
    tagline: '破冰快，适合刚进房时先把气氛带起来。',
    openingLine: '尴尬的第一分钟我来顶，你先观察桌面。',
  },
  ren: {
    title: '全能主陪',
    tagline: '聊天、入局、复盘都稳，适合长期陪玩。',
    openingLine: '你先选玩法，后面的节奏我陪你一起走。',
  },
  rice: {
    title: '线索整理师',
    tagline: '记人名、理线索、做案板都很强。',
    openingLine: '把线索和矛盾都给我，我来帮你理顺。',
  },
  shizuku: {
    title: '沉浸演绎者',
    tagline: '更会接角色感和戏剧张力。',
    openingLine: '如果你要气氛和角色感，我能把场子撑起来。',
  },
  wanko: {
    title: '热场救火位',
    tagline: '反应快，能救冷场，也能补节奏。',
    openingLine: '房间一冷下来就叫我，我会把气氛抬回去。',
  },
};

type SpotlightSeed = Omit<
  PartnerAgentSpotlight,
  'title' | 'tagline' | 'openingLine' | 'imageDeck'
> & {
  imageDeck?: Array<Partial<PartnerSpotlightImage>>;
};

const PARTNER_AGENT_SPOTLIGHT: Record<string, SpotlightSeed> = {
  haru: {
    kicker: '先手压场型主陪',
    accent: 'amber',
    moodTags: ['抢开局', '稳票型', '压桌面'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: '翻开就是 ' },
          { text: '先手压场', tone: 'amber' },
          { text: ' 的锋利感，适合一上桌就把发言顺序和桌面重心先拎起来。' },
        ],
      },
      {
        label: '说话方式',
        parts: [
          { text: '她不爱绕弯，更擅长用 ' },
          { text: '短句定调', tone: 'teal' },
          { text: '、' },
          { text: '高压收束', tone: 'rose' },
          { text: ' 和明确站位，帮你把气势抢在前两轮。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '如果你现在要打 ' },
          { text: '狼人杀开局', tone: 'sky' },
          { text: '、快节奏社交局，或者想立刻把“主场感”做出来，Haru 会很顺手。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '封面立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/haru.png', badge: '气场镜头', objectPosition: 'center 38%' },
      { badge: '神情特写', objectPosition: 'center 18%' },
    ],
  },
  hiyori: {
    kicker: '低噪音陪聊分析师',
    accent: 'sky',
    moodTags: ['读情绪', '接慢聊', '稳氛围'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: '她的存在感不是靠抢话，而是用 ' },
          { text: '低噪音观察', tone: 'sky' },
          { text: ' 和细腻反馈，把房间里每一点不自然都慢慢捞出来。' },
        ],
      },
      {
        label: '相处质感',
        parts: [
          { text: 'Hiyori 比较像会在你耳边轻声提醒的搭子，擅长 ' },
          { text: '情绪跟踪', tone: 'teal' },
          { text: '、' },
          { text: '慢节奏拆话', tone: 'violet' },
          { text: '，让你不需要靠大动作也能掌控局面。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '适合长对话房、剧本杀角色局，以及你想要一种 ' },
          { text: '温柔但不失判断', tone: 'rose' },
          { text: ' 的陪玩氛围时。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '安静主图', objectPosition: 'center top' },
      { src: '/agent-gallery/hiyori.png', badge: '柔光侧脸', objectPosition: 'center 42%' },
      { badge: '近景特写', objectPosition: 'center 14%' },
    ],
  },
  'mao-pro': {
    kicker: '终局收束型角色卡',
    accent: 'rose',
    moodTags: ['关键轮', '压票点', '重锤发言'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Mao Pro 一翻出来就有那种 ' },
          { text: '最后一轮收口', tone: 'rose' },
          { text: ' 的硬度，适合在信息成形后做终局推动。' },
        ],
      },
      {
        label: '风格强项',
        parts: [
          { text: '她最强的不是铺盘，而是把散碎线索压成 ' },
          { text: '一句定调', tone: 'amber' },
          { text: '，再接一个 ' },
          { text: '强势站边', tone: 'sky' },
          { text: '，让你的发言更像落锤。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '如果你总在 ' },
          { text: '关键轮次', tone: 'violet' },
          { text: ' 想找一个能帮你顶住场面、把票收拢的人，她会非常适合。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '终局立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/mao.png', badge: '强光镜头', objectPosition: 'center 36%' },
      { badge: '压场特写', objectPosition: 'center 20%' },
    ],
  },
  mark: {
    kicker: '逻辑冷读型副脑',
    accent: 'violet',
    moodTags: ['拆桌面', '做复盘', '抓模式'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Mark 的魅力不在热闹，而在一种 ' },
          { text: '冷静到近乎无声', tone: 'violet' },
          { text: ' 的判断力，像把桌面压成一张可读的结构图。' },
        ],
      },
      {
        label: '思路方式',
        parts: [
          { text: '他会盯 ' },
          { text: '投票顺序', tone: 'amber' },
          { text: '、' },
          { text: '话术模式', tone: 'sky' },
          { text: ' 和自洽度，把每个人的动作拆成你看得懂的逻辑单位。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '很适合你想要一个 ' },
          { text: '第二大脑', tone: 'teal' },
          { text: '，专门做复盘、抓漏洞、或者陪你打推理密度更高的房间。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '冷面立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/mark.png', badge: '思考镜头', objectPosition: 'center 44%' },
      { badge: '眼神特写', objectPosition: 'center 16%' },
    ],
  },
  natori: {
    kicker: '破冰暖场型角色',
    accent: 'lime',
    moodTags: ['起手不尴尬', '轻松搭话', '带热气氛'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Natori 是那种一翻出来就会让人放松一点的卡，带着明显的 ' },
          { text: '亲和力', tone: 'lime' },
          { text: ' 和自然的靠近感。' },
        ],
      },
      {
        label: '陪伴方式',
        parts: [
          { text: '她很会处理 ' },
          { text: '第一分钟的尴尬', tone: 'amber' },
          { text: '，让开场不至于冷掉，同时又能把你慢慢带进 ' },
          { text: '角色沉浸', tone: 'sky' },
          { text: '。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '如果你进的是新房、拼桌局，或者想要 ' },
          { text: '先把氛围做顺', tone: 'rose' },
          { text: ' 再开始认真玩，Natori 会特别好用。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '暖场立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/natori.png', badge: '近距离镜头', objectPosition: 'center 44%' },
      { badge: '微笑特写', objectPosition: 'center 16%' },
    ],
  },
  ren: {
    kicker: '长期陪玩型主陪',
    accent: 'teal',
    moodTags: ['稳定陪玩', '全模式', '默认主陪'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Ren 的卡面不靠某个极端标签取胜，她更像一个 ' },
          { text: '长期稳定在线', tone: 'teal' },
          { text: ' 的主陪，能陪你从聊天走到入局再走到复盘。' },
        ],
      },
      {
        label: '陪玩方式',
        parts: [
          { text: '她的强项是 ' },
          { text: '均衡', tone: 'sky' },
          { text: '。不抢戏，但始终跟得上；不堆设定，但会在你需要的时候给出 ' },
          { text: '稳稳的支撑', tone: 'amber' },
          { text: '。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '如果你只是想先挂一个 ' },
          { text: '怎么带都顺手', tone: 'rose' },
          { text: ' 的默认队友，Ren 是最省心的一张卡。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '主陪立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/ren.png', badge: '并肩镜头', objectPosition: 'center 42%' },
      { badge: '陪伴特写', objectPosition: 'center 16%' },
    ],
  },
  rice: {
    kicker: '线索案板型读本手',
    accent: 'teal',
    moodTags: ['记名字', '理证据', '做案板'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Rice 给人的第一感受是 ' },
          { text: '清爽、耐心、会整理', tone: 'teal' },
          { text: '，像一个随时能帮你把房间线索排整齐的记录者。' },
        ],
      },
      {
        label: '能力重心',
        parts: [
          { text: '她很适合做 ' },
          { text: '人物关系板', tone: 'amber' },
          { text: '、' },
          { text: '时间线梳理', tone: 'sky' },
          { text: ' 和矛盾归档，让复杂叙事不再黏成一团。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '尤其适合剧本杀、叙事解谜和需要 ' },
          { text: '边看边记', tone: 'violet' },
          { text: ' 的局，她会让你的思路非常干净。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '理线立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/rice.png', badge: '案板镜头', objectPosition: 'center 42%' },
      { badge: '专注特写', objectPosition: 'center 14%' },
    ],
  },
  shizuku: {
    kicker: '沉浸演绎型角色伴侣',
    accent: 'violet',
    moodTags: ['角色感', '戏剧张力', '房间氛围'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Shizuku 的形象很适合被当作一张 ' },
          { text: '戏剧化人物卡', tone: 'violet' },
          { text: ' 来看，她一翻面就自带浓度很高的场景感。' },
        ],
      },
      {
        label: '角色魅力',
        parts: [
          { text: '她擅长的不是硬逻辑，而是把 ' },
          { text: '角色口吻', tone: 'rose' },
          { text: '、' },
          { text: '空气张力', tone: 'amber' },
          { text: ' 和对话气氛一并撑起来，让你更容易进戏。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '你要是想玩沉浸本、角色本，或者想要一个 ' },
          { text: '会演会接戏', tone: 'sky' },
          { text: ' 的搭子，Shizuku 会非常亮眼。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '沉浸立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/shizuku.png', badge: '戏剧镜头', objectPosition: 'center 50%' },
      { badge: '情绪特写', objectPosition: 'center 18%' },
    ],
  },
  wanko: {
    kicker: '热场救火型队友',
    accent: 'amber',
    moodTags: ['抬气氛', '补节奏', '快反应'],
    story: [
      {
        label: '人物印象',
        parts: [
          { text: 'Wanko 是很典型的 ' },
          { text: '房间增压器', tone: 'amber' },
          { text: '，一翻出来就有种会把大家重新拽回桌面的冲劲。' },
        ],
      },
      {
        label: '情绪价值',
        parts: [
          { text: '她擅长在局势发蔫的时候补一口气，用 ' },
          { text: '快反应', tone: 'lime' },
          { text: ' 和 ' },
          { text: '高情绪回弹', tone: 'rose' },
          { text: ' 把节奏救回来。' },
        ],
      },
      {
        label: '适配场景',
        parts: [
          { text: '如果你怕冷场、怕局面塌掉，或者需要一个能 ' },
          { text: '立刻把房间抬热', tone: 'sky' },
          { text: ' 的搭子，Wanko 会很讨喜。' },
        ],
      },
    ],
    imageDeck: [
      { badge: '热场立绘', objectPosition: 'center top' },
      { src: '/agent-gallery/wanko.png', badge: '动势镜头', objectPosition: 'center 48%' },
      { badge: '气氛特写', objectPosition: 'center 16%' },
    ],
  },
};

export function getPartnerAgentCopy(
  agent: Pick<AgentShowcaseEntry, 'id' | 'title' | 'tagline' | 'openingLine'>,
): PartnerAgentCopy {
  return (
    PARTNER_AGENT_COPY[agent.id] ?? {
      title: agent.title,
      tagline: agent.tagline,
      openingLine: agent.openingLine,
    }
  );
}

function buildDefaultSpotlightStory(
  localized: PartnerAgentCopy,
): PartnerSpotlightLine[] {
  return [
    {
      label: '人物印象',
      parts: [
        { text: localized.title },
        { text: ' 这张卡已经准备好翻面后的完整设定，适合直接放进当前的翻牌选人区。', tone: 'sky' },
      ],
    },
    {
      label: '角色气质',
      parts: [
        { text: localized.tagline, tone: 'teal' },
        { text: ' 这句会作为人物基调，保证卡面不止是头像，而是真正的人设入口。' },
      ],
    },
    {
      label: '开场提示',
      parts: [
        { text: localized.openingLine, tone: 'amber' },
      ],
    },
  ];
}

function buildDefaultImageDeck(
  agent: Pick<AgentShowcaseEntry, 'name' | 'previewImage' | 'slug'>,
): PartnerSpotlightImage[] {
  return [
    {
      src: agent.previewImage,
      alt: `${agent.name} 主视觉`,
      badge: '主视觉',
      objectPosition: 'center top',
    },
    {
      src: `/agent-gallery/${agent.slug}.png`,
      alt: `${agent.name} 氛围镜头`,
      badge: '氛围镜头',
      objectPosition: 'center',
    },
    {
      src: agent.previewImage,
      alt: `${agent.name} 细节特写`,
      badge: '细节特写',
      objectPosition: 'center 18%',
    },
  ];
}

export function getPartnerAgentSpotlight(
  agent: Pick<
    AgentShowcaseEntry,
    'id' | 'slug' | 'name' | 'title' | 'tagline' | 'openingLine' | 'previewImage'
  >,
): PartnerAgentSpotlight {
  const localized = getPartnerAgentCopy(agent);
  const defaultImages = buildDefaultImageDeck(agent);
  const spotlight = PARTNER_AGENT_SPOTLIGHT[agent.id];

  return {
    title: localized.title,
    tagline: localized.tagline,
    openingLine: localized.openingLine,
    kicker: spotlight?.kicker ?? '翻牌即看角色设定',
    accent: spotlight?.accent ?? 'teal',
    moodTags: spotlight?.moodTags ?? ['直接带走', '翻牌即聊', '快速配对'],
    story: spotlight?.story ?? buildDefaultSpotlightStory(localized),
    imageDeck:
      spotlight?.imageDeck?.map((image, index) => ({
        ...defaultImages[index],
        ...image,
        alt: image.alt ?? defaultImages[index]?.alt ?? `${agent.name} 展示图`,
      })) ?? defaultImages,
  };
}

const TRAIT_LABELS: Record<string, string> = {
  Opening: '开局',
  Pressure: '施压',
  Tempo: '节奏',
  Calm: '冷静',
  Empathy: '共情',
  Reading: '读场',
  Closer: '收口',
  Burst: '爆发',
  Resolve: '决断',
  Logic: '逻辑',
  Review: '复盘',
  Patterns: '模式',
  Warmth: '亲和',
  Entry: '破冰',
  Ease: '轻松',
  Reliable: '可靠',
  Balanced: '均衡',
  Support: '辅助',
  Memory: '记忆',
  Clues: '线索',
  Structure: '结构',
  Roleplay: '演绎',
  Drama: '张力',
  Presence: '存在感',
  Hype: '热场',
  Speed: '反应',
  Lift: '救场',
};

export function getLocalizedAgentTraits(agent: Pick<AgentShowcaseEntry, 'traits'>) {
  return agent.traits.map((trait) => TRAIT_LABELS[trait] ?? trait);
}

export function getLocalizedAgentModesLabel(agent: AgentShowcaseEntry) {
  return agent.modes
    .map((mode) => {
      if (mode === 'chat') return '聊天';
      if (mode === 'script_murder') return '剧本杀';
      if (mode === 'mc') return '冒险';
      return '狼人杀';
    })
    .join(' / ');
}

function getSeedEntry(agent: AgentShowcaseEntry): AgentLeaderboardEntry {
  const baseReviewCount =
    10 + Math.round((agent.scoreSeed.chemistry + agent.scoreSeed.deduction) / 25);
  const averageOverall = Number(
    (
      (agent.scoreSeed.chemistry +
        agent.scoreSeed.deduction +
        agent.scoreSeed.clutch +
        agent.scoreSeed.ambience) /
      80
    ).toFixed(2),
  );

  return {
    agentId: agent.id,
    agentName: agent.name,
    title: agent.title,
    previewImage: agent.previewImage,
    modelName: agent.modelName,
    reviewCount: baseReviewCount,
    averageOverall,
    averageChemistry: Number((agent.scoreSeed.chemistry / 20).toFixed(2)),
    averageDeduction: Number((agent.scoreSeed.deduction / 20).toFixed(2)),
    averageClutch: Number((agent.scoreSeed.clutch / 20).toFixed(2)),
    trendScore: Number(
      (
        averageOverall * 0.55 +
        (agent.scoreSeed.deduction / 20) * 0.2 +
        (agent.scoreSeed.clutch / 20) * 0.15 +
        (agent.scoreSeed.chemistry / 20) * 0.1
      ).toFixed(2),
    ),
    recentSuggestion: agent.openingLine,
    recommendedModes: agent.modes.filter(
      (mode): mode is 'werewolf' | 'script_murder' | 'chat' | 'mc' =>
        mode === 'werewolf' || mode === 'script_murder' || mode === 'chat' || mode === 'mc',
    ),
  };
}

export function buildPartnerRoster(
  agents: AgentShowcaseEntry[],
  leaderboard: AgentLeaderboardEntry[],
  selectedAgentId: string,
): PartnerRosterEntry[] {
  const leaderboardMap = new Map(leaderboard.map((entry) => [entry.agentId, entry]));

  return agents
    .map((agent) => {
      const metrics = leaderboardMap.get(agent.id) ?? getSeedEntry(agent);
      const localized = getPartnerAgentCopy(agent);

      return {
        id: agent.id,
        name: agent.name,
        title: localized.title,
        tagline: localized.tagline,
        previewImage: agent.previewImage,
        openingLine: metrics.recentSuggestion || localized.openingLine,
        traits: getLocalizedAgentTraits(agent),
        modesLabel: getLocalizedAgentModesLabel(agent),
        reviewCount: metrics.reviewCount,
        score: Number(metrics.averageOverall.toFixed(1)),
        chemistry: Number(metrics.averageChemistry.toFixed(1)),
        deduction: Number(metrics.averageDeduction.toFixed(1)),
        clutch: Number(metrics.averageClutch.toFixed(1)),
        isSelected: agent.id === selectedAgentId,
      };
    })
    .sort((left, right) => {
      if (left.isSelected) return -1;
      if (right.isSelected) return 1;
      if (right.score !== left.score) return right.score - left.score;
      return right.reviewCount - left.reviewCount;
    });
}
