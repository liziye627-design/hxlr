import { useState } from 'react';
import { Sword, Eye, Droplet, Shield, Heart, Skull } from 'lucide-react';
import type { WerewolfPlayer } from '../../types';
import { Button } from '../ui/button';
import { PlayerGrid } from './PlayerGrid';

interface NightActionPanelProps {
  myRole: string;
  players: WerewolfPlayer[];
  myId: string;
  nightHintTargetId?: string;
  nightHintTargetName?: string;
  nightHintTargetRole?: string;
  nightHintTargetPosition?: number;
  onActionSubmit: (actionType: string, targetId: string | null) => void;
}

const ROLE_ACTIONS: Record<
  string,
  {
    icon: any;
    label: string;
    actionType: string;
    description: string;
    canTargetSelf: boolean;
  }
> = {
  werewolf: {
    icon: Sword,
    label: '选择击杀目标',
    actionType: 'kill',
    description: '选择一名玩家在夜晚击杀',
    canTargetSelf: false,
  },
  seer: {
    icon: Eye,
    label: '选择查验目标',
    actionType: 'check',
    description: '选择一名玩家查验其身份',
    canTargetSelf: false,
  },
  witch: {
    icon: Droplet,
    label: '使用解药或毒药',
    actionType: 'save', // or 'poison'
    description: '选择保存或毒杀',
    canTargetSelf: true,
  },
  guard: {
    icon: Shield,
    label: '选择保护目标',
    actionType: 'protect',
    description: '选择一名玩家保护',
    canTargetSelf: false,
  },
};

export const NightActionPanel = ({
  myRole,
  players,
  myId,
  nightHintTargetId,
  nightHintTargetName,
  nightHintTargetRole,
  nightHintTargetPosition,
  onActionSubmit,
}: NightActionPanelProps) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [witchAction, setWitchAction] = useState<'save' | 'poison' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const roleAction = ROLE_ACTIONS[myRole];

  if (!roleAction) {
    // Villager or unknown role - no night action
    return (
      <div className="p-8 text-center">
        <div className="text-slate-400 text-lg">您的角色在夜晚没有特殊行动</div>
        <div className="text-slate-500 mt-2">请等待其他玩家完成行动...</div>
      </div>
    );
  }

  const handleSubmit = () => {
    let actionType = roleAction.actionType;

    // Witch special handling
    if (myRole === 'witch' && witchAction) {
      // 使用解药时，默认目标为 nightHintTargetId
      if (witchAction === 'save' && nightHintTargetId) {
        setSelectedTarget(nightHintTargetId);
      }
      actionType = witchAction;
    }

    onActionSubmit(actionType, selectedTarget);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center">
        <div className="text-green-400 text-lg font-semibold">✓ 行动已提交</div>
        <div className="text-slate-500 mt-2">等待其他玩家...</div>
      </div>
    );
  }

  const Icon = roleAction.icon;
  // 目标选择：女巫使用解药时仅可选择被刀目标；毒药可选择任意存活（可含自保策略）
  const eligiblePlayers = (() => {
    const base = players.filter((p) => p.is_alive && (roleAction.canTargetSelf || p.id !== myId));
    if (myRole === 'witch' && witchAction === 'save' && nightHintTargetId) {
      return base.filter(p => p.id === nightHintTargetId);
    }
    return base;
  })();

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 rounded-lg border border-indigo-700">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-full">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{roleAction.label}</div>
            <div className="text-sm text-slate-300">{roleAction.description}</div>
          </div>
        </div>
      </div>

      {/* Witch Special Controls */}
      {myRole === 'witch' && (
        <div className="flex gap-4">
          <Button
            onClick={() => setWitchAction('save')}
            className={`flex-1 ${witchAction === 'save' ? 'bg-green-600' : 'bg-slate-700'}`}
          >
            <Heart className="w-4 h-4 mr-2" />
            使用解药
          </Button>
          <Button
            onClick={() => setWitchAction('poison')}
            className={`flex-1 ${witchAction === 'poison' ? 'bg-red-600' : 'bg-slate-700'}`}
          >
            <Skull className="w-4 h-4 mr-2" />
            使用毒药
          </Button>
        </div>
      )}

      {/* Night hint for Witch */}
      {myRole === 'witch' && nightHintTargetId && (
        <div className="text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-700 rounded p-2">
          今晚被击杀的目标：{(nightHintTargetPosition ?? players.find(p => p.id === nightHintTargetId)?.position) || 0}号（{nightHintTargetName || players.find(p => p.id === nightHintTargetId)?.name}，{nightHintTargetRole || '未知身份'}），选择“使用解药”将默认救他
        </div>
      )}

      {/* Player Selection */}
      <div>
        <div className="text-sm text-slate-400 mb-3">选择目标玩家:</div>
        <PlayerGrid
          players={eligiblePlayers}
          onPlayerClick={(player) => setSelectedTarget(player.id)}
          selectedPlayerId={selectedTarget}
          currentPlayerId={myId}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={(myRole !== 'witch' && !selectedTarget) || (myRole === 'witch' && !witchAction)}
          className="px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认行动
        </Button>
      </div>
    </div>
  );
};
