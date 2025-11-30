import { Clock, Moon, Sun, Vote, Trophy } from 'lucide-react';
import type { GamePhase } from '../../types';

interface PhaseIndicatorProps {
  phase: GamePhase | 'DAY_MORNING_RESULT' | 'DAY_DEATH_LAST_WORDS';
  timer: number;
  currentRound: number;
  orderIndex?: number | null;
  orderTotal?: number | null;
  currentSpeakerName?: string | null;
}

const PHASE_CONFIG: Record<GamePhase | 'DAY_MORNING_RESULT' | 'DAY_DEATH_LAST_WORDS', { icon: any; label: string; color: string }> = {
  WAITING: { icon: Clock, label: '等待中', color: 'bg-gray-500' },
  NIGHT: { icon: Moon, label: '夜晚', color: 'bg-indigo-600' },
  DAY_RESULT: { icon: Sun, label: '天亮了', color: 'bg-amber-500' },
  DAY_MORNING_RESULT: { icon: Sun, label: '天亮了', color: 'bg-amber-500' },
  DAY_DISCUSS: { icon: Sun, label: '白天讨论', color: 'bg-yellow-500' },
  DAY_VOTE: { icon: Vote, label: '投票阶段', color: 'bg-red-500' },
  DAY_DEATH_LAST_WORDS: { icon: Sun, label: '遗言阶段', color: 'bg-orange-600' },
  HUNTER_SHOOT: { icon: Vote, label: '猎人开枪', color: 'bg-orange-600' },
  BADGE_TRANSFER: { icon: Trophy, label: '移交警徽', color: 'bg-blue-600' },
  GAME_OVER: { icon: Trophy, label: '游戏结束', color: 'bg-purple-600' },
};

export const PhaseIndicator = ({ phase, timer, currentRound, orderIndex, orderTotal, currentSpeakerName }: PhaseIndicatorProps) => {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-lg shadow-xl border border-slate-700">
      {/* Phase Info */}
      <div className="flex items-center gap-4">
        <div className={`${config.color} p-3 rounded-full shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{config.label}</div>
          <div className="text-sm text-slate-400">第 {currentRound} 回合{(phase === 'DAY_DISCUSS' || phase === 'DAY_DEATH_LAST_WORDS') && orderTotal ? ` · 发言 ${orderIndex ?? '-'} / ${orderTotal}` : ''}</div>
          {(phase === 'DAY_DISCUSS' || phase === 'DAY_DEATH_LAST_WORDS') && currentSpeakerName && (
            <div className="text-xs text-slate-400">当前发言：{currentSpeakerName}</div>
          )}
        </div>
      </div>

      {/* Timer */}
      {timer > 0 && (
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-400" />
          <div className="text-3xl font-mono font-bold text-white">{formatTime(timer)}</div>
        </div>
      )}
    </div>
  );
};
