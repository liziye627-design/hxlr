import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Send, Sparkles } from 'lucide-react';
import { AIVtuberObserver } from '@/components/werewolf/AIVtuberObserver';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { buildFaceToFaceReply, buildFaceToFaceStageCopy } from '@/config/faceToFaceChat';
import { getGameModeMeta } from '@/config/gameModes';
import { getPartnerAgentCopy } from '@/config/partnerHome';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

export default function Chat() {
  const navigate = useNavigate();
  const {
    selectedAgent,
    selectedAgentId,
    pendingMode,
    setCarryMode,
    clearPendingMode,
  } = useAgentSelection();
  const [draft, setDraft] = useState('');
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, ChatMessage[]>>({});
  const [stageStatus, setStageStatus] = useState<'idle' | 'speaking' | 'thinking' | 'listening'>('idle');
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);
  const speakingTimerRef = useRef<number | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const stageCopy = useMemo(() => buildFaceToFaceStageCopy(selectedAgent), [selectedAgent]);
  const localizedCopy = useMemo(() => getPartnerAgentCopy(selectedAgent), [selectedAgent]);
  const pendingModeMeta = pendingMode ? getGameModeMeta(pendingMode) : null;
  const selectedMessages = messagesByAgent[selectedAgentId] ?? [];

  const currentSpeech = useMemo(
    () =>
      [...selectedMessages].reverse().find((message) => message.role === 'assistant')?.content
      ?? localizedCopy.openingLine,
    [localizedCopy.openingLine, selectedMessages],
  );

  const clearStageTimers = () => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    if (speakingTimerRef.current) {
      window.clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
  };

  useEffect(() => {
    setMessagesByAgent((current) => {
      if (current[selectedAgent.id]?.length) {
        return current;
      }

      return {
        ...current,
        [selectedAgent.id]: [
          {
            id: `${selectedAgent.id}-opening-line`,
            role: 'assistant',
            content: localizedCopy.openingLine,
          },
        ],
      };
    });
  }, [localizedCopy.openingLine, selectedAgent.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selectedMessages]);

  useEffect(() => () => clearStageTimers(), []);

  useEffect(() => {
    if (stageStatus === 'thinking' || stageStatus === 'speaking') {
      return;
    }

    setStageStatus(draft.trim() ? 'listening' : 'idle');
  }, [draft, stageStatus]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;

    clearStageTimers();

    const userMessage: ChatMessage = {
      id: `${selectedAgentId}-user-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessagesByAgent((current) => ({
      ...current,
      [selectedAgentId]: [...(current[selectedAgentId] ?? []), userMessage],
    }));
    setDraft('');
    setStageStatus('thinking');

    thinkingTimerRef.current = window.setTimeout(() => {
      const assistantReply: ChatMessage = {
        id: `${selectedAgentId}-assistant-${Date.now() + 1}`,
        role: 'assistant',
        content: buildFaceToFaceReply(selectedAgent, content),
      };

      setMessagesByAgent((current) => ({
        ...current,
        [selectedAgentId]: [...(current[selectedAgentId] ?? []), assistantReply],
      }));
      setStageStatus('speaking');

      speakingTimerRef.current = window.setTimeout(() => {
        setStageStatus('idle');
      }, 1600);
    }, 320);
  };

  const handleEnterPendingMode = () => {
    if (!pendingModeMeta) return;

    setCarryMode(pendingModeMeta.id, 'with_agent');
    clearPendingMode();
    navigate(pendingModeMeta.path, {
      state: {
        carryMode: 'with_agent',
      },
    });
  };

  return (
    <div className="relative overflow-hidden px-4 pb-10 pt-6 md:px-8 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-2%] h-[32rem] w-[32rem] rounded-full bg-[#ff8b61]/10 blur-[130px]" />
        <div className="absolute right-[-10%] top-[14%] h-[28rem] w-[28rem] rounded-full bg-[#2e7e7a]/12 blur-[130px]" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-[#d7b56e]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-5">
        <section className="rounded-[30px] border border-white/10 bg-[#0b1012]/90 px-5 py-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.24em] text-white/56">
                <Sparkles className="h-3.5 w-3.5" />
                {stageCopy.badge}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  {stageCopy.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58 md:text-base">
                  {stageCopy.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {pendingModeMeta && (
                <Button
                  onClick={handleEnterPendingMode}
                  className="h-11 rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
                >
                  带 TA 进入 {pendingModeMeta.shortTitle}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/partner')}
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                {stageCopy.switchLabel}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/chat')}
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                换个队友
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="overflow-hidden rounded-[34px] border border-white/10 bg-[#0b1012]/92 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="border-b border-white/8 px-5 py-4 md:px-6">
              <div className="text-[11px] tracking-[0.22em] text-white/40">当前数字人</div>
              <div className="mt-3 flex items-center gap-4">
                <img
                  src={selectedAgent.previewImage}
                  alt={selectedAgent.name}
                  className="h-16 w-16 rounded-[20px] border border-white/10 object-cover object-top"
                />
                <div>
                  <div className="text-2xl font-semibold text-white">{selectedAgent.name}</div>
                  <div className="mt-1 text-sm text-white/54">{localizedCopy.title}</div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[560px] p-4 md:min-h-[700px] md:p-5">
              <div className="absolute inset-x-4 top-4 z-20 rounded-[22px] border border-white/10 bg-black/28 px-4 py-3 backdrop-blur md:inset-x-5">
                <div className="text-[11px] tracking-[0.18em] text-white/38">当前状态</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-base font-medium text-white">{localizedCopy.tagline}</div>
                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/62">
                    {stageStatus === 'thinking'
                      ? '思考中'
                      : stageStatus === 'speaking'
                        ? '回复中'
                        : stageStatus === 'listening'
                          ? '正在听你说'
                          : '等待你开口'}
                  </div>
                </div>
              </div>

              <div className="h-full overflow-hidden rounded-[28px] border border-white/8 bg-black/25">
                <AIVtuberObserver
                  player={{
                    id: selectedAgent.id,
                    name: selectedAgent.name,
                    avatar: selectedAgent.previewImage,
                    isAlive: true,
                  }}
                  status={stageStatus}
                  currentSpeech={currentSpeech}
                  mood={{
                    emotion:
                      stageStatus === 'speaking'
                        ? 'happy'
                        : stageStatus === 'thinking'
                          ? 'scheming'
                          : 'calm',
                    intensity: stageStatus === 'speaking' ? 82 : stageStatus === 'thinking' ? 68 : 42,
                  }}
                  className="min-h-[560px] md:min-h-[700px]"
                  isUserCompanion
                  modelName={selectedAgent.modelName}
                />
              </div>
            </div>
          </article>

          <article className="flex min-h-[560px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#0b1012]/92 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:min-h-[700px]">
            <div className="border-b border-white/8 px-5 py-4 md:px-6">
              <div className="text-[11px] tracking-[0.22em] text-white/40">{stageCopy.inputLabel}</div>
              <div className="mt-3 text-lg font-medium text-white">
                只保留数字人和对话框，其他说明都收起来。
              </div>
            </div>

            <div className="flex flex-1 flex-col px-5 pb-5 pt-4 md:px-6">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[86%] rounded-[24px] px-4 py-3 text-sm leading-7',
                        message.role === 'user'
                          ? 'bg-[#f2875f] text-white'
                          : 'border border-white/8 bg-white/[0.04] text-white/82',
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {stageCopy.quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setDraft(prompt);
                        composerRef.current?.focus();
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/62 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="rounded-[28px] border border-white/8 bg-black/18 p-3">
                  <Textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={stageCopy.placeholder}
                    className="min-h-[130px] resize-none rounded-[22px] border-white/10 bg-white/[0.04] px-4 py-4 text-base leading-7 text-white placeholder:text-white/28"
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-white/40">
                      当前数字人会直接按面对面聊天的节奏回应你。
                    </div>
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="h-12 rounded-2xl bg-[#f2875f] px-5 text-white hover:bg-[#ff946f]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      发送
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
