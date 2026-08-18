import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Gamepad2,
  MessageCircle,
  ScrollText,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/config/faceToFaceChat';
import { AGENT_SHOWROOM } from '@/config/agentRoster';
import {
  PARTNER_LAYOUT_NOTES,
  PARTNER_MODE_CARDS,
  buildPartnerRoster,
  type PartnerModeCard,
} from '@/config/partnerHome';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { agentReviewApi } from '@/db/api';
import type { AgentLeaderboardEntry } from '@/types';

const modeIcons: Record<PartnerModeCard['id'], typeof Swords> = {
  werewolf: Swords,
  script_murder: ScrollText,
  teammate: MessageCircle,
};

const noteIcons = [Sparkles, Bot, CheckCircle2];

const accentStyles: Record<PartnerModeCard['accent'], string> = {
  ember:
    'border-[#f2875f]/18 bg-[linear-gradient(180deg,rgba(242,135,95,0.16),rgba(255,255,255,0.02))] text-[#ffb895]',
  gold:
    'border-[#d4b26f]/18 bg-[linear-gradient(180deg,rgba(212,178,111,0.16),rgba(255,255,255,0.02))] text-[#efd08b]',
  teal:
    'border-[#4fa3a0]/18 bg-[linear-gradient(180deg,rgba(79,163,160,0.16),rgba(255,255,255,0.02))] text-[#8dd3d0]',
};

