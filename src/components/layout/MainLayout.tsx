import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Gamepad2, MessageCircle, Sparkles, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { PARTNER_QUICK_JUMPS, getPartnerAgentCopy } from '@/config/partnerHome';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';

const tabs = [
  { id: 'partner', label: '首页', subtitle: '开始', icon: Users, path: '/partner' },
  { id: 'play', label: '玩法', subtitle: '进房', icon: Gamepad2, path: '/play' },
  { id: 'chat', label: '队友', subtitle: '选人', icon: MessageCircle, path: '/chat' },
];

const utilityLinks = [
  { label: '排行', path: '/rankings', icon: Trophy },
  { label: '形象馆', path: '/avatar-stage', icon: Sparkles },
];

function isRouteActive(pathname: string, path: string, id: string) {
  if (id === 'partner') {
    return pathname === '/' || pathname === '/partner';
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedAgent } = useAgentSelection();
  const selectedAgentCopy = getPartnerAgentCopy(selectedAgent);

  return (
    <div className="min-h-screen bg-[#050308] text-white selection:bg-[#f0aa74]/30 md:flex">
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-[214px] md:flex-col md:border-r md:border-white/8 md:bg-[#09070c]/94 md:px-3 md:py-5 md:backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 text-left transition hover:border-white/18 hover:bg-white/[0.08]"
        >
          <div className="text-[10px] tracking-[0.28em] text-white/48">AI 陪玩平台</div>
          <div className="mt-3 text-[30px] font-semibold tracking-tight text-white">次元伴玩</div>
          <p className="mt-3 text-xs leading-6 text-white/60">选玩法，挑队友，直接进房。</p>
        </button>

        <nav className="mt-6 space-y-3">
          {tabs.map((tab) => {
            const isActive = isRouteActive(location.pathname, tab.path, tab.id);
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.id === 'partner' ? '/' : tab.path)}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] px-3 py-3 text-left transition ${
                  isActive
                    ? 'text-white'
                    : 'border border-transparent text-white/66 hover:border-white/8 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-pill"
                    className="absolute inset-0 rounded-[24px] border border-white/10 bg-[linear-gradient(90deg,rgba(242,135,95,0.22),rgba(255,255,255,0.06))]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/12 bg-black/20">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="relative min-w-0">
                  <span className="block text-sm font-medium">{tab.label}</span>
                  <span className="mt-0.5 block text-[11px] tracking-[0.12em] text-white/48">
                    {tab.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-[#121016]/90 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.38)]">
          <div className="text-[10px] tracking-[0.28em] text-white/42">快速进入</div>
          <div className="mt-3 space-y-2">
            {PARTNER_QUICK_JUMPS.map((item) => {
              const isActive = isRouteActive(location.pathname, item.path, item.label);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-sm transition ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-[#0c0a10] text-white/76 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-auto space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {utilityLinks.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] px-2 py-3 text-[11px] text-white/62 transition hover:bg-white/[0.06] hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-[28px] border border-[#f2875f]/16 bg-[linear-gradient(180deg,rgba(77,36,23,0.44),rgba(19,14,20,0.92))] p-4">
            <div className="text-[10px] tracking-[0.28em] text-[#ffbb9c]/72">当前队友</div>
            <div className="mt-3 text-lg font-semibold text-white">{selectedAgent.name}</div>
            <div className="mt-1 text-sm text-white/66">{selectedAgentCopy.title}</div>
            <p className="mt-3 text-xs leading-6 text-white/58">{selectedAgentCopy.tagline}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:ml-[214px]">
        <main className="flex-1 overflow-y-auto pb-24 no-scrollbar md:pb-0">
          <Outlet />
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 md:hidden">
        <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#111017]/88 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
          <div className="flex items-center justify-around gap-1">
            {tabs.map((tab) => {
              const isActive = isRouteActive(location.pathname, tab.path, tab.id);
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.id === 'partner' ? '/' : tab.path)}
                  className={`relative flex w-full flex-col items-center justify-center rounded-2xl py-2 transition ${
                    isActive ? 'text-white' : 'text-white/44 hover:text-white/74'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(242,135,95,0.16),rgba(255,255,255,0.02))]"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-black/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="relative mt-1 text-[11px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
