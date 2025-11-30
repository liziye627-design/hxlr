import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Shield, Crown, Mic, Bot } from 'lucide-react';
import type { WerewolfPlayer } from '../../types';
import { SpeechBubble } from './SpeechBubble';
import { SeerCheckCard } from './SeerCheckCard';
import { SpeechWave } from './SpeechWave';

// ========================================
// 📌 配置：Single Source of Truth
// ========================================
const ROLE_CONFIG = {
  werewolf: {
    color: 'bg-red-500',
    label: '狼人',
    borderColor: 'border-red-500',
  },
  villager: {
    color: 'bg-green-500',
    label: '村民',
    borderColor: 'border-green-500',
  },
  seer: {
    color: 'bg-blue-500',
    label: '预言家',
    borderColor: 'border-blue-500',
  },
  witch: {
    color: 'bg-purple-500',
    label: '女巫',
    borderColor: 'border-purple-500',
  },
  hunter: {
    color: 'bg-orange-500',
    label: '猎人',
    borderColor: 'border-orange-500',
  },
  guard: {
    color: 'bg-cyan-500',
    label: '守卫',
    borderColor: 'border-cyan-500',
  },
} as const;

const getRoleConfig = (role?: string) => {
  if (!role || !(role in ROLE_CONFIG)) {
    return { color: 'bg-gray-500', label: '未知', borderColor: 'border-gray-500' };
  }
  return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
};

interface RoundTableViewProps {
  players: WerewolfPlayer[];
  sheriffId?: string | null;
  currentPlayerId?: string;
  currentPlayerRole?: string;
  activeSpeakerId?: string | null;
  ttsSpeakingPlayerId?: string | null;
  recordingPlayerId?: string | null;
  speakerRemainingSeconds?: number | null;
  aiThinkingIds?: Set<string>;
  nextSpeakerId?: string | null;
  activeSpeeches?: Map<string, { playerId: string; playerName: string; content: string }>;
  onPlayerClick?: (player: WerewolfPlayer) => void;
  showRoles?: boolean;
  seerCheckHistory?: Array<{ targetId: string; targetName: string; isWerewolf: boolean; round: number }>;
}

interface SeatPosition {
  playerId: string;
  position: number;
  angle: number;
  x: number;
  y: number;
}

