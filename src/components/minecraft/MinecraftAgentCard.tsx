/**
 * Minecraft 角色选择卡片
 * 用于在冒险模式中选择陪玩角色
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  ShieldCheck,
  Pickaxe,
  Sword,
  Map,
  Package,
  Users,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MinecraftAgentSummary } from '@/services/minecraftApi';

interface MinecraftAgentCardProps {
  agent: MinecraftAgentSummary;
  selected?: boolean;
  active?: boolean;
  onSelect: (agentId: string) => void;
  onStart: (agentId: string) => void;
  onStop: (agentId: string) => void;
  loading?: boolean;
}

// 类型颜色主题
const typeColors = {
  alpha: { primary: '#ff6b4a', secondary: '#ff8a6d', accent: '#ffd0c0' },
  aqua: { primary: '#4ecdc4', secondary: '#7ee8e0', accent: '#c0fff8' },
  shadow: { primary: '#9d7aff', secondary: '#b99aff', accent: '#e0d0ff' },
  rookie: { primary: '#ffb347', secondary: '#ffc97a', accent: '#ffe8c0' },
};

// 任务类型图标
const taskIcons: Record<string, typeof Pickaxe> = {
  mine: Pickaxe,
  build: Package,
  fight: Sword,
  follow: Users,
  explore: Map,
  collect: Package,
};

export function MinecraftAgentCard({
  agent,
  selected = false,
  active = false,
  onSelect,
  onStart,
  onStop,
  loading = false,
}: MinecraftAgentCardProps) {
  const [flipped, setFlipped] = useState(false);
  const colors = typeColors[agent.type];
  const rating = (
    (agent.scoreSeed.chemistry +
      agent.scoreSeed.deduction +
      agent.scoreSeed.clutch +
      agent.scoreSeed.ambience) /
    80
  ).toFixed(1);

  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      className="group perspective-[1800px]"
      onClick={() => setFlipped((current) => !current)}
    >
      <div
        className="relative h-[28rem] w-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 正面 */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-[32px] border bg-[#0d1215]/92 shadow-[0_18px_90px_rgba(0,0,0,0.35)] ${
            selected ? 'border-[#4ecdc4]/40' : 'border-white/10'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={agent.previewImage}
            alt={agent.name}
            className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,10,0.08),rgba(6,6,10,0.3)_38%,rgba(6,6,10,0.88)_100%)]" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 28%), radial-gradient(circle at bottom, ${colors.primary}30, transparent 36%)`,
            }}
          />

          {/* 状态标签 */}
          <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
            <div className="rounded-full border border-white/12 bg-black/28 px-3 py-1 text-[11px] tracking-[0.18em] text-white/78 backdrop-blur-sm">
              {active ? '游戏中' : '点击翻牌'}
            </div>
            <div
              className="rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm"
              style={{
                borderColor: `${colors.primary}40`,
                backgroundColor: `${colors.primary}20`,
                color: colors.accent,
              }}
            >
              {rating}
            </div>
          </div>

          {/* 底部信息 */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,8,14,0.2),rgba(10,8,14,0.72))] p-4 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.2em]" style={{ color: colors.secondary }}>
                    {agent.title}
                  </div>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{agent.name}</h3>
                </div>
                {selected && (
                  <div
                    className="rounded-full border px-2 py-1 text-[10px] tracking-[0.16em]"
                    style={{
                      borderColor: `${colors.primary}40`,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.accent,
                    }}
                  >
                    当前选择
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-white/62 line-clamp-2">{agent.tagline}</p>

              {/* 能力指示器 */}
              <div className="mt-3 flex gap-2">
                {agent.behaviors?.canMine && (
                  <div className="rounded-lg bg-white/5 p-1.5" title="挖掘">
                    <Pickaxe className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
                {agent.behaviors?.canBuild && (
                  <div className="rounded-lg bg-white/5 p-1.5" title="建造">
                    <Package className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
                {agent.behaviors?.canFight && (
                  <div className="rounded-lg bg-white/5 p-1.5" title="战斗">
                    <Sword className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
                {agent.behaviors?.canExplore && (
                  <div className="rounded-lg bg-white/5 p-1.5" title="探索">
                    <Map className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 背面 */}
        <div
          className={`absolute inset-0 overflow-y-auto rounded-[32px] border bg-[linear-gradient(180deg,rgba(19,14,22,0.98),rgba(9,8,13,0.98))] p-4 shadow-[0_18px_90px_rgba(0,0,0,0.35)] ${
            selected ? 'border-[#4ecdc4]/40' : 'border-white/10'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex h-full flex-col">
            {/* 标题 */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.2em]" style={{ color: colors.secondary }}>
                  {agent.title}
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">{agent.name}</h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(agent.id);
                }}
                className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.18em] transition ${
                  selected
                    ? ''
                    : 'border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.08]'
                }`}
                style={
                  selected
                    ? {
                        borderColor: `${colors.primary}40`,
                        backgroundColor: `${colors.primary}15`,
                        color: colors.accent,
                      }
                    : {}
                }
              >
                {selected ? '已选择' : '选择'}
              </button>
            </div>

            {/* 评分 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '总分', value: rating, color: '#ffd700' },
                { label: '默契', value: (agent.scoreSeed.chemistry / 20).toFixed(1), color: '#ff6b9d' },
                { label: '推理', value: (agent.scoreSeed.deduction / 20).toFixed(1), color: '#4ecdc4' },
                { label: '关键', value: (agent.scoreSeed.clutch / 20).toFixed(1), color: '#9d7aff' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[16px] border border-white/8 bg-white/[0.03] px-2 py-2 text-center"
                >
                  <div className="text-[10px] tracking-[0.16em] text-white/38">{item.label}</div>
                  <div className="mt-1 text-base font-semibold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* 能力详情 */}
            <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
              <div className="text-[11px] tracking-[0.18em] text-white/42 mb-2">能力</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'canMine', label: '挖掘', icon: Pickaxe },
                  { key: 'canBuild', label: '建造', icon: Package },
                  { key: 'canFight', label: '战斗', icon: Sword },
                  { key: 'canExplore', label: '探索', icon: Map },
                ].map((item) => {
                  const enabled = agent.behaviors?.[item.key as keyof typeof agent.behaviors];
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                        enabled
                          ? 'border-white/10 bg-white/[0.03]'
                          : 'border-white/5 bg-transparent opacity-40'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${enabled ? 'text-white/70' : 'text-white/30'}`} />
                      <span className={`text-xs ${enabled ? 'text-white/70' : 'text-white/30'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 擅长任务 */}
            <div className="mt-4">
              <div className="text-[11px] tracking-[0.18em] text-white/42 mb-2">擅长任务</div>
              <div className="flex flex-wrap gap-2">
                {agent.behaviors?.preferredTasks.map((task) => {
                  const Icon = taskIcons[task] || Star;
                  return (
                    <span
                      key={task}
                      className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                      style={{
                        borderColor: `${colors.primary}30`,
                        backgroundColor: `${colors.primary}10`,
                        color: colors.accent,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {task}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-auto space-y-2 pt-4">
              {active ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop(agent.id);
                  }}
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-red-500/80 text-white hover:bg-red-500"
                >
                  停止游戏
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(agent.id);
                  }}
                  disabled={loading}
                  className="h-11 w-full justify-between rounded-xl px-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    开始冒险
                  </span>
                  <ShieldCheck className="h-4 w-4 text-white/70" />
                </Button>
              )}

              <div className="text-center text-xs text-white/42">再点一下翻回</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}