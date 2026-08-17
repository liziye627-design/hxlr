import type { AIPersona } from '../AIPersonaSystem'
import type { MemoryFragment, MemoryTag } from './types'

function generateUUID(): string {
  try {
    // @ts-ignore
    return (globalThis.crypto?.randomUUID?.() as string) || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export class AgentKnowledgeBase {
  private memories: MemoryFragment[] = []
  private currentRound: number = 1

  setCurrentRound(round: number) {
    this.currentRound = round
  }

  addPublicMemory(round: number, speakerPosition: number, speech: string, targetPosition?: number) {
    const tags: MemoryTag[] = []

    const lc = speech.toLowerCase()

    if (/预言家|女巫|守卫|猎人|神职|强神/.test(speech) && /(查杀|出|毒|枪|验|银水|解药)/.test(speech)) {
      tags.push('CLAIM_GOD')
    }

    if (/前后矛盾|逻辑不通|强行|硬打|生推|视角不对|没逻辑|强辩|跟票/.test(speech)) {
      tags.push('LOGIC_FLAW')
    }

    if (/出他|打飞|挂票|推|毒|杀|踩|不信|质疑/.test(speech)) {
      if (typeof targetPosition === 'number') {
        tags.push('ATTACK_ME')
      }
    }

    const fragment: MemoryFragment = {
      id: generateUUID(),
      round,
      timestamp: Date.now(),
      source_id: speakerPosition,
      target_id: typeof targetPosition === 'number' ? targetPosition : undefined,
      type: 'PUBLIC_SPEECH',
      content: speech,
      tags,
      importance_score: 50,
    }

    this.memories.push(fragment)
  }

  addPrivateThought(round: number, myPosition: number, thought: string) {
    const fragment: MemoryFragment = {
      id: generateUUID(),
      round,
      timestamp: Date.now(),
      source_id: myPosition,
      type: 'PRIVATE_THOUGHT',
      content: thought,
      tags: [],
      importance_score: 10,
    }
    this.memories.push(fragment)
  }

  retrieveContext(myPersona: AIPersona, myPosition: number): string {
    let relevantMemories = this.memories.filter(m => m.round >= Math.max(1, this.currentRound - 3))

    const selfDefenseW = (myPersona?.weights as any)?.W_self ?? 1.0
    const logicW = (myPersona?.weights as any)?.W_logic ?? 1.0

    if (selfDefenseW > 2.0) {
      relevantMemories = relevantMemories.map(m => {
        if (m.tags.includes('ATTACK_ME') && m.target_id === myPosition) {
          m.importance_score += 50
        }
        return m
      })
    }

    if (logicW > 2.0) {
      relevantMemories = relevantMemories.map(m => {
        if (m.tags.includes('CLAIM_GOD') || m.tags.includes('LOGIC_FLAW')) {
          m.importance_score += 30
        }
        return m
      })
    }

    const topMemories = relevantMemories
      .sort((a, b) => b.importance_score - a.importance_score)
      .slice(0, 10)

    return topMemories
      .map(m => {
        if (m.type === 'PRIVATE_THOUGHT') {
          return `[回想]: 上一轮我心里想 "${m.content}"`
        }
        return `[记忆-第${m.round}轮] ${m.source_id}号说: "${m.content}" (标记: ${m.tags.join(',')})`
      })
      .join('\n')
  }
}

const KB_REGISTRY = new Map<string, AgentKnowledgeBase>()

export function getAgentKnowledgeBase(roomId: string): AgentKnowledgeBase {
  let kb = KB_REGISTRY.get(roomId)
  if (!kb) {
    kb = new AgentKnowledgeBase()
    KB_REGISTRY.set(roomId, kb)
  }
  return kb
}

export function updateKnowledgeRound(roomId: string, round: number) {
  const kb = getAgentKnowledgeBase(roomId)
  kb.setCurrentRound(round)
}

