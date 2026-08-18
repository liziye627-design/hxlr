import { useMemo, useRef, useEffect, useState } from 'react';
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
    ringColor: 'ring-red-500/50',
  },
  villager: {
    color: 'bg-green-500',
    label: '村民',
    borderColor: 'border-green-500',
    ringColor: 'ring-green-500/50',
  },
  seer: {
    color: 'bg-blue-500',
    label: '预言家',
    borderColor: 'border-blue-500',
    ringColor: 'ring-blue-500/50',
  },
  witch: {
    color: 'bg-purple-500',
    label: '女巫',
    borderColor: 'border-purple-500',
    ringColor: 'ring-purple-500/50',
  },
  hunter: {
    color: 'bg-orange-500',
    label: '猎人',
    borderColor: 'border-orange-500',
    ringColor: 'ring-orange-500/50',
  },
  guard: {
    color: 'bg-cyan-500',
    label: '守卫',
    borderColor: 'border-cyan-500',
    ringColor: 'ring-cyan-500/50',
  },
} as const;

const getRoleConfig = (role?: string) => {
  if (!role || !(role in ROLE_CONFIG)) {
    return { color: 'bg-gray-500', label: '未知', borderColor: 'border-gray-500', ringColor: 'ring-gray-500/50' };
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
  // NEW: Energy Beam target (VTuber panel position)
  vtuberPanelRef?: React.RefObject<HTMLDivElement | null>;
}

interface SeatPosition {
  playerId: string;
  position: number;
  angle: number;
  x: number;
  y: number;
}

// ========================================
// 🎨 Dynamic Light Ring Component
// ========================================
const DynamicLightRing = ({ isActive, isAlive, isSpeaking }: { isActive: boolean; isAlive: boolean; isSpeaking: boolean }) => {
  if (!isAlive) {
    return (
      <div className="absolute inset-0 rounded-full">
        <div className="absolute inset-0 rounded-full border-2 border-gray-600/30" />
      </div>
    );
  }

  return (
    <div className="absolute inset-[-8px] rounded-full">
      {/* Base Glow Ring */}
      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isSpeaking
        ? 'bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 animate-spin-slow blur-md'
        : isActive
          ? 'bg-cyan-500/20 blur-sm animate-pulse'
          : 'bg-indigo-500/10'
        }`} />

      {/* Inner Ring */}
      <div className={`absolute inset-[4px] rounded-full border-2 transition-all duration-300 ${isSpeaking
        ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]'
        : isActive
          ? 'border-purple-400/70'
          : 'border-indigo-500/30'
        }`} />

      {/* Speaking Wave Pulses */}
      {isSpeaking && (
        <>
          <div className="absolute inset-[-12px] rounded-full border border-cyan-400/40 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-[-20px] rounded-full border border-purple-400/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
};

// ========================================
// 🌈 Energy Beam SVG Component
// ========================================
const EnergyBeam = ({
  startX,
  startY,
  endX,
  endY,
  isActive
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean
}) => {
  if (!isActive) return null;

  // Calculate control point for curved beam
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 50; // Curve upward

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
          <stop offset="50%" stopColor="rgba(34, 211, 238, 0.9)" />
          <stop offset="100%" stopColor="rgba(236, 72, 153, 0.8)" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow Background */}
      <path
        d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        fill="none"
        stroke="url(#beamGradient)"
        strokeWidth="6"
        filter="url(#glow)"
        opacity="0.5"
        className="animate-pulse"
      />

      {/* Main Beam */}
      <path
        d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        fill="none"
        stroke="url(#beamGradient)"
        strokeWidth="2"
        strokeDasharray="10,5"
        className="animate-dash"
      />

      {/* Traveling Particle */}
      <circle r="4" fill="cyan" filter="url(#glow)">
        <animateMotion
          dur="1.5s"
          repeatCount="indefinite"
          path={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        />
      </circle>
    </svg>
  );
};

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
  activeSpeeches,
  onPlayerClick,
  showRoles = false,
  seerCheckHistory = [],
  vtuberPanelRef,
}: RoundTableViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [beamCoords, setBeamCoords] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const seatPositions = useMemo(() => {
    const centerX = 50;
    const centerY = 50;
    const radius = 38;
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

  // Calculate Energy Beam coordinates when speaker changes
  useEffect(() => {
    if (!activeSpeakerId || !containerRef.current || !vtuberPanelRef?.current) {
      setBeamCoords(null);
      return;
    }

    const speakerSeat = seatPositions.find(s => s.playerId === activeSpeakerId);
    if (!speakerSeat) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const vtuberRect = vtuberPanelRef.current.getBoundingClientRect();

    // Convert seat percentage to pixel coordinates relative to container
    const startX = (speakerSeat.x / 100) * containerRect.width;
    const startY = (speakerSeat.y / 100) * containerRect.height;

    // Calculate end point (VTuber panel left edge, center height)
    const endX = vtuberRect.left - containerRect.left;
    const endY = (vtuberRect.top + vtuberRect.height / 2) - containerRect.top;

    setBeamCoords({ startX, startY, endX, endY });
  }, [activeSpeakerId, seatPositions, vtuberPanelRef]);

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-indigo-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent" />
        {/* Subtle Grid Lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* 圆桌背景 - Upgraded Cyber Style */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-purple-900/20 to-indigo-950/30 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15),inset_0_0_60px_rgba(139,92,246,0.1)]" />
        {/* Inner Ring */}
        <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
      </div>

      {/* Energy Beam */}
      {beamCoords && (
        <EnergyBeam
          startX={beamCoords.startX}
          startY={beamCoords.startY}
          endX={beamCoords.endX}
          endY={beamCoords.endY}
          isActive={!!activeSpeakerId}
        />
      )}

      {/* 玩家座位 */}
      {seatPositions.map((seat) => {
        const player = players.find((p) => p.id === seat.playerId);
        if (!player) return null;

        const isCurrentPlayer = player.id === currentPlayerId;
        const isSheriff = player.id === sheriffId;
        const isSpeakingNow = player.id === ttsSpeakingPlayerId || player.id === recordingPlayerId;
        const isActiveSpeaker = player.id === activeSpeakerId;
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
                relative flex flex-col items-center gap-1 p-2 rounded-xl
                ${isSpeakingNow ? 'scale-110' : ''}
                ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                transition-transform duration-300
              `}
              onClick={() => isClickable && onPlayerClick(player)}
            >
              {/* Dynamic Light Ring Base */}
              <div className="relative">
                <DynamicLightRing isActive={isActiveSpeaker} isAlive={isAlive} isSpeaking={isSpeakingNow} />

                {/* 座位号 */}
                <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-20 ${isSpeakingNow
                  ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                  : 'bg-slate-700/90 text-white border border-slate-500/50'
                  }`}>
                  {player.position}
                </div>

                {/* 警徽标识 */}
                {isSheriff && (
                  <div className="absolute -top-1 -right-1 z-20">
                    <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  </div>
                )}

                {/* 狼人队友标识 */}
                {isWerewolfTeammate && (
                  <div className="absolute -bottom-1 -right-1 z-20 animate-pulse">
                    <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-lg border border-red-400">
                      <span className="text-white text-[10px]">🐺</span>
                    </div>
                  </div>
                )}

                {/* 头像 */}
                <Avatar className={`w-14 h-14 border-2 transition-all duration-300 ${isSpeakingNow
                  ? 'border-cyan-400'
                  : isCurrentPlayer
                    ? 'border-blue-400'
                    : 'border-slate-600/50'
                  } ${!isAlive ? 'grayscale opacity-40' : ''}`}>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
                  />
                  <AvatarFallback className="bg-slate-700 text-white text-sm">
                    {player.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                {/* 发言指示 */}
                {isSpeakingNow && isAlive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-[10px] text-white px-2 py-0.5 rounded-full flex items-center gap-1 z-30 shadow-lg">
                    <Mic className="w-2.5 h-2.5" />
                    {typeof speakerRemainingSeconds === 'number' && speakerRemainingSeconds > 0 && (
                      <span>{speakerRemainingSeconds}s</span>
                    )}
                  </div>
                )}
              </div>

              {/* 玩家名称 */}
              <div className={`text-xs font-medium text-center truncate max-w-[70px] ${isCurrentPlayer ? 'text-blue-400' : 'text-white/90'
                } ${!isAlive ? 'line-through opacity-40' : ''}`}>
                {player.name}
              </div>

              {/* AI 思考中 */}
              {isThinking && (
                <div className="flex items-center gap-1 text-[10px] text-yellow-300 animate-pulse">
                  <Bot className="w-2.5 h-2.5" />
                  <span>思考中</span>
                </div>
              )}

              {/* Speech Wave */}
              {isSpeakingNow && isAlive && (
                <SpeechWave isSpeaking={true} className="mt-0.5" />
              )}

              {/* 角色显示 */}
              {showRoles && player.role && (
                <Badge className={`${getRoleConfig(player.role).color} text-white text-[10px] py-0 px-1.5`}>
                  {getRoleConfig(player.role).label}
                </Badge>
              )}

              {/* 预言家查验卡片 */}
              {seerCheck && (
                <SeerCheckCard
                  playerName={player.name}
                  playerPosition={player.position}
                  isWerewolf={seerCheck.isWerewolf}
                  round={seerCheck.round}
                  className="-top-2 -right-2"
                />
              )}

              {/* 状态标识 */}
              {!isAlive && (
                <Badge variant="destructive" className="text-[10px] py-0 opacity-70">
                  出局
                </Badge>
              )}

              {/* Speech Bubble */}
              {activeSpeeches?.has(player.id) && (
                <div className="absolute z-40" style={{
                  top: seat.y < 50 ? '100%' : 'auto',
                  bottom: seat.y >= 50 ? '100%' : 'auto',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}>
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
        <div className="text-center">
          <div className="relative">
            <Shield className="w-10 h-10 mx-auto text-purple-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-purple-500/10 rounded-full animate-ping" />
            </div>
          </div>
          <div className="text-[10px] text-purple-300/50 font-mono mt-1 uppercase tracking-widest">Game Active</div>
        </div>
      </div>
    </div>
  );
};
