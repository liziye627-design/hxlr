import type { RoomState, AgentKnowledgeType } from './types.js'

export interface AgentKnowledgeEntry {
  round: number
  phase: string
  type: AgentKnowledgeType
  targetId?: string
  targetName?: string
  result?: string
  text?: string
}

export interface AgentKnowledge {
  log: AgentKnowledgeEntry[]
}

export function ensureAgentKnowledge(room: RoomState, agentId: string): AgentKnowledge {
  if (!room.agentKnowledge) room.agentKnowledge = {}
  if (!room.agentKnowledge[agentId]) room.agentKnowledge[agentId] = { log: [] }
  return room.agentKnowledge[agentId]
}

export function pushKnowledge(room: RoomState, agentId: string, entry: AgentKnowledgeEntry) {
  const ak = ensureAgentKnowledge(room, agentId)
  ak.log.push(entry)
  // 仅保留最近 50 条
  if (ak.log.length > 50) ak.log.splice(0, ak.log.length - 50)
}

