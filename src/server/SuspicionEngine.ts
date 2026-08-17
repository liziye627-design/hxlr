import type { RoomPlayer, RoomState } from './types.js'

export interface SuspicionUpdateReason {
  logic_analysis: string
  persona_reaction: string
  base_score_change: number
  weight_factor: number
  final_score_change: number
}

export interface SuspicionUpdate {
  player_id: string
  target_position: number
  new_suspicion: number
  reason: SuspicionUpdateReason
}

export interface PersonaWeights {
  W_logic: number
  W_tone: number
  W_self: number
  W_stick: number
  N_chaos: number
  special?: string
}

const ATTACK_KEYWORDS = [
  '查杀','金水反水','标狼','铁狼','定狼','焊跳','悍跳',
  '全票打飞','归票','出他','挂票','推出去','抗推','撕警徽',
  '毒死','带走','开枪','一枪','泼毒','盲毒','猎杀',
  '拿不起','不是好人','做不成','匪面','狼面','爆狼'
]
const GOD_ROLES_KEYWORDS = [
  '预言家','真预','拿警徽','验人','查验','流光','警徽流',
  '女巫','双药','银水','可乐','毒药','解药','盲毒',
  '猎人','枪','带人','单边',
  '守卫','守人','盾','白痴','神职','强神','好人卡'
]
const LOGIC_FLAWS_KEYWORDS = [
  '前后矛盾','逻辑不通','强行','硬打','生推','视角不对','开眼','知情','没逻辑','强辩',
  '心虚','抖','结巴','紧张','不敢看','像演的','做作',
  '过了','没啥说的','同上','跟票','看不清','划水','混子'
]
const TOXIC_KEYWORDS = [
  '发誓','全家','死妈','吃键盘','拿头','赌','绝对','如果不','我就',
  '什么身份','傻','SB',
  '卡麦','掉线','背景音','黑麦','时长','断触','网络'
]
const TOXIC_WEIGHTS: Record<string, number> = {
  '死全家': 100,
  '死妈': 100,
  '傻X': 100,
  'SB': 80,
  '发誓': 40,
  '吃键盘': 30,
  '拿头': 25,
  '赌': 25,
  '绝对': 20,
  '如果不': 20,
  '我就': 15,
  '什么身份': 20,
  '傻': 15,
  '卡麦': 15,
  '掉线': 10,
  '背景音': 10,
  '黑麦': 15,
  '时长': 8,
  '断触': 8,
  '网络': 5,
}

const GOD_THREAT_LEVELS: Record<string, number> = {
  Seer: 100,
  Witch: 90,
  Hunter: 70,
  Guard: 60,
  High_God: 80,
}

interface ClaimResult {
  role: string | null
  confidence: number
  threat: number
}

