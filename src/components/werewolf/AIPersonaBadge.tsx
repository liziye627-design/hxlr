import { Badge } from '../ui/badge';
import { Brain, Heart, Zap, Shield, MessageSquare } from 'lucide-react';

interface PersonalityTrait {
  id: string;
  label: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AIPersonaBadgeProps {
  strengths?: string[];
  weaknesses?: string[];
  compact?: boolean;
  className?: string;
}

// 性格特质映射
const TRAIT_CONFIG: Record<string, PersonalityTrait> = {
  逻辑严密: { id: 'logical', label: '逻辑严密', icon: Brain, color: 'bg-blue-500' },
  冷静分析: { id: 'calm', label: '冷静分析', emoji: '❄️', color: 'bg-cyan-500' },
  观察敏锐: { id: 'observant', label: '观察敏锐', emoji: '👁️', color: 'bg-purple-500' },
  推理能力强: { id: 'reasoning', label: '推理能力强', emoji: '🔍', color: 'bg-indigo-500' },
  情感丰富: { id: 'emotional', label: '情感丰富', icon: Heart, color: 'bg-pink-500' },
  激进果断: { id: 'aggressive', label: '激进果断', icon: Zap, color: 'bg-orange-500' },
  谨慎稳重: { id: 'cautious', label: '谨慎稳重', icon: Shield, color: 'bg-green-500' },
  善于沟通: { id: 'communicative', label: '善于沟通', icon: MessageSquare, color: 'bg-yellow-500' },
  话少: { id: 'silent', label: '话少', emoji: '🤐', color: 'bg-gray-500' },
  话多: { id: 'talkative', label: '话多', emoji: '💬', color: 'bg-amber-500' },
  容易被骗: { id: 'gullible', label: '容易被骗', emoji: '😅', color: 'bg-red-400' },
  缺乏共情: { id: 'cold', label: '缺乏共情', emoji: '❄️', color: 'bg-slate-500' },
};

export const AIPersonaBadge = ({
  strengths = [],
  weaknesses = [],
  compact = false,
  className = '',
}: AIPersonaBadgeProps) => {
  const renderTrait = (trait: string, isStrength: boolean) => {
    const config = TRAIT_CONFIG[trait];
    if (!config) {
      return (
        <Badge
          key={trait}
          variant={isStrength ? 'default' : 'outline'}
          className={`text-xs ${isStrength ? 'bg-green-600' : 'border-red-400 text-red-300'}`}
        >
          {trait}
        </Badge>
      );
    }

    const Icon = config.icon;

    return (
      <Badge
        key={trait}
        variant={isStrength ? 'default' : 'outline'}
        className={`
          text-xs flex items-center gap-1
          ${isStrength ? config.color : 'border-opacity-50 text-opacity-70'}
          ${compact ? 'py-0 px-1.5' : 'py-0.5 px-2'}
        `}
      >
        {config.emoji && <span>{config.emoji}</span>}
        {Icon && <Icon className="w-3 h-3" />}
        <span>{compact && trait.length > 4 ? `${trait.slice(0, 4)}..` : trait}</span>
      </Badge>
    );
  };

  if (strengths.length === 0 && weaknesses.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {/* 特长 */}
      {strengths.map((trait) => renderTrait(trait, true))}

      {/* 弱点 */}
      {weaknesses.map((trait) => renderTrait(trait, false))}
    </div>
  );
};

// AI 角色卡片组件（用于展示完整信息）
interface AIPersonaCardProps {
  name: string;
  avatar?: string;
  strengths: string[];
  weaknesses: string[];
  description?: string;
}

export const AIPersonaCard = ({
  name,
  avatar,
  strengths,
  weaknesses,
  description,
}: AIPersonaCardProps) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        {avatar && (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full border-2 border-slate-600"
          />
        )}
        <div>
          <h3 className="text-white font-semibold">{name}</h3>
          <Badge variant="outline" className="text-xs mt-1 border-purple-400 text-purple-300">
            AI 玩家
          </Badge>
        </div>
      </div>

      {description && <p className="text-sm text-slate-400 mb-3">{description}</p>}

      {strengths.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-slate-500 mb-1">特长</div>
          <AIPersonaBadge strengths={strengths} />
        </div>
      )}

      {weaknesses.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-1">弱点</div>
          <AIPersonaBadge weaknesses={weaknesses} />
        </div>
      )}
    </div>
  );
};
