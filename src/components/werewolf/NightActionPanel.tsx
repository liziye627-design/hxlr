import { useState } from 'react';
import { Sword, Eye, Droplet, Shield, Heart, Skull } from 'lucide-react';
import type { WerewolfPlayer } from '../../types';
import { Button } from '../ui/button';
import { PlayerGrid } from './PlayerGrid';
import { ActionConfirmDialog } from './ActionConfirmDialog'; // Import the new dialog

interface NightActionPanelProps {
  myRole: string;
  players: WerewolfPlayer[];
  myId: string;
  nightHintTargetId?: string;
  nightHintTargetName?: string;
  nightHintTargetRole?: string;
  nightHintTargetPosition?: number;
  onActionSubmit: (actionType: string, targetId: string | null) => void;
  compact?: boolean;
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
  compact = false,
}: NightActionPanelProps) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [witchAction, setWitchAction] = useState<'save' | 'poison' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false); // State for Dialog

  const roleAction = ROLE_ACTIONS[myRole];

  if (!roleAction) {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-400 text-lg">您的角色在夜晚没有特殊行动</div>
        <div className="text-slate-500 mt-2">请等待其他玩家完成行动...</div>
      </div>
    );
  }

  // Pre-check for Witch Save (auto-select victim)
  const handleWitchSaveSelect = () => {
    setWitchAction('save');
    if (nightHintTargetId) {
      setSelectedTarget(nightHintTargetId);
    }
  };

  const handleActionClick = () => {
    // Open Dialog instead of direct submit
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    let actionType = roleAction.actionType;

    // Witch special handling
    if (myRole === 'witch' && witchAction) {
      if (witchAction === 'save' && nightHintTargetId) {
        // Double check target is set for safety, though handled in onClick
        // setSelectedTarget(nightHintTargetId); 
      }
      actionType = witchAction;
    }

    onActionSubmit(actionType, selectedTarget);
    setSubmitted(true);
    setIsConfirmDialogOpen(false);
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
  const eligiblePlayers = (() => {
    const base = players.filter((p) => p.is_alive && (roleAction.canTargetSelf || p.id !== myId));
    if (myRole === 'witch' && witchAction === 'save' && nightHintTargetId) {
      return base.filter(p => p.id === nightHintTargetId);
    }
    return base;
  })();

  // Construct titles for dialog
  const targetPlayer = players.find(p => p.id === selectedTarget);
  const dialogTitle = myRole === 'witch'
    ? (witchAction === 'save' ? '确认使用解药？' : '确认使用毒药？')
    : roleAction.label.replace('选择', '确认');

  const dialogActionType = (myRole === 'witch' ? witchAction : roleAction.actionType) as any;

  return (
    <div className={compact ? "space-y-2" : "space-y-6"}>
      {/* Action Header */}
      <div className={`${compact ? 'p-3' : 'p-6'} bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg border border-indigo-700`}>
        <div className="flex items-center gap-4">
          <div className={`${compact ? 'bg-indigo-600/80 p-1.5' : 'bg-indigo-600 p-3'} rounded-full`}>
            <Icon className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
          </div>
          <div>
            <div className={`${compact ? 'text-sm' : 'text-xl'} font-bold text-white`}>{roleAction.label}</div>
            {!compact && <div className="text-sm text-slate-300">{roleAction.description}</div>}
          </div>
        </div>
      </div>

      {/* Witch Special Controls */}
      {myRole === 'witch' && (
        <div className="flex gap-4">
          <Button
            onClick={handleWitchSaveSelect}
            className={`flex-1 ${witchAction === 'save' ? 'bg-green-600' : 'bg-slate-700'}`}
          >
            <Heart className="w-4 h-4 mr-2" />
            使用解药
          </Button>
          <Button
            onClick={() => { setWitchAction('poison'); setSelectedTarget(null); }}
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
          onClick={handleActionClick}
          disabled={(myRole !== 'witch' && !selectedTarget) || (myRole === 'witch' && !witchAction) || (myRole === 'witch' && witchAction === 'poison' && !selectedTarget)}
          className="px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all hover:scale-105"
        >
          确认行动
        </Button>
      </div>

      {/* Confrim Dialog */}
      <ActionConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={dialogTitle}
        targetName={targetPlayer ? `${targetPlayer.position}号 ${targetPlayer.name}` : undefined}
        description="此操作无法撤销"
        actionType={dialogActionType}
      />
    </div>
  );
};