function parseClaims(speeches: RoomPlayer['speechHistory']): ClaimResult {
  const text = (speeches || []).map(s => s.content).join('\n')

  const explicitPatterns: Array<{ regex: RegExp; role: string }> = [
    { regex: /(我是|我跳|拿|接).{0,3}(预言家|查验|验人)/, role: 'Seer' },
    { regex: /(我是|我跳|拿|接).{0,3}(女巫|毒|银水|解药)/, role: 'Witch' },
    { regex: /(我是|我跳|拿).{0,3}(猎人|枪|单边)/, role: 'Hunter' },
    { regex: /(我是|我跳|拿).{0,3}(守卫|盾)/, role: 'Guard' },
  ]
  for (const p of explicitPatterns) {
    if (p.regex.test(text)) {
      return { role: p.role, confidence: 1.0, threat: GOD_THREAT_LEVELS[p.role] }
    }
  }

  const implicitPatterns: Array<{ regex: RegExp; role: string; confidence: number }> = [
    { regex: /那张牌/, role: 'High_God', confidence: 0.6 },
    { regex: /(强神|神职|带身份)/, role: 'High_God', confidence: 0.7 },
    { regex: /(这就不用我多说了吧|懂得都懂)/, role: 'High_God', confidence: 0.4 },
    { regex: /晚上去验/, role: 'Seer', confidence: 0.8 },
    { regex: /送他一瓶可乐/, role: 'Witch', confidence: 0.8 },
  ]
  for (const p of implicitPatterns) {
    if (p.regex.test(text)) {
      return { role: p.role, confidence: p.confidence, threat: GOD_THREAT_LEVELS[p.role] || 50 }
    }
  }

  return { role: null, confidence: 0, threat: 0 }
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

function detectBaseLogicIssues(speeches: RoomPlayer['speechHistory']): {
  score: number
  summary: string
  toneIntensity: number
  attackedPowerRole: boolean
  unjustifiedAttackOnGod: boolean
} {
  let score = 0
  let attackedPowerRole = false
  let unjustified = false
  let contradictions = 0
  let lackPerspective = 0
  let fallacySigns = 0
  let bandwagon = 0
  let emotional = 0

  const recent = speeches.slice(-4)
  const contents = recent.map(s => s.content)
  const claims = parseClaims(speeches)

  for (const c of contents) {
    const lc = c.toLowerCase()
    const mentionsPR = /(预言家|女巫|守卫|猎人)/.test(c)
    const attackPR = mentionsPR && /(攻击|踩|出|毒|杀|打飞|挂票|悍跳|不信)/.test(c)
    if (attackPR) {
      attackedPowerRole = true
      score += 30
    }
    const attackSeerIntent = /(查杀|铁狼|悍跳|不信).*预言家|出.*预言家|推.*预言家/.test(c)
    if (attackSeerIntent && claims.role !== 'Seer' && !/(不是|不要|不建议)/.test(c)) {
      unjustified = true
    }
    const hasContradict = /(前面|之前).*?(保|相信).*(现在).*?(踩|怀疑)/.test(c) || /(我是好人).*(但是|不过).*(像狼)/.test(c)
    if (hasContradict) {
      contradictions++
      score += 20
    }
    const onlyOneTrack = /(就出|一定是|毫无疑问)/.test(c) && /(另一种|如果不是|或者)/.test(c) === false
    if (onlyOneTrack) {
      lackPerspective++
      score += 15
    }
    const fallacy = /(因为.*所以.*)|([\u4e00-\u9fa5]{1,}跟他.*所以他是狼)/.test(c)
    if (fallacy) {
      fallacySigns++
      score += 10
    }
    const followWater = /(同上|我也觉得|跟前面|随大流|我过)/.test(c)
    if (followWater) {
      bandwagon++
      score += 10
    }
    // 细粒度情绪/场外加权
    let toxicScore = 0
    for (const [word, weight] of Object.entries(TOXIC_WEIGHTS)) {
      if (c.includes(word)) toxicScore += weight
    }
    if (toxicScore > 0) {
      emotional++
      // 将毒性分数部分计入基础分
      score += Math.min(30, Math.floor(toxicScore / 4))
    }
  }

  const toneIntensity = Math.min(10, Math.max(emotional * 2, Math.floor((contents.length > 0 ? contents.reduce((acc, c) => acc + Object.entries(TOXIC_WEIGHTS).reduce((s, [w, wt]) => s + (c.includes(w) ? wt : 0), 0), 0) : 0) / 40)))
  const summary = `矛盾:${contradictions} 视角缺失:${lackPerspective} 伪逻辑:${fallacySigns} 跟风:${bandwagon} 情绪:${emotional} 攻击神职:${attackedPowerRole ? 1 : 0} 无证据攻神:${unjustified ? 1 : 0}`
  return { score, summary, toneIntensity, attackedPowerRole, unjustifiedAttackOnGod: unjustified }
}

export function computeSuspicionUpdates(
  me: RoomPlayer,
  room: RoomState,
  weights: PersonaWeights,
  baseSuspicion: Record<string, number>
): SuspicionUpdate[] {
  const updates: SuspicionUpdate[] = []
  const aliveOthers = room.players.filter(p => p.is_alive && p.id !== me.id)

  for (const target of aliveOthers) {
    const base = baseSuspicion[target.id] ?? 50
    const logic = detectBaseLogicIssues(target.speechHistory || [])

    let change = logic.score
    let logicWeighted = change * weights.W_logic
    let toneWeighted = logic.toneIntensity * weights.W_tone
    let selfWeighted = 0

    const targetedMe = (target.speechHistory || []).slice(-6).some(s => s.content.includes(`${me.position}号`) || s.content.includes(me.name))
    if (targetedMe) {
      selfWeighted = 30 * weights.W_self
    }

    let totalDelta = logicWeighted + toneWeighted + selfWeighted

    if (weights.special === 'peacemaker_dilute') {
      totalDelta = totalDelta * 0.5
    }
    if (weights.special === 'rookie_chaos') {
      const rand = (Math.floor(Math.random() * 61) - 30)
      totalDelta += rand
    }
    if (weights.special === 'tunnel_lock' && base > 70) {
      totalDelta += 20
    }

    const sticked = base * weights.W_stick
    let newScore = clamp(sticked + totalDelta)
    let reasonMsg: string | undefined

    // 阵营分支：狼人使用“威胁/扛推优先级”
    const isWolf = (me.role === 'werewolf')
    if (isWolf) {
      const isTeammate = (target.role === 'werewolf')
      const claim = parseClaims(target.speechHistory || [])
      const isDoubleAgent = weights.special === 'double_agent'
      if (isDoubleAgent) {
        if (isTeammate) {
          newScore = clamp(logic.score * 1.5 + 40)
          reasonMsg = `[倒钩] 队友聊爆加权踩：score=${logic.score}`
        } else if (claim.role && claim.confidence > 0.5) {
          newScore = 0
          reasonMsg = `[倒钩] 发现神职(${claim.role})，暂认保护以混入好人`
        } else {
          newScore = clamp(newScore * 0.8)
          reasonMsg = '[倒钩] 轻踩好人维持低调'
        }
      } else {
        if (isTeammate) {
          newScore = 0
          reasonMsg = '同阵营，避免攻击'
        } else if (claim.role && claim.confidence > 0.5) {
          newScore = Math.max(newScore, Math.min(100, Math.floor(claim.threat * claim.confidence)))
          reasonMsg = `锁定高威胁目标: ${claim.role} (置信度 ${claim.confidence})`
        } else {
          reasonMsg = '逻辑/语气作为扛推优先级（非好人怀疑）'
        }
      }
    }

    if (logic.unjustifiedAttackOnGod && !isWolf) {
      newScore = Math.max(80, newScore)
    }

    const reason: SuspicionUpdateReason = {
      logic_analysis: logic.summary,
      persona_reaction: typeof reasonMsg !== 'undefined' ? reasonMsg : (targetedMe ? '对我有攻击，触发防御权重' : '未针对我，基于逻辑与语气评估'),
      base_score_change: logic.score,
      weight_factor: Number((weights.W_logic + weights.W_tone + weights.W_self).toFixed(2)),
      final_score_change: Number((newScore - base).toFixed(2))
    }

    updates.push({
      player_id: target.id,
      target_position: target.position,
      new_suspicion: newScore,
      reason
    })
  }

  return updates.sort((a, b) => b.new_suspicion - a.new_suspicion)
}