export default function Partner() {
  const navigate = useNavigate();
  const { selectedAgent, setSelectedAgentId } = useAgentSelection();
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardEntry[]>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await agentReviewApi.getLeaderboard();
      setLeaderboard(entries);
    };

    void loadLeaderboard();
  }, []);

  const selectedEntry = useMemo(
    () =>
      leaderboard.find((entry) => entry.agentId === selectedAgent.id) ??
      agentReviewApi.getSeedForAgent(selectedAgent.id),
    [leaderboard, selectedAgent.id],
  );

  const roster = useMemo(
    () => buildPartnerRoster(AGENT_SHOWROOM, leaderboard, selectedAgent.id),
    [leaderboard, selectedAgent.id],
  );

  const topAgents = useMemo(
    () =>
      [...roster]
        .sort((left, right) => {
          if (right.score !== left.score) return right.score - left.score;
          return right.reviewCount - left.reviewCount;
        })
        .slice(0, 3),
    [roster],
  );

  const metrics = [
    { label: '当前主陪', value: selectedAgent.name },
    { label: '可选角色', value: String(AGENT_SHOWROOM.length) },
    { label: '当前评分', value: selectedEntry ? selectedEntry.averageOverall.toFixed(1) : '--' },
  ];

  return (
    <div className="relative overflow-hidden px-4 pb-32 pt-6 md:px-8 md:pb-12 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-12%] h-[32rem] w-[32rem] rounded-full bg-[#ff8b61]/10 blur-[130px]" />
        <div className="absolute right-[-10%] top-[10rem] h-[26rem] w-[26rem] rounded-full bg-[#d8b56f]/10 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-[24%] h-[24rem] w-[24rem] rounded-full bg-[#327b78]/12 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_32%)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1480px] flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[38px] border border-white/10 bg-[#0b0910]/88 p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-6"
        >
          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <section className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.24em] text-white/56">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI 陪玩平台
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/42">
                  桌面优先
                </div>
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-[3.35rem] md:leading-[1.08]">
                今晚想玩什么？
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 md:text-base">
                先选玩法，再决定带谁进房。说明变少一点，体验直接一点。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/play')}
                  className="h-12 rounded-2xl bg-[#f2875f] px-5 text-white hover:bg-[#ff946f]"
                >
                  去选玩法
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/chat')}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white hover:bg-white/[0.08]"
                >
                  去挑队友
                </Button>
              </div>

              {/* New Game Intro Entry - Nintendo Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6"
              >
                <button
                  onClick={() => navigate('/intro')}
                  className="group relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-r from-[#ff6b4a]/10 via-[#4ecdc4]/10 to-[#9d7aff]/10 p-4 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b4a]/5 via-[#4ecdc4]/5 to-[#9d7aff]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#9d7aff]">
                        <Gamepad2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">探索 AIverse</div>
                        <div className="text-xs text-white/50">发现全新的游戏体验</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white">
                      <Wand2 className="h-4 w-4" />
                      <span>进入世界</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              </motion.div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {PARTNER_MODE_CARDS.map((item) => {
                  const Icon = modeIcons[item.id];

                  return (
                    <article
                      key={item.id}
                      className="group rounded-[28px] border border-white/10 bg-[#141118]/90 p-5 transition hover:-translate-y-1 hover:border-white/16 hover:bg-[#17141d]"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-[18px] border ${accentStyles[item.accent]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-6 text-2xl font-semibold text-white">{item.title}</div>
                      <div className="mt-2 text-xs tracking-[0.16em] text-white/38">{item.eyebrow}</div>
                      <p className="mt-4 text-sm leading-7 text-white/62">{item.description}</p>
                      <button
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white transition group-hover:text-[#ffd2be]"
                      >
                        {item.cta}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] p-6 md:p-8">
              <div className="text-[11px] tracking-[0.24em] text-white/38">当前状态</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-[2.35rem] md:leading-[1.12]">
                你现在带着谁？
              </h2>

              <div className="mt-6 rounded-[28px] border border-[#f2875f]/16 bg-[linear-gradient(180deg,rgba(77,36,23,0.44),rgba(19,14,20,0.92))] p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedAgent.previewImage}
                    alt={selectedAgent.name}
                    className="h-20 w-20 rounded-[24px] border border-white/10 object-cover object-top"
                  />
                  <div>
                    <div className="text-[11px] tracking-[0.18em] text-[#ffbb9c]/72">当前主陪</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{selectedAgent.name}</div>
                    <div className="mt-1 text-sm text-white/62">{selectedAgent.title}</div>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={() => navigate('/chat')}
                    className="h-11 flex-1 rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
                  >
                    换个队友
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/rankings')}
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  >
                    看排行
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="text-[11px] tracking-[0.18em] text-white/38">{item.label}</div>
                    <div className="mt-3 text-lg font-medium text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {PARTNER_LAYOUT_NOTES.map((note, index) => {
                  const Icon = noteIcons[index] ?? Sparkles;

                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-[#141118]/88 p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-black/20 text-white/80">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{note.title}</div>
                        <p className="mt-1 text-sm leading-6 text-white/56">{note.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </motion.section>

        <section className="rounded-[38px] border border-white/10 bg-[#0b0910]/88 p-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] tracking-[0.24em] text-white/38">热门队友</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                现在大家最常带的
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/58 md:text-base">
                首页只看趋势，不在这里完成选角。真要挑人，去队友页翻牌更直接。
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/chat')}
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white hover:bg-white/[0.08]"
            >
              去队友页
            </Button>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {topAgents.map((agent, index) => (
              <motion.article
                key={agent.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className={`rounded-[30px] border p-5 shadow-[0_18px_80px_rgba(0,0,0,0.3)] ${
                  agent.isSelected
                    ? 'border-[#f2875f]/24 bg-[linear-gradient(180deg,rgba(242,135,95,0.1),rgba(17,14,20,0.96))]'
                    : 'border-white/10 bg-[#121016]/94'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={agent.previewImage}
                      alt={agent.name}
                      className="h-24 w-24 rounded-[24px] border border-white/10 object-cover object-top"
                    />
                    <div className="absolute -bottom-2 -right-2 rounded-full border border-white/12 bg-[#17131c] px-2.5 py-1 text-xs font-medium text-white">
                      {agent.score.toFixed(1)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-white">{agent.name}</div>
                        <div className="mt-1 text-sm text-white/54">{agent.title}</div>
                      </div>
                      {agent.isSelected && (
                        <div className="rounded-full border border-[#f2875f]/20 bg-[#f2875f]/12 px-3 py-1 text-[11px] tracking-[0.16em] text-[#ffc0a8]">
                          当前主陪
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-7 text-white/64">{agent.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72">
                    {agent.modesLabel}
                  </span>
                  {agent.traits.slice(0, 2).map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-xs text-white/52"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { label: '默契', value: agent.chemistry.toFixed(1) },
                    { label: '推理', value: agent.deduction.toFixed(1) },
                    { label: '评分', value: String(agent.reviewCount) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 text-center"
                    >
                      <div className="text-[10px] tracking-[0.16em] text-white/36">{item.label}</div>
                      <div className="mt-2 text-sm font-medium text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      navigate('/chat');
                    }}
                    className="h-12 flex-1 rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
                  >
                    {agent.isSelected ? '继续聊天' : '设为主陪'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/rankings')}
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  >
                    评分
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
