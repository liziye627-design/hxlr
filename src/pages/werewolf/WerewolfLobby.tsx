import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CompanionCarryMode } from '@/config/gameModes';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';

type WerewolfLocationState = {
  carryMode?: CompanionCarryMode;
};

export default function WerewolfLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedAgent, carryModes, setPendingMode } = useAgentSelection();
  const [entryMode, setEntryMode] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('玩家1');
  const [roomId, setRoomId] = useState('');
  const [selectedMode, setSelectedMode] = useState<6 | 9 | 12>(9);

  const carryMode =
    (location.state as WerewolfLocationState | null)?.carryMode ?? carryModes.werewolf ?? 'with_agent';
  const companionEnabled = carryMode !== 'solo';

  const buildCarryState = () =>
    companionEnabled
      ? {
          leadAgentId: selectedAgent.id,
          agentIds: [selectedAgent.id],
        }
      : {
          agentIds: [] as string[],
        };

  const handleCreateRoom = () => {
    if (!playerName.trim() || !roomName.trim()) {
      window.alert('请先填写昵称和房间名。');
      return;
    }

    navigate('/werewolf/game', {
      state: {
        action: 'create',
        playerName,
        roomName,
        mode: selectedMode,
        carryMode,
        ...buildCarryState(),
      },
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      window.alert('请先填写昵称和房间号。');
      return;
    }

    navigate('/werewolf/game', {
      state: {
        action: 'join',
        playerName,
        roomId,
        carryMode,
        ...buildCarryState(),
      },
    });
  };

  const openTeammatePicker = () => {
    setPendingMode('werewolf');
    navigate('/chat');
  };

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[#7f1d1d]/24 blur-[130px]" />
        <div className="absolute right-[-8%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-[#f2875f]/14 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-[920px] flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-[#120b0d]/88 px-5 py-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.22em] text-white/56">
                狼人杀
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                开一局狼人杀
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: '进入方式', value: entryMode === 'create' ? '创建房间' : '加入房间' },
                { label: '桌型', value: `${selectedMode} 人局` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div className="text-[11px] tracking-[0.18em] text-white/38">{item.label}</div>
                  <div className="mt-3 text-lg font-medium text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#120d0f]/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[11px] tracking-[0.18em] text-white/38">本局队友</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {companionEnabled ? selectedAgent.name : '单排入局'}
              </div>
              <div className="mt-2 text-sm text-white/58">
                {companionEnabled
                  ? `${selectedAgent.name} 会跟你一起进房。`
                  : '这一局先不绑定队友。'}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={openTeammatePicker}
              className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            >
              <Users className="mr-2 h-4 w-4" />
              {companionEnabled ? '换队友' : '加个队友'}
            </Button>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#120d0f]/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-wrap gap-2">
            {([
              ['create', '创建房间'],
              ['join', '加入房间'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setEntryMode(value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  entryMode === value
                    ? 'border-[#f2875f]/40 bg-[#f2875f]/12 text-[#ffc0a8]'
                    : 'border-white/10 bg-white/[0.04] text-white/64 hover:bg-white/[0.08]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-white/58">你的昵称</label>
              <Input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="输入你的昵称"
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/28"
              />
            </div>

            {entryMode === 'create' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-white/58">房间名</label>
                  <Input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    placeholder="比如：深夜盘狼局"
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/28"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-white/58">桌型</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[6, 9, 12].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSelectedMode(count as 6 | 9 | 12)}
                        className={`rounded-[22px] border px-4 py-4 text-left transition ${
                          selectedMode === count
                            ? 'border-[#f2875f]/40 bg-[#f2875f]/12'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="text-2xl font-semibold text-white">{count}</div>
                        <div className="mt-2 text-xs tracking-[0.18em] text-white/42">
                          {count === 6 ? '快节奏' : count === 9 ? '标准局' : '满编局'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm text-white/58">房间号</label>
                <Input
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  placeholder="输入或粘贴房间号"
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/28"
                />
              </div>
            )}

            <Button
              onClick={entryMode === 'create' ? handleCreateRoom : handleJoinRoom}
              className="h-12 w-full rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
            >
              {entryMode === 'create' ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  创建并进入
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  加入房间
                </>
              )}
            </Button>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/60">
              {companionEnabled
                ? `${selectedAgent.name} 会跟着你进入这一局。`
                : '这一局会以单排模式进入。'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
