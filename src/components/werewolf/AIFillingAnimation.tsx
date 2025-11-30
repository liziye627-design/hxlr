import { Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface AIFillingAnimationProps {
  totalSlots: number;
  filledSlots: number;
  isGenerating: boolean;
  onCancel?: () => void;
}

export const AIFillingAnimation = ({
  totalSlots,
  filledSlots,
  isGenerating,
  onCancel,
}: AIFillingAnimationProps) => {
  const progress = (filledSlots / totalSlots) * 100;
  const remaining = totalSlots - filledSlots;

  if (!isGenerating && filledSlots === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {/* 动画图标 */}
          <div className="relative">
            <Bot className="w-12 h-12 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping" />
          </div>

          {/* 进度信息 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">
                {isGenerating ? '正在生成AI玩家...' : 'AI玩家已就位'}
              </span>
              <span className="text-purple-300 text-sm">
                {filledSlots} / {totalSlots}
              </span>
            </div>

            {/* 进度条 */}
            <Progress value={progress} className="h-2" />

            {isGenerating && remaining > 0 && (
              <p className="text-sm text-slate-400">还需生成 {remaining} 名AI玩家</p>
            )}
          </div>

          {/* 取消按钮 */}
          {isGenerating && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              取消
            </Button>
          )}
        </div>

        {/* AI玩家卡片预览 */}
        {filledSlots > 0 && !isGenerating && (
          <div className="mt-4 text-sm text-green-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            成功生成 {filledSlots} 名AI玩家
          </div>
        )}
      </CardContent>
    </Card>
  );
};
