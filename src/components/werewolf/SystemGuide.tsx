import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Lightbulb, Mic, Vote, Moon, Sun, Shield, Bot, Timer } from 'lucide-react'

type Props = {
  roomState: any
  currentPlayerId: string
  canSpeak: boolean
  speakerRemainingSeconds?: number | null
}

function buildGuides(rs: any, currentPlayerId: string, canSpeak: boolean, remain: number | null): string[] {
  const phase = rs?.phase
  const role = rs?.myRole
  const round = rs?.currentRound || 1
  const isHost = rs?.players?.find((p: any) => p.id === currentPlayerId)?.position === 1
  const isSpeaking = canSpeak
  const remainText = typeof remain === 'number' ? `${Math.max(0, remain)}s` : ''

  if (phase === 'WAITING') {
    const tips = [
      '等待玩家加入，创建房间后可点击 AI补位 迅速开局',
      '房主可开始游戏，建议满员或补位后再开始',
    ]
    if (isHost) tips.push('作为房主，你可暂停/恢复或强制跳过当前发言')
    return tips
  }
  if (phase === 'NIGHT') {
    const tips = [
      '夜间行动阶段，请根据你的身份使用技能',
    ]
    if (role === 'werewolf') tips.push('狼人：团队协调击杀目标，优先神职或高威胁位')
    if (role === 'seer') tips.push('预言家：查验高嫌疑位，提高白天说服力')
    if (role === 'witch') tips.push('女巫：若有人被击杀且有解药，优先考虑救；毒药留给高嫌疑位')
    if (role === 'guard') tips.push('守卫：保护低嫌疑或可能跳神位，避免重叠守护')
    return tips
  }
  if (phase === 'DAY_MORNING_RESULT') {
    return [
      '公布昨夜结果，请注意死亡原因与技能触发条件',
      '被毒不可开枪；有警徽请考虑合理移交',
    ]
  }
  if (phase === 'DAY_DISCUSS') {
    const tips = [
      '讨论阶段，按发言顺序依次发言，避免场外',
      '引用上一轮关键事件，明确投票倾向与逻辑链',
    ]
    if (isSpeaking) tips.push(`当前轮到你发言，剩余 ${remainText}`)
    return tips
  }
  if (phase === 'DAY_VOTE') {
    return [
      '投票阶段：点击左侧头像进行投票',
      '先陈述投票理由，避免跟票；若不确定，可保留弃票策略',
    ]
  }
  if (phase === 'DAY_DEATH_LAST_WORDS') {
    return [
      '遗言阶段：请简洁总结你的视角与站位',
      '建议给出警徽/投票建议，提高团队信息利用率',
    ]
  }
  if (phase === 'SHERIFF_ELECTION_DISCUSS') {
    return [
      '警长竞选：候选人轮流发言，阐述执警思路',
      '建议给出白天队形与徽章流，提升协同效率',
    ]
  }
  if (phase === 'SHERIFF_ELECTION_VOTE') {
    return [
      '警长投票：请理性选择，优先逻辑稳定与带队能力强者',
    ]
  }
  if (phase === 'HUNTER_SHOOT') {
    return [
      '猎人开枪：若条件触发，选择是否开枪及目标',
      '避免误伤好人；优先高嫌疑且影响面大的目标',
    ]
  }
  return ['请等待系统流程推进']
}

export function SystemGuide({ roomState, currentPlayerId, canSpeak, speakerRemainingSeconds }: Props) {
  const tips = buildGuides(roomState, currentPlayerId, canSpeak, speakerRemainingSeconds ?? null)

  return (
    <Card className="bg-slate-800/80 border-slate-700">
      <CardHeader className="py-3 border-b border-slate-700 bg-slate-900/50">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          系统提示
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {tips.map((t, i) => (
            <Alert key={i} className="bg-blue-900/20 border-blue-500/30">
              <AlertDescription className="text-blue-200 text-xs">{t}</AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default SystemGuide

