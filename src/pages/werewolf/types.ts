export interface Room {
  id: string
  name: string
  currentPlayers: number
  maxPlayers: number
  status: 'WAITING' | 'PLAYING'
}

export interface SeerCheckResult {
  targetId: string
  targetName: string
  isWerewolf: boolean
  round: number
}

