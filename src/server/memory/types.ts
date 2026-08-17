export type MemoryType = 'PUBLIC_SPEECH' | 'ACTION' | 'PRIVATE_THOUGHT'

export type MemoryTag =
  | 'CLAIM_GOD'
  | 'ATTACK_ME'
  | 'LOGIC_FLAW'
  | 'DEFENSE'
  | 'HIGH_THREAT'

export interface MemoryFragment {
  id: string
  round: number
  timestamp: number

  source_id: number
  target_id?: number

  type: MemoryType
  content: string

  tags: MemoryTag[]
  importance_score: number
}

