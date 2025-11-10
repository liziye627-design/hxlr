import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Lock, Sparkles } from 'lucide-react';
import type { CompanionWithRelation } from '@/types';

interface CompanionCardProps {
  companion: CompanionWithRelation;
  onSelect?: () => void;
  onUnlock?: () => void;
  showIntimacy?: boolean;
}

export function CompanionCard({
  companion,
  onSelect,
  onUnlock,
  showIntimacy = false,
}: CompanionCardProps) {
  const isLocked = !companion.unlocked;
  const intimacy = companion.intimacy || 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alpha':
        return 'bg-primary';
      case 'aqua':
        return 'bg-accent';
      case 'shadow':
        return 'bg-secondary';
      case 'rookie':
        return 'bg-muted';
      default:
        return 'bg-primary';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'alpha':
        return '策略型';
      case 'aqua':
        return '社交型';
      case 'shadow':
        return '神秘型';
      case 'rookie':
        return '辅助型';
      default:
        return type;
    }
  };

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-primary ${isLocked ? 'opacity-60' : ''}`}>
      <div className="relative">
        <div className="h-48 overflow-hidden bg-gradient-bg-hero">
          <img
            src={companion.avatar_url || ''}
            alt={companion.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${!isLocked && 'group-hover:scale-110'}`}
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        
        <Badge className={`absolute top-3 right-3 ${getTypeColor(companion.type)} border-0`}>
          {getTypeName(companion.type)}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">{companion.name}</h3>
          {showIntimacy && !isLocked && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 fill-destructive text-destructive" />
              <span>{intimacy}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {companion.description}
        </p>
        
        {companion.personality && (
          <div className="flex flex-wrap gap-1 mb-3">
            {companion.personality.traits.map((trait, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>
        )}
        
        {isLocked ? (
          <Button
            onClick={onUnlock}
            variant="outline"
            className="w-full"
            disabled={companion.unlock_level > 1}
          >
            <Lock className="w-4 h-4 mr-2" />
            {companion.unlock_level > 1 ? `等级${companion.unlock_level}解锁` : '解锁'}
          </Button>
        ) : (
          <Button
            onClick={onSelect}
            className="w-full gradient-bg-primary border-0 hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            选择伙伴
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