export const RoundTableView = ({
  players,
  sheriffId,
  currentPlayerId,
  currentPlayerRole,
  activeSpeakerId,
  ttsSpeakingPlayerId,
  recordingPlayerId,
  speakerRemainingSeconds,
  aiThinkingIds,
  nextSpeakerId,
  activeSpeeches,
  onPlayerClick,
  showRoles = false,
  seerCheckHistory = [],
}: RoundTableViewProps) => {
  const seatPositions = useMemo(() => {
    const centerX = 50;
    const centerY = 50;
    const radius = 35;
    const startAngle = -90;

    return players.map((player, index) => {
      const angle = startAngle + (360 / players.length) * index;
      const radian = (angle * Math.PI) / 180;

      return {
        playerId: player.id,
        position: player.position,
        angle,
        x: centerX + radius * Math.cos(radian),
        y: centerY + radius * Math.sin(radian),
      } as SeatPosition;
    });
  }, [players]);

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* 圆桌背景 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-amber-900/30 to-amber-950/30 border-4 border-amber-800/50 shadow-2xl" />
      </div>

      {/* 玩家座位 */}
      {seatPositions.map((seat) => {
        const player = players.find((p) => p.id === seat.playerId);
        if (!player) return null;

        const isCurrentPlayer = player.id === currentPlayerId;
        const isSheriff = player.id === sheriffId;
        const isTurnActive = player.id === activeSpeakerId;
        const isSpeakingNow = player.id === ttsSpeakingPlayerId || player.id === recordingPlayerId;
        const isThinkingBackend = aiThinkingIds?.has(player.id);
        const isThinking = player.id === activeSpeakerId ? false : !!isThinkingBackend;
        const isAlive = player.is_alive;
        const isClickable = onPlayerClick && isAlive;

        const isWerewolfTeammate = currentPlayerRole === 'werewolf' &&
          player.role === 'werewolf' &&
          player.id !== currentPlayerId &&
          isAlive;

        const seerCheck = seerCheckHistory.find(check => check.targetId === player.id);

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              zIndex: isSpeakingNow ? 50 : 10,
            }}
          >
            <div
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-lg
                ${isSpeakingNow ? 'scale-110' : ''}
                ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                transition-transform duration-300
              `}
              onClick={() => isClickable && onPlayerClick(player)}
            >
              {/* 座位号 */}
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xs font-bold text-white z-10">
                {player.position}
              </div>

              {/* 警徽标识 */}
              {isSheriff && (
                <div className="absolute -top-2 -right-2 z-20">
                  <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                </div>
              )}

              {/* 狼人队友标识 */}
              {isWerewolfTeammate && (
                <div className="absolute -top-2 -left-2 z-10 animate-pulse">
                  <div className="relative">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400">
                      <span className="text-white text-xs">🐺</span>
                    </div>
                    <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping" />
                  </div>
                </div>
              )}

              {/* 预言家查验卡片 */}
              {seerCheck && (
                <SeerCheckCard
                  playerName={player.name}
                  playerPosition={player.position}
                  isWerewolf={seerCheck.isWerewolf}
                  round={seerCheck.round}
                  className="-top-4 -right-4"
                />
              )}

              {/* 头像 */}
              <div
                className={`
                  relative rounded-full p-1
                  ${isSpeakingNow ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-yellow-500/40' : ''}
                  ${isCurrentPlayer ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}
                  ${!isAlive ? 'grayscale opacity-50' : ''}
                  transition-all duration-300
                `}
              >
                <Avatar className="w-16 h-16 border-2 border-slate-600">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
                  />
                  <AvatarFallback className="bg-slate-700 text-white">
                    {player.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                {/* 发言指示（随TTS位置移动），有人类倒计时则显示秒数 */}
                {isSpeakingNow && isAlive && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-black px-1.5 py-0.5 rounded-full flex items-center gap-1 z-30 animate-bounce">
                    <Mic className="w-3 h-3" />
                    {typeof speakerRemainingSeconds === 'number' && speakerRemainingSeconds > 0 ? (
                      <span>{speakerRemainingSeconds}s</span>
                    ) : null}
                  </div>
                )}

                {/* 情绪光环 */}
                {isSpeakingNow && isAlive && (
                  <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
                )}
              </div>

              {/* 玩家信息 */}
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div
                  className={`
                    text-sm font-semibold text-center truncate max-w-[80px]
                    ${isCurrentPlayer ? 'text-blue-400' : 'text-white'}
                    ${!isAlive ? 'line-through opacity-50' : ''}
                  `}
                >
                  {player.name}
                </div>

                {/* AI 思考中 */}
                {isThinking && (
                  <div className="flex items-center gap-1 text-xs text-indigo-300 animate-pulse">
                    <Bot className="w-3 h-3" />
                    <span>思考中...</span>
                  </div>
                )}

                {/* Speech Wave */}
                {isSpeakingNow && isAlive && (
                  <SpeechWave isSpeaking={true} className="mt-1" />
                )}

                {/* 角色显示 */}
                {showRoles && player.role && (
                  <Badge className={`${getRoleConfig(player.role).color} text-white text-xs py-0`}>
                    {getRoleConfig(player.role).label}
                  </Badge>
                )}

                {/* AI 标识 */}
                {player.type === 'ai' && !isThinking && player.persona && (
                  <div className="flex gap-1 flex-wrap justify-center">
                    <Badge
                      variant="outline"
                      className="text-xs py-0 border-purple-400 text-purple-300"
                    >
                      AI
                    </Badge>
                  </div>
                )}

                {/* 状态标识 */}
                {!isAlive && (
                  <Badge variant="destructive" className="text-xs py-0">
                    已出局
                  </Badge>
                )}
              </div>

              {/* Speech Bubble */}
              {activeSpeeches?.has(player.id) && (
                <div className="relative z-40">
                  <SpeechBubble
                    content={activeSpeeches.get(player.id)!.content}
                    playerName={player.name}
                    isVisible={true}
                    position={seat.y < 50 ? 'bottom' : 'top'}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 中央游戏信息 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-xs">狼人杀</div>
        </div>
      </div>
    </div>
  );
};
