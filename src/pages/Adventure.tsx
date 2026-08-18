import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Compass, Copy, FolderOpen, Loader2, Play, RefreshCcw, Users, Wrench } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/game/ChatInterface';
import { findAgentShowcase, toAICompanion } from '@/config/agentRoster';
import type { CompanionCarryMode } from '@/config/gameModes';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { useUser } from '@/contexts/UserContext';
import { gameApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/services/ai';
import {
  minecraftBootstrapApi,
  type MinecraftBootstrapStatus,
} from '@/services/minecraftBootstrap';
import type { AICompanion, ChatMessage } from '@/types';

type AdventureLocationState = {
  carryMode?: CompanionCarryMode;
};

const SOLO_NARRATOR: AICompanion = {
  id: 'minecraft-narrator',
  name: '旁白',
  type: 'shadow',
  description: '单人 Minecraft 模式下的中立向导。',
  avatar_url: '/agent-gallery/ren.png',
  personality: {
    traits: ['calm', 'narrative', 'observant'],
    style: 'Narrator',
  },
  skills: {
    strengths: ['scene setup', 'branching choices', 'atmosphere'],
    weakness: 'Not tied to a specific teammate personality.',
  },
  unlock_level: 1,
  created_at: '2026-03-15T00:00:00.000Z',
};

const SCENE_SHOWCASE = [
  {
    title: 'Overworld',
    subtitle: '建家 / 探洞 / 资源起手',
    image: '/images/minecraft/mc-overworld-block-breaking.jpg',
    className: 'md:row-span-2',
  },
  {
    title: 'Nether',
    subtitle: '推进地狱线',
    image: '/images/minecraft/mc-nether.png',
    className: '',
  },
  {
    title: 'End',
    subtitle: '远征终局',
    image: '/images/minecraft/mc-end.png',
    className: '',
  },
] as const;

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'minecraft_backend_failed';
}

function getBootstrapReadiness(status: MinecraftBootstrapStatus | null) {
  const prerequisites = status?.recommendation.prerequisites;
  if (!prerequisites) return false;

  return (
    prerequisites.pclExecutableReady &&
    prerequisites.gameRootReady &&
    prerequisites.versionReady &&
    prerequisites.modsDirPinned &&
    prerequisites.modManifestExists &&
    prerequisites.mindcraftRootExists &&
    prerequisites.mindcraftDependenciesInstalled &&
    prerequisites.mindcraftKeysConfigured &&
    prerequisites.botProfilesReady
  );
}

