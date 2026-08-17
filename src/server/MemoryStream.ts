export interface GameEvent {
  round: number
  speaker: number
  action: 'SPEECH' | 'VOTE' | 'DIE' | 'USE_SKILL'
  summary: string
}

class MemoryStream {
  private publicLog: GameEvent[] = []
  private agentPrivateLogs: Map<string, string[]> = new Map()

  addEvent(event: GameEvent) {
    this.publicLog.push(event)
    if (this.publicLog.length > 200) this.publicLog.splice(0, this.publicLog.length - 200)
  }

  updateAgentMemory(agentId: string, thought: string) {
    const logs = this.agentPrivateLogs.get(agentId) || []
    logs.push(thought)
    if (logs.length > 3) logs.shift()
    this.agentPrivateLogs.set(agentId, logs)
  }

  generateContextPrompt(agentId: string): string {
    const publicHistory = this.publicLog
      .slice(-20)
      .map(e => `[第${e.round}轮] ${e.speaker}号: ${e.summary}`)
      .join('\n')
    const myMemory = (this.agentPrivateLogs.get(agentId) || []).join('\n') || '无'
    return `=== 历史回顾 ===\n${publicHistory}\n\n=== 你之前的想法 ===\n${myMemory}`
  }
}

const registry = new Map<string, MemoryStream>()

export function getMemoryStream(roomId: string): MemoryStream {
  if (!registry.has(roomId)) registry.set(roomId, new MemoryStream())
  return registry.get(roomId)!
}

