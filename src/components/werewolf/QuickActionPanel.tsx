import { Vote, Zap, Eye, Shield, Heart, Crosshair, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { GamePhase } from '../../types';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  enabled: boolean;
  badge?: number | string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

interface QuickActionPanelProps {
  phase: GamePhase;
  myRole?: string;
  canVote?: boolean;
  canUseSkill?: boolean;
  skillUsesLeft?: number;
  onVote?: () => void;
  onUseSkill?: () => void;
  onChat?: () => void;
  customActions?: QuickAction[];
}

export const QuickActionPanel = ({
  phase,
  myRole,
  canVote = false,
  canUseSkill = false,
  skillUsesLeft,
  onVote,
  onUseSkill,
  onChat,
  customActions = [],
}: QuickActionPanelProps) => {
  // 根据游戏阶段和角色生成可用操作
  const generateActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    // 投票操作
    if (phase === 'DAY_VOTE' && onVote) {
      actions.push({
        id: 'vote',
        label: '投票',
        icon: Vote,
        onClick: onVote,
        enabled: canVote,
        variant: 'destructive',
      });
    }

    // 角色技能操作
    if (phase === 'NIGHT' && onUseSkill) {
      const skillConfig: Record<string, { label: string; icon: any; variant: any }> = {
        werewolf: { label: '杀人', icon: Crosshair, variant: 'destructive' },
        seer: { label: '查验', icon: Eye, variant: 'default' },
        witch: { label: '使用药水', icon: Heart, variant: 'secondary' },
        guard: { label: '守护', icon: Shield, variant: 'default' },
        hunter: { label: '开枪', icon: Crosshair, variant: 'destructive' },
      };

      const config = myRole ? skillConfig[myRole] : null;
      if (config) {
        actions.push({
          id: 'skill',
          label: config.label,
          icon: config.icon,
          onClick: onUseSkill,
          enabled: canUseSkill,
          badge: skillUsesLeft !== undefined ? `${skillUsesLeft}次` : undefined,
          variant: config.variant,
        });
      }
    }

    // 聊天/发言操作
    if (phase === 'DAY_DISCUSS' && onChat) {
      actions.push({
        id: 'chat',
        label: '发言',
        icon: MessageSquare,
        onClick: onChat,
        enabled: true,
        variant: 'outline',
      });
    }

    // 添加自定义操作
    actions.push(...customActions);

    return actions;
  };

  const actions = generateActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">快捷操作</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              disabled={!action.enabled}
              variant={action.variant || 'default'}
              className="relative flex flex-col items-center gap-1 h-auto py-3"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
              {action.badge && (
                <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 h-5 min-w-[20px]">
                  {action.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* 操作提示 */}
      <div className="mt-3 text-xs text-slate-400 text-center">
        {phase === 'NIGHT' && '请在夜晚行动阶段选择您的目标'}
        {phase === 'DAY_VOTE' && '请选择要投票驱逐的玩家'}
        {phase === 'DAY_DISCUSS' && '自由讨论时间，分享您的推理'}
        {phase === 'HUNTER_SHOOT' && myRole === 'hunter' && '猎人请选择带走的玩家'}
        {phase === 'BADGE_TRANSFER' && '警长请选择警徽继承人'}
      </div>
    </div>
  );
};