export default function Adventure() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const { selectedAgent, carryModes, setPendingMode } = useAgentSelection();

  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<MinecraftBootstrapStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [launcherStarted, setLauncherStarted] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendNote, setBackendNote] = useState<string | null>(null);
  const [setupAction, setSetupAction] = useState<'init' | 'prepare' | 'folder' | null>(null);

  const carryMode =
    (location.state as AdventureLocationState | null)?.carryMode ?? carryModes.adventure ?? 'with_agent';
  const selectedCompanion = useMemo(
    () => (carryMode === 'with_agent' ? toAICompanion(selectedAgent) : null),
    [carryMode, selectedAgent],
  );

  const backendProfileId = bootstrapStatus?.config?.defaultProfiles?.[0] ?? 'ren';
  const backendAgent = useMemo(
    () => findAgentShowcase(backendProfileId) ?? findAgentShowcase('ren'),
    [backendProfileId],
  );
  const backendCompanion = backendAgent ? toAICompanion(backendAgent) : null;
  const runtimeCompanion = carryMode === 'with_agent' ? backendCompanion ?? selectedCompanion : null;
  const activeCompanion = runtimeCompanion ?? SOLO_NARRATOR;
  const readinessOk = getBootstrapReadiness(bootstrapStatus);
  const serverPort = bootstrapStatus?.config?.serverPort ?? 55916;
  const selectedNeedsFallback = carryMode === 'with_agent' && Boolean(selectedCompanion) && selectedAgent.id !== backendProfileId;
  const modsDir = bootstrapStatus?.managedMods.modsDir ?? bootstrapStatus?.config?.instanceModsDir ?? null;
  const managedMods = bootstrapStatus?.managedMods.items ?? [];
  const hasManagedMods = (bootstrapStatus?.managedMods.configuredModsCount ?? 0) > 0;
  const missingRequiredMods = managedMods.filter((mod) => mod.required && !mod.targetExists);
  const setupSteps = [
    {
      title: '检测 PCL 环境',
      description: bootstrapStatus?.recommendation.prerequisites.pclExecutableReady
        ? '已找到本机 PCL 和目标实例。'
        : '先安装并启动一次官方 PCL，让本地生成可识别的 .minecraft 与版本目录。',
    },
    {
      title: '准备模组目录',
      description: modsDir
        ? hasManagedMods
          ? missingRequiredMods.length > 0
            ? '存在缺失模组，先自动同步或手动补齐。'
            : '模组状态已就绪，可以直接进入下一步。'
          : '当前还没有托管模组条目。你可以先打开 mods 文件夹手动加入 jar。'
        : '先完成本地配置生成，然后再创建并固定 mods 目录。',
    },
    {
      title: '启动陪玩',
      description:
        carryMode === 'with_agent'
          ? '环境就绪后，一键启动 Minecraft，再接入陪玩角色。'
          : '环境就绪后，可直接进入 Minecraft 并记录过程。',
    },
  ];

  const loadBootstrapStatus = async () => {
    setIsStatusLoading(true);
    setStatusError(null);

    try {
      const status = await minecraftBootstrapApi.getStatus();
      setBootstrapStatus(status);
    } catch (error) {
      setStatusError(stringifyError(error));
    } finally {
      setIsStatusLoading(false);
    }
  };

  useEffect(() => {
    void loadBootstrapStatus();
  }, []);

  const handleInitConfig = async () => {
    setSetupAction('init');
    try {
      await minecraftBootstrapApi.initConfig();
      await loadBootstrapStatus();
      toast({
        title: '本地配置已生成',
        description: '已经生成 minecraft.local.json，可以继续准备环境。',
      });
    } catch (error) {
      toast({
        title: '生成配置失败',
        description: stringifyError(error),
        variant: 'destructive',
      });
    } finally {
      setSetupAction(null);
    }
  };

  const handlePrepareEnvironment = async () => {
    setSetupAction('prepare');
    try {
      const result = await minecraftBootstrapApi.prepare();
      await loadBootstrapStatus();
      toast({
        title: '环境已准备',
        description: result.modsDirExists
          ? 'mods 目录已固定，可以继续检查模组和 Mindcraft。'
          : '已生成本地环境配置。',
      });
    } catch (error) {
      toast({
        title: '准备环境失败',
        description: stringifyError(error),
        variant: 'destructive',
      });
    } finally {
      setSetupAction(null);
    }
  };

  const handleOpenModsFolder = async () => {
    setSetupAction('folder');
    try {
      const result = await minecraftBootstrapApi.openModsFolder();
      toast({
        title: '已打开 mods 文件夹',
        description: result.modsDir,
      });
    } catch (error) {
      toast({
        title: '打开 mods 文件夹失败',
        description: stringifyError(error),
        variant: 'destructive',
      });
    } finally {
      setSetupAction(null);
    }
  };

  const handleCopyModsPath = async () => {
    if (!modsDir) return;

    try {
      await navigator.clipboard.writeText(modsDir);
      toast({
        title: 'mods 路径已复制',
        description: modsDir,
      });
    } catch (error) {
      toast({
        title: '复制路径失败',
        description: stringifyError(error),
        variant: 'destructive',
      });
    }
  };

  const openTeammatePicker = () => {
    setPendingMode('adventure');
    navigate('/chat');
  };

  const createSessionIfPossible = async (companion: AICompanion | null) => {
    if (!user) {
      return null;
    }

    try {
      return await gameApi.createSession({
        game_type: 'adventure',
        mode: 'solo',
        host_user_id: user.id,
        status: 'playing',
        players: [{ id: user.id, nickname: user.nickname }],
        ai_companions: companion ? [{ id: companion.id, name: companion.name }] : [],
        game_data: {
          minecraft: {
            launcherStarted,
            backendConnected,
            backendProfileId: companion?.id ?? null,
            serverPort,
          },
        },
        started_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to create Minecraft session:', error);
      toast({
        title: '已连接后端，但房间记录失败',
        description: '本次不会记入你的游戏历史。',
      });
      return null;
    }
  };

  const enterControlPanel = async (companion: AICompanion | null, content: string) => {
    await createSessionIfPossible(companion);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        companion: companion ?? undefined,
      },
    ]);
    setGameStarted(true);
  };

  const handlePrimaryAction = async () => {
    if (isBootstrapping) return;

    if (statusError) {
      toast({
        title: 'Minecraft 后端不可用',
        description: '请先启动本地 3001 game server。',
        variant: 'destructive',
      });
      return;
    }

    if (!bootstrapStatus) {
      await loadBootstrapStatus();
      return;
    }

    if (!readinessOk) {
      toast({
        title: '启动前置条件不完整',
        description: '先把 PCL、Mindcraft 和本地配置补齐。',
        variant: 'destructive',
      });
      return;
    }

    setIsBootstrapping(true);

    try {
      if (!launcherStarted) {
        await minecraftBootstrapApi.launch({
          skipBots: true,
        });
        setLauncherStarted(true);

        if (carryMode === 'solo') {
          setBackendNote('PCL 已启动。你现在可以直接进入世界，底部面板会跟着记录你的过程。');
          await enterControlPanel(
            null,
            `Minecraft 已启动。你现在可以先进世界操作，关键节点会按端口 ${serverPort} 的本地链路继续记录。`,
          );
        } else {
          const launchName = backendCompanion?.name ?? 'Ren';
          setBackendNote(`PCL 已启动。进入你的世界后，请打开局域网并使用端口 ${serverPort}，然后再点一次“接入 ${launchName}”。`);
          toast({
            title: 'Minecraft 已启动',
            description: `下一步是在游戏里打开局域网端口 ${serverPort}。`,
          });
        }

        return;
      }

      if (carryMode === 'with_agent') {
        const launchName = backendCompanion?.name ?? 'Ren';

        if (selectedNeedsFallback) {
          toast({
            title: `当前已接入的 Minecraft 角色是 ${launchName}`,
            description: `${selectedAgent.name} 还没有真实 bot profile，这次会先用 ${launchName} 接入后端。`,
          });
        }

        await minecraftBootstrapApi.bootstrap({
          skipLauncher: true,
          profiles: backendCompanion ? [backendCompanion.id] : undefined,
        });

        setBackendConnected(true);
        setBackendNote(`${launchName} 已开始接入后端。如果游戏里暂时没看到角色，请先确认局域网端口 ${serverPort} 已打开。`);
        await enterControlPanel(
          backendCompanion,
          `${launchName} 已向本地 Minecraft 后端发起连接。先告诉我今天想挖什么、建什么，或者要不要先去找村庄。`,
        );
        return;
      }

      await enterControlPanel(
        null,
        'Minecraft 已启动。你可以一边在世界里操作，一边用底部面板记录过程、拆解目标和复盘关键节点。',
      );
    } catch (error) {
      const message = stringifyError(error);
      setBackendNote(message);
      toast({
        title: 'Minecraft 启动失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const storyContext = messages.map((message) => `${message.role}: ${message.content}`).join('\n');
      const response = await aiService.adventureNarration(storyContext, content, activeCompanion);

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        companion: runtimeCompanion ?? undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast({
        title: '回复失败',
        description: '请再试一次。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startupChips = [
    {
      label: 'PCL',
      value: bootstrapStatus?.recommendation.prerequisites.pclExecutableReady ? 'Detected' : 'Missing',
    },
    {
      label: 'Mods',
      value: hasManagedMods ? (missingRequiredMods.length > 0 ? 'Incomplete' : 'Ready') : 'Manual',
    },
    {
      label: 'Mindcraft',
      value:
        bootstrapStatus?.recommendation.prerequisites.mindcraftDependenciesInstalled &&
        bootstrapStatus?.recommendation.prerequisites.mindcraftKeysConfigured
          ? 'Ready'
          : 'Missing',
    },
  ];

  const primaryActionLabel = isBootstrapping
    ? '正在启动...'
    : !launcherStarted
      ? '启动 Minecraft'
      : carryMode === 'with_agent'
        ? `世界已开 LAN，接入 ${backendCompanion?.name ?? 'Ren'}`
        : '进入 Minecraft 面板';

  if (!gameStarted) {
    return (
      <div className="relative overflow-hidden px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-12%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-[#79c36f]/10 blur-[140px]" />
          <div className="absolute right-[-8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-[#f28b39]/10 blur-[140px]" />
        </div>

        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-5">
          <Button
            variant="outline"
            onClick={() => navigate('/play')}
            className="h-11 w-fit rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回模式
          </Button>

          <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[#0b100f]/88 p-4 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-6">
            <div className="grid gap-5 xl:grid-cols-[1.25fr_0.88fr]">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:grid-rows-[220px_220px]">
                {SCENE_SHOWCASE.map((scene) => (
                  <article
                    key={scene.title}
                    className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-black/30 ${scene.className}`}
                  >
                    <img
                      src={scene.image}
                      alt={scene.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="text-[11px] uppercase tracking-[0.28em] text-white/55">{scene.title}</div>
                      <div className="mt-2 text-lg font-semibold text-white md:text-2xl">{scene.subtitle}</div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex h-full flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)] md:p-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.22em] text-white/58">
                  <Compass className="h-3.5 w-3.5" />
                  Minecraft Backend
                </div>

                <div className="mt-4 space-y-3">
                  <h1 className="max-w-[12ch] text-3xl font-semibold tracking-tight text-white md:text-5xl">
                    真正启动你的 MC 世界
                  </h1>
                  <p className="max-w-[34ch] text-sm leading-6 text-white/64 md:text-[15px]">
                    这次不是前端假动作。按钮会直接打到本地 3001 后端，启动 PCL，并在你开好局域网后接入陪玩。
                  </p>
                </div>

                <div className="mt-6 rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={activeCompanion.avatar_url || '/agent-gallery/ren.png'}
                      alt={activeCompanion.name}
                      className="h-16 w-16 rounded-[20px] border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">当前后端角色</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{activeCompanion.name}</div>
                      <div className="mt-2 text-sm leading-6 text-white/58">
                        {carryMode === 'with_agent'
                          ? selectedNeedsFallback
                            ? `${selectedAgent.name} 还没有真实 bot profile，这次会先用 ${activeCompanion.name} 接入 Minecraft。`
                            : `${activeCompanion.name} 会按真实 Mindcraft profile 接入本地世界。`
                          : '当前以单人模式启动，底部面板只做过程记录和策略协助。'}
                      </div>
                    </div>
                  </div>
                </div>

                {statusError ? (
                  <div className="mt-4 rounded-[22px] border border-[#f2875f]/25 bg-[#f2875f]/10 px-4 py-3 text-sm leading-6 text-[#ffd8c9]">
                    无法连接本地 Minecraft backend: {statusError}
                  </div>
                ) : null}

                {backendNote ? (
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/70">
                    {backendNote}
                  </div>
                ) : null}

                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Setup guide</div>
                      <div className="mt-1 text-sm text-white/72">先检测本地 PCL，再准备 mods 和陪玩运行环境。</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/68">
                      Port {serverPort}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {setupSteps.map((step, index) => (
                      <div key={step.title} className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="text-sm font-medium text-white">{step.title}</div>
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/58">{step.description}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleInitConfig}
                      disabled={setupAction !== null}
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    >
                      {setupAction === 'init' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                      生成本地配置
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrepareEnvironment}
                      disabled={setupAction !== null}
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    >
                      {setupAction === 'prepare' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      准备环境
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenModsFolder}
                      disabled={setupAction !== null || !modsDir}
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    >
                      {setupAction === 'folder' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                      打开 mods 文件夹
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCopyModsPath}
                      disabled={!modsDir}
                      className="h-11 rounded-2xl text-white/72 hover:bg-white/[0.04] hover:text-white"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      复制 mods 路径
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Mod status</div>
                  <div className="mt-2 text-sm leading-6 text-white/58">
                    {modsDir ? `当前固定目录: ${modsDir}` : '还没有解析到稳定的 mods 目录。'}
                  </div>

                  {hasManagedMods ? (
                    <div className="mt-4 space-y-2">
                      {managedMods.map((mod) => (
                        <div
                          key={mod.id}
                          className="flex items-start justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white">{mod.targetFileName}</div>
                            <div className="mt-1 text-xs leading-5 text-white/50">{mod.targetPath}</div>
                          </div>
                          <div className={`shrink-0 rounded-full px-3 py-1 text-xs ${mod.targetExists ? 'bg-[#74b35f]/15 text-[#bde5a9]' : 'bg-[#f2875f]/15 text-[#ffd2bf]'}`}>
                            {mod.targetExists ? '已安装' : mod.required ? '缺失' : '可选'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/58">
                      当前还没有配置托管模组清单。你可以先手动把需要的 jar 放进上面的 mods 文件夹，后续再把 mod 写入 manifest 做自动同步。
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col">
                  <Button
                    size="lg"
                    onClick={handlePrimaryAction}
                    disabled={isBootstrapping || isStatusLoading || !bootstrapStatus}
                    className="h-14 flex-1 rounded-[26px] bg-[#74b35f] text-base font-semibold text-white hover:bg-[#84c46e] disabled:opacity-60"
                  >
                    {isBootstrapping ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5" />
                    )}
                    {primaryActionLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openTeammatePicker}
                    className="h-14 flex-1 rounded-[26px] border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    挑个陪玩
                  </Button>
                </div>

                <div className="mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void loadBootstrapStatus()}
                    disabled={isStatusLoading}
                    className="h-10 rounded-2xl px-0 text-white/56 hover:bg-transparent hover:text-white"
                  >
                    {isStatusLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    刷新后端状态
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {startupChips.map((chip) => (
                    <div
                      key={chip.label}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/34">{chip.label}</div>
                      <div className="mt-1 text-sm font-medium text-white/78">{chip.value}</div>
                    </div>
                  ))}
                </div>

                {!readinessOk && bootstrapStatus ? (
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/60">
                    当前前置条件还没全绿。先补齐 PCL、mods、Mindcraft 依赖和 keys。
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <p className="px-1 text-[11px] tracking-[0.08em] text-white/28">
            Scene imagery sourced from Wikimedia Commons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setGameStarted(false)} className="hover:bg-primary/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回 Minecraft 启动台
              </Button>
              <span className="hidden text-lg font-medium text-white sm:inline-block">Minecraft 面板</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5">
              <div className="relative">
                <img
                  src={activeCompanion.avatar_url || ''}
                  alt={activeCompanion.name}
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">{activeCompanion.name}</span>
                <span className="mt-1 text-[10px] leading-none text-muted-foreground">
                  {backendConnected ? '已接真实后端' : carryMode === 'with_agent' ? '待接后端' : '记录模式'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex max-w-5xl flex-1 px-4 py-4 md:py-6">
        <div className="flex h-[calc(100vh-140px)] w-full flex-col gap-3">
          {backendNote ? (
            <div className="rounded-2xl border border-white/8 bg-card/40 px-4 py-3 text-sm leading-6 text-white/68">
              {backendNote}
            </div>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-card/30 shadow-2xl backdrop-blur-sm">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              companion={runtimeCompanion || undefined}
              isLoading={isLoading}
              placeholder={`告诉 ${activeCompanion.name} 你下一步想做什么...`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
