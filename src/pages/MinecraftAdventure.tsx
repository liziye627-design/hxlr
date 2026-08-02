/**
 * Minecraft 数字人冒险页面
 * 使用融合服务实现 AI 陪玩
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Compass,
  Loader2,
  RefreshCcw,
  Settings,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MinecraftAgentCard, TaskPanel } from '@/components/minecraft';
import { ChatInterface } from '@/components/game/ChatInterface';
import {
  getMinecraftAgents,
  initializeService,
  startAgent,
  stopAgent,
  sendAgentMessage,
  executeAgentTask,
  getServiceStatus,
  type MinecraftAgentSummary,
} from '@/services/minecraftApi';
import { useToast } from '@/hooks/use-toast';
import type { Task, ChatMessage } from '@/types';

const SCENE_IMAGES = [
  { title: '主世界', subtitle: '建家 / 探洞 / 资源起手', image: '/images/minecraft/mc-overworld-block-breaking.jpg' },
  { title: '下界', subtitle: '推进地狱线', image: '/images/minecraft/mc-nether.png' },
  { title: '末地', subtitle: '远征终局', image: '/images/minecraft/mc-end.png' },
];

export default function MinecraftAdventure() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [agents, setAgents] = useState<MinecraftAgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [serviceStatus, setServiceStatus] = useState<{
    initialized: boolean;
    mindcraftInstalled: boolean;
    figuraInstalled: boolean;
  } | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsData, status] = await Promise.all([
        getMinecraftAgents(),
        getServiceStatus().catch(() => null),
      ]);
      setAgents(agentsData);
      setServiceStatus(status);

      // 默认选择第一个角色
      if (agentsData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: '加载失败',
        description: '无法获取角色数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId, toast]);

  useEffect(() => {
    void loadData();
  }, []);

  // 初始化服务
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const result = await initializeService();
      if (result.success) {
        toast({
          title: '服务已初始化',
          description: 'Mindcraft 和 Figura 已就绪',
        });
      } else {
        toast({
          title: '初始化警告',
          description: result.errors.join(', '),
          variant: 'destructive',
        });
      }
      await loadData();
    } catch (error) {
      toast({
        title: '初始化失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  };

  // 启动角色
  const handleStartAgent = async (agentId: string) => {
    try {
      const result = await startAgent(agentId);
      if (result.success) {
        setActiveAgentId(agentId);
        setSelectedAgentId(agentId);
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `你好！我是 ${agents.find((a) => a.id === agentId)?.name}。准备好开始冒险了吗？`,
            timestamp: new Date().toISOString(),
          },
        ]);
        toast({
          title: '角色已启动',
          description: `${agents.find((a) => a.id === agentId)?.name} 已加入游戏`,
        });
      } else {
        toast({
          title: '启动失败',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '启动失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 停止角色
  const handleStopAgent = async (agentId: string) => {
    try {
      const result = await stopAgent(agentId);
      if (result.success) {
        setActiveAgentId(null);
        toast({
          title: '角色已停止',
        });
      }
    } catch (error) {
      toast({
        title: '停止失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 发送消息
  const handleSendMessage = async (content: string) => {
    if (!activeAgentId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await sendAgentMessage(activeAgentId, content);
      if (result.success && result.response) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      toast({
        title: '发送失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 执行任务
  const handleExecuteTask = async (task: {
    type: 'mine' | 'build' | 'fight' | 'follow' | 'collect' | 'explore';
    target?: string;
    quantity?: number;
  }): Promise<Task> => {
    if (!activeAgentId) {
      throw new Error('没有活跃的角色');
    }

    return executeAgentTask(activeAgentId, task);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-[#79c36f]/10 blur-[140px]" />
        <div className="absolute right-[-8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-[#f28b39]/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/play')}
            className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回模式
          </Button>

          <div className="flex items-center gap-3">
            {serviceStatus?.initialized ? (
              <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
                <Wifi className="h-3.5 w-3.5" />
                服务已连接
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
                <WifiOff className="h-3.5 w-3.5" />
                服务未连接
              </div>
            )}

            <Button
              variant="ghost"
              onClick={loadData}
              disabled={loading}
              className="h-10 rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* 左侧：角色选择 */}
          <div>
            <section className="rounded-[36px] border border-white/10 bg-[#0b100f]/88 p-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.22em] text-white/58">
                    <Compass className="h-3.5 w-3.5" />
                    Minecraft 陪玩
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    选择你的冒险伙伴
                  </h1>
                  <p className="mt-2 text-sm text-white/58">
                    每个角色都有独特的能力和性格，选择最适合你的搭档
                  </p>
                </div>

                {!serviceStatus?.initialized && (
                  <Button
                    onClick={handleInitialize}
                    disabled={initializing}
                    className="h-11 rounded-xl bg-[#4ecdc4] text-white hover:bg-[#5fe0d6]"
                  >
                    {initializing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    初始化服务
                  </Button>
                )}
              </div>

              {/* 角色网格 */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <MinecraftAgentCard
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedAgentId}
                    active={agent.id === activeAgentId}
                    onSelect={setSelectedAgentId}
                    onStart={handleStartAgent}
                    onStop={handleStopAgent}
                    loading={loading}
                  />
                ))}
              </div>
            </section>

            {/* 场景展示 */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {SCENE_IMAGES.map((scene) => (
                <div
                  key={scene.title}
                  className="group relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                >
                  <img
                    src={scene.image}
                    alt={scene.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/55">
                      {scene.title}
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">{scene.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：聊天和任务面板 */}
          {activeAgent ? (
            <div className="space-y-4">
              {/* 角色信息 */}
              <div className="rounded-[28px] border border-white/10 bg-[#0d1215]/92 p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={activeAgent.previewImage}
                    alt={activeAgent.name}
                    className="h-14 w-14 rounded-xl border border-white/10 object-cover"
                  />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#4ecdc4]">
                      {activeAgent.title}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{activeAgent.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                      <Users className="h-3 w-3" />
                      正在游戏中
                    </div>
                  </div>
                </div>
              </div>

              {/* 任务面板 */}
              <TaskPanel
                agentId={activeAgent.id}
                agentName={activeAgent.name}
                onExecuteTask={handleExecuteTask}
              />

              {/* 聊天界面 */}
              <div className="rounded-[28px] border border-white/10 bg-[#0d1215]/92 p-4">
                <div className="mb-3 text-sm font-medium text-white">聊天</div>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={false}
                  placeholder={`和 ${activeAgent.name} 对话...`}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-[500px] flex-col items-center justify-center rounded-[36px] border border-white/10 bg-[#0b100f]/88 p-6">
              <div className="mb-4 rounded-full border border-white/10 bg-white/5 p-6">
                <Users className="h-10 w-10 text-white/30" />
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-white">选择一个角色开始冒险</div>
                <div className="mt-2 text-sm text-white/50">
                  点击角色卡片的"开始冒险"按钮
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}