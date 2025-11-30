import { User, Bot, Skull, Star } from 'lucide-react';
import type { WerewolfPlayer } from '../../types';
import { cn } from '../../lib/utils';

interface PlayerGridProps {
  players: WerewolfPlayer[];
  onPlayerClick?: (player: WerewolfPlayer) => void;
  selectedPlayerId?: string | null;
  currentPlayerId?: string;
  currentPlayerRole?: string;
  showRoles?: boolean;
  sheriffId?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  werewolf: 'border-red-500 bg-red-500/10',
  villager: 'border-green-500 bg-green-500/10',
  seer: 'border-blue-500 bg-blue-500/10',
  witch: 'border-purple-500 bg-purple-500/10',
  hunter: 'border-orange-500 bg-orange-500/10',
  guard: 'border-cyan-500 bg-cyan-500/10',
};

const ROLE_NAMES: Record<string, string> = {
  werewolf: '狼人',
  villager: '村民',
  seer: '预言家',
  witch: '女巫',
  hunter: '猎人',
  guard: '守卫',
};

export const PlayerGrid = ({
  players,
  onPlayerClick,
  selectedPlayerId,
  currentPlayerId,
  currentPlayerRole,
  showRoles = false,
  sheriffId,
}: PlayerGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6">
      {players.map((player) => {
        const isAlive = player.is_alive;
        const isSelected = selectedPlayerId === player.id;
        const isCurrent = currentPlayerId === player.id;
        const isClickable = onPlayerClick && isAlive;

        // Werewolf teammate detection
        const isWerewolfTeammate = currentPlayerRole === 'werewolf' &&
          player.role === 'werewolf' &&
          player.id !== currentPlayerId &&
          isAlive;

        return (
          <div
            key={player.id}
            onClick={() => isClickable && onPlayerClick(player)}
            className={cn(
              'relative p-3 md:p-4 rounded-xl border-2 transition-all duration-300',
              'flex flex-col items-center gap-2 md:gap-3',
              // Mobile touch-friendly: minimum 44px height
              'min-h-[176px] md:min-h-0',
              isAlive ? 'opacity-100' : 'opacity-40 grayscale',
              isClickable && 'cursor-pointer active:scale-95 md:hover:scale-105 md:hover:shadow-lg',
              isSelected && 'ring-4 ring-blue-500 scale-105',
              isCurrent && 'border-yellow-400',
              player.role && showRoles
                ? ROLE_COLORS[player.role]
                : 'border-slate-600 bg-slate-800/50',
            )}
          >
            {/* Sheriff Badge */}
            {sheriffId === player.id && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-yellow-500 text-white p-1 rounded-full shadow-lg border-2 border-yellow-300">
                  <Star className="w-4 h-4 fill-yellow-200" />
                </div>
              </div>
            )}

            {/* Position Badge */}
            <div className="absolute -top-2 -left-2 bg-slate-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {player.position}
            </div>

            {/* Online Indicator */}
            {player.isOnline !== undefined && (
              <div
                className={cn(
                  'absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white',
                  player.isOnline ? 'bg-green-500' : 'bg-gray-500',
                )}
              />
            )}

            {/* Werewolf Teammate Marker */}
            {isWerewolfTeammate && (
              <div className="absolute -top-2 -left-2 z-10 animate-pulse">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400">
                  <span className="text-white text-xs">🐺</span>
                </div>
              </div>
            )}

            {/* Avatar */}
            <div className="relative mb-3">
              <div
                className={cn(
                  'w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-slate-700 to-slate-800',
                  !isAlive && 'bg-gray-600',
                )}
              >
                {player.type === 'user' ? (
                  <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                ) : (
                  <Bot className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
                )}
              </div>

              {/* Death Indicator */}
              {!isAlive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skull className="w-10 h-10 md:w-12 md:h-12 text-red-500" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="text-center">
              <div className="font-semibold text-white">{player.name}</div>
              {showRoles && player.role && (
                <div className="text-sm text-slate-300 mt-1">
                  {ROLE_NAMES[player.role] || player.role}
                </div>
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex gap-2 text-xs">
              {player.hasActedNight && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">已行动</span>
              )}
              {player.hasVoted && (
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">已投票</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
