/**
 * Minecraft 任务面板
 * 用于向 AI 角色发送任务指令
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pickaxe,
  Package,
  Sword,
  Users,
  Map,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/services/minecraft';

interface TaskPanelProps {
  agentId: string;
  agentName: string;
  onExecuteTask: (task: {
    type: 'mine' | 'build' | 'fight' | 'follow' | 'collect' | 'explore';
    target?: string;
    quantity?: number;
  }) => Promise<Task>;
  disabled?: boolean;
}

const TASK_TYPES = [
  {
    id: 'mine',
    label: '挖掘',
    icon: Pickaxe,
    description: '收集指定方块',
    color: '#ff6b4a',
    needsTarget: true,
    needsQuantity: true,
    defaultTarget: 'stone',
    commonTargets: ['stone', 'iron_ore', 'coal_ore', 'diamond_ore', 'gold_ore'],
  },
  {
    id: 'build',
    label: '建造',
    icon: Package,
    description: '建造结构',
    color: '#4ecdc4',
    needsTarget: true,
    needsQuantity: false,
    defaultTarget: 'house',
    commonTargets: ['house', 'tower', 'bridge', 'wall'],
  },
  {
    id: 'fight',
    label: '战斗',
    icon: Sword,
    description: '攻击敌对生物',
    color: '#ff4757',
    needsTarget: true,
    needsQuantity: false,
    defaultTarget: 'zombie',
    commonTargets: ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'],
  },
  {
    id: 'follow',
    label: '跟随',
    icon: Users,
    description: '跟随玩家移动',
    color: '#9d7aff',
    needsTarget: false,
    needsQuantity: false,
  },
  {
    id: 'explore',
    label: '探索',
    icon: Map,
    description: '探索附近区域',
    color: '#ffb347',
    needsTarget: false,
    needsQuantity: false,
  },
  {
    id: 'collect',
    label: '收集',
    icon: Package,
    description: '收集掉落物品',
    color: '#2ed573',
    needsTarget: true,
    needsQuantity: true,
    defaultTarget: 'wheat',
    commonTargets: ['wheat', 'carrot', 'potato', 'wood', 'cobblestone'],
  },
];

export function TaskPanel({ agentId, agentName, onExecuteTask, disabled = false }: TaskPanelProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [lastTask, setLastTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTaskType = TASK_TYPES.find((t) => t.id === selectedTask);

  const handleExecute = async () => {
    if (!selectedTask) return;

    setExecuting(true);
    setError(null);

    try {
      const task = await onExecuteTask({
        type: selectedTask as Task['type'],
        target: currentTaskType?.needsTarget ? target || currentTaskType.defaultTarget : undefined,
        quantity: currentTaskType?.needsQuantity ? quantity : undefined,
      });
      setLastTask(task);
      setSelectedTask(null);
      setTarget('');
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '任务执行失败');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0d1215]/92 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.18em] text-white/42">任务指令</div>
          <div className="mt-1 text-lg font-semibold text-white">给 {agentName} 下达任务</div>
        </div>
        {lastTask && (
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
              lastTask.status === 'completed'
                ? 'bg-green-500/15 text-green-400'
                : lastTask.status === 'failed'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-yellow-500/15 text-yellow-400'
            }`}
          >
            {lastTask.status === 'completed' ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : lastTask.status === 'failed' ? (
              <XCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {lastTask.type}
          </div>
        )}
      </div>

      {/* 任务类型选择 */}
      <div className="grid grid-cols-3 gap-2">
        {TASK_TYPES.map((task) => {
          const Icon = task.icon;
          const isSelected = selectedTask === task.id;

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                setSelectedTask(isSelected ? null : task.id);
                setTarget(task.defaultTarget || '');
              }}
              disabled={disabled}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                isSelected
                  ? ''
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: `${task.color}40`,
                      backgroundColor: `${task.color}15`,
                    }
                  : {}
              }
            >
              <Icon className="h-5 w-5" style={{ color: isSelected ? task.color : 'rgba(255,255,255,0.6)' }} />
              <span
                className="text-xs font-medium"
                style={{ color: isSelected ? task.color : 'rgba(255,255,255,0.7)' }}
              >
                {task.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 任务参数配置 */}
      <AnimatePresence>
        {selectedTask && currentTaskType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm text-white/70">{currentTaskType.description}</div>

              {currentTaskType.needsTarget && (
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-white/50">目标</label>
                  <div className="flex flex-wrap gap-2">
                    {currentTaskType.commonTargets?.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTarget(t)}
                        className={`rounded-lg border px-2 py-1 text-xs transition ${
                          target === t
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 bg-transparent text-white/60 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="自定义..."
                      className="w-24 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {currentTaskType.needsQuantity && (
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-white/50">数量: {quantity}</label>
                  <input
                    type="range"
                    min={1}
                    max={64}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full accent-white/50"
                  />
                </div>
              )}

              <Button
                onClick={handleExecute}
                disabled={executing || disabled}
                className="h-10 w-full rounded-xl text-white"
                style={{
                  background: `linear-gradient(135deg, ${currentTaskType.color}, ${currentTaskType.color}cc)`,
                }}
              >
                {executing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    执行任务
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}