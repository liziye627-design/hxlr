import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Flame, Gamepad2, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GAME_MODES, getGameModeMeta, type GameModeId } from '@/config/gameModes';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';

const modeIcons = {
  werewolf: Flame,
  script_murder: ScrollText,
  adventure: Compass,
} as const;

const modeDisplay: Record<
  GameModeId,
  {
    title: string;
    eyebrow: string;
    description: string;
    image: string;
    overlay: string;
  }
> = {
  werewolf: {
    title: '狼人杀',
    eyebrow: '实时发言 / 多人推理',
    description: '一边发言，一边带票。',
    image: '/images/werewolf-bg-v2.png',
    overlay: 'from-[#1e120f]/88 via-[#140d10]/58 to-transparent',
  },
  script_murder: {
    title: '剧本杀',
    eyebrow: '搜证理线 / 沉浸演绎',
    description: '进房搜证，顺着剧情往下走。',
    image:
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1800&auto=format&fit=crop',
    overlay: 'from-[#140d12]/88 via-[#09080f]/62 to-transparent',
  },
  adventure: {
    title: 'Minecraft',
    eyebrow: '本地世界 / AI 陪玩',
    description: '带着陪玩进世界，稳定开局并记录过程。',
    image: '/images/minecraft/mc-nether.png',
    overlay: 'from-[#0d1218]/88 via-[#091117]/62 to-transparent',
  },
};

export default function Play() {
  const navigate = useNavigate();
  const { selectedAgent, setPendingMode, setCarryMode } = useAgentSelection();
  const [activeModeId, setActiveModeId] = useState<GameModeId | null>(null);

  const activeMode = activeModeId ? getGameModeMeta(activeModeId) : null;
  const activeDisplay = activeModeId ? modeDisplay[activeModeId] : null;

  const handleEnterMode = (modeId: GameModeId, carryMode: 'with_agent' | 'solo') => {
    const mode = getGameModeMeta(modeId);
    setCarryMode(modeId, carryMode);
    setPendingMode(null);
    setActiveModeId(null);
    navigate(mode.path, {
      state: {
        carryMode,
      },
    });
  };

  const handleSwitchCompanion = () => {
    if (!activeModeId) return;
    setPendingMode(activeModeId);
    setActiveModeId(null);
    navigate('/chat');
  };

  return (
    <div className="relative overflow-hidden px-4 pb-20 pt-6 md:px-8 md:pb-10 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[30rem] w-[30rem] rounded-full bg-[#f2875f]/10 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#278b8b]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-[#0b1012]/88 px-5 py-6 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.22em] text-white/56">
              <Gamepad2 className="h-3.5 w-3.5" />
              游戏入口
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">选一个游戏</h1>
            <p className="max-w-2xl text-sm leading-7 text-white/56 md:text-base">
              先点进游戏，进房前再决定要不要带上陪玩。
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {GAME_MODES.map((mode) => {
            const Icon = modeIcons[mode.id];
            const display = modeDisplay[mode.id];

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveModeId(mode.id)}
                className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1012]/88 text-left shadow-[0_18px_90px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#10161a]/92"
              >
                <div className="relative h-[280px] overflow-hidden">
                  <img
                    src={display.image}
                    alt={display.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-b ${display.overlay}`} />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-white/82" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] tracking-[0.18em] text-white/66">
                      进入
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="text-[11px] tracking-[0.18em] text-white/56">{display.eyebrow}</div>
                    <h2 className="mt-3 text-4xl font-semibold text-white">{display.title}</h2>
                    <p className="mt-3 text-sm text-white/68">{display.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>

      <Dialog open={Boolean(activeMode)} onOpenChange={(open) => (!open ? setActiveModeId(null) : null)}>
        <DialogContent className="max-sm:top-auto max-sm:bottom-4 max-sm:translate-y-0 border-white/10 bg-[#0b1012]/96 p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.52)] sm:max-w-[520px]">
          {activeMode && activeDisplay && (
            <div className="space-y-0">
              <div className="relative h-44 overflow-hidden border-b border-white/8">
                <img src={activeDisplay.image} alt={activeDisplay.title} className="h-full w-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-b ${activeDisplay.overlay}`} />
                <div className="absolute inset-x-0 bottom-0 px-6 py-5">
                  <div className="text-[11px] tracking-[0.18em] text-white/60">{activeDisplay.eyebrow}</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{activeDisplay.title}</div>
                </div>
              </div>

              <DialogHeader className="border-b border-white/8 px-6 py-5 text-left">
                <DialogTitle className="text-2xl text-white">要带上陪玩吗？</DialogTitle>
                <DialogDescription className="text-white/56">
                  当前主陪是 {selectedAgent.name}。你可以直接带她进房，也可以先换一个。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 px-6 py-5">
                <button
                  type="button"
                  onClick={() => handleEnterMode(activeMode.id, 'with_agent')}
                  className="w-full rounded-[24px] border border-[#f2875f]/30 bg-[#f2875f]/12 px-4 py-4 text-left transition hover:bg-[#f2875f]/18"
                >
                  <div className="text-sm font-medium text-white">带上当前陪玩</div>
                  <div className="mt-2 text-sm text-white/58">{selectedAgent.name}</div>
                </button>

                <button
                  type="button"
                  onClick={handleSwitchCompanion}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08]"
                >
                  <div className="text-sm font-medium text-white">换个陪玩</div>
                  <div className="mt-2 text-sm text-white/58">去队友页重新翻牌，再回来继续进房。</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleEnterMode(activeMode.id, 'solo')}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08]"
                >
                  <div className="text-sm font-medium text-white">直接进入</div>
                  <div className="mt-2 text-sm text-white/58">这局先不绑定陪玩。</div>
                </button>
              </div>

              <DialogFooter className="border-t border-white/8 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveModeId(null)}
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                >
                  取消
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
