import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bot, Brain, Heart, Radio, Volume2, Zap } from 'lucide-react';
import { Progress } from '../ui/progress';
import { OpenLLMVTuberFrame } from '../live2d/OpenLLMVTuberFrame';
import { resolveRuntimeManifest } from '../../config/aiPlayerModels';

interface AIVtuberProps {
  player: {
    id: string;
    name: string;
    role?: string;
    avatar?: string;
    isAlive: boolean;
  } | null;
  status: 'idle' | 'speaking' | 'thinking' | 'dead' | 'listening';
  mood?: {
    emotion: string;
    intensity: number;
  };
  currentSpeech?: string;
  className?: string;
  useLive2D?: boolean;
  isUserCompanion?: boolean;
  modelName?: string;
  onSpeechComplete?: () => void;
  onVTuberReady?: () => void;
}

const THINKING_BUBBLES = [
  '分析局势中...',
  '计算胜率...',
  '回顾上一轮发言...',
  '检索狼人特征...',
  '构建逻辑链...',
];

const StaticAvatar: React.FC<{ player: { id: string; name: string; avatar?: string }; status: string }> = ({
  player,
  status,
}) => (
  <motion.div
    animate={{ scale: status === 'speaking' ? 1.02 : 1 }}
    transition={{ duration: 0.5 }}
    className="relative"
  >
    <div
      className={`relative h-56 w-56 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 transition-all duration-300 md:h-72 md:w-72 ${
        status === 'speaking'
          ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]'
          : status === 'thinking'
            ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
            : 'border-purple-400/50'
      }`}
    >
      <img
        src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}&backgroundColor=transparent`}
        alt={player.name}
        className="h-full w-full object-cover"
      />
    </div>
    {status === 'speaking' && (
      <div
        className="absolute inset-[-12px] animate-ping rounded-2xl border border-cyan-400/40"
        style={{ animationDuration: '2s' }}
      />
    )}
  </motion.div>
);

export const AIVtuberObserver = React.forwardRef<HTMLDivElement, AIVtuberProps>(
  (
    {
      player,
      status,
      mood = { emotion: 'calm', intensity: 50 },
      currentSpeech,
      className,
      useLive2D = true,
      isUserCompanion = false,
      modelName,
      onSpeechComplete,
      onVTuberReady,
    },
    ref,
  ) => {
    const [thinkingText, setThinkingText] = useState(THINKING_BUBBLES[0]);
    const [audioWaveHeights, setAudioWaveHeights] = useState<number[]>(Array.from({ length: 20 }, () => 20));

    const runtimeManifest = resolveRuntimeManifest(player?.name, isUserCompanion);
    const effectiveModelName = modelName || runtimeManifest.modelName;
    const shouldUseLive2D = useLive2D && runtimeManifest.runtimeType === 'live2d' && !!effectiveModelName;
    const vtuberMode = isUserCompanion ? 'dialogue' : 'tts';
    const isSpeaking = status === 'speaking';

    useEffect(() => {
      if (status !== 'thinking') return;

      const interval = setInterval(() => {
        setThinkingText(THINKING_BUBBLES[Math.floor(Math.random() * THINKING_BUBBLES.length)]);
      }, 2000);

      return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
      if (!isSpeaking) {
        setAudioWaveHeights(Array.from({ length: 20 }, () => 20));
        return;
      }

      const interval = setInterval(() => {
        setAudioWaveHeights(Array.from({ length: 20 }, () => Math.random() * 100));
      }, 100);

      return () => clearInterval(interval);
    }, [isSpeaking]);

    if (!player) {
      return (
        <div
          ref={ref}
          className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-purple-500/30 bg-slate-900/80 ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 to-indigo-950/30" />
          <div className="z-10 space-y-4 text-center">
            <div className="relative inline-block">
              <Bot className="h-20 w-20 text-purple-500/50" />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-yellow-500" />
            </div>
            <div className="text-sm tracking-widest text-purple-300">AWAITING CONNECTION...</div>
          </div>
        </div>
      );
    }

    const getEmotionStyle = (emotion: string) => {
      switch (emotion) {
        case 'panic':
          return { color: 'text-red-400', border: 'border-red-500/50' };
        case 'scheming':
          return { color: 'text-purple-400', border: 'border-purple-500/50' };
        case 'happy':
          return { color: 'text-pink-400', border: 'border-pink-500/50' };
        case 'calm':
        default:
          return { color: 'text-cyan-400', border: 'border-cyan-500/50' };
      }
    };

    const emotionStyle = getEmotionStyle(mood.emotion);

    return (
      <div ref={ref} className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}>
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute left-0 top-0 h-16 w-16 rounded-tl-xl border-l-2 border-t-2 border-cyan-400/70" />
          <div className="absolute right-0 top-0 h-16 w-16 rounded-tr-xl border-r-2 border-t-2 border-purple-400/70" />
          <div className="absolute bottom-0 left-0 h-16 w-16 rounded-bl-xl border-b-2 border-l-2 border-pink-400/70" />
          <div className="absolute bottom-0 right-0 h-16 w-16 rounded-br-xl border-b-2 border-r-2 border-cyan-400/70" />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-950/60 via-slate-900/80 to-indigo-950/60">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,255,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_2px] opacity-30" />
        </div>

        <div className="relative z-20 flex items-center justify-between bg-gradient-to-r from-black/60 via-transparent to-black/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                status === 'dead'
                  ? 'border border-gray-600/50 bg-gray-800/80 text-gray-400'
                  : status === 'speaking'
                    ? 'animate-pulse border border-red-400/50 bg-red-600/80 text-white'
                    : status === 'thinking'
                      ? 'border border-yellow-400/50 bg-yellow-600/80 text-white'
                      : 'border border-cyan-400/50 bg-cyan-600/60 text-white'
              }`}
            >
              {status === 'speaking' && <Radio className="h-3 w-3" />}
              {status === 'dead' ? 'OFFLINE' : status === 'speaking' ? 'ACTIVE' : status === 'thinking' ? 'THINKING' : 'READY'}
            </div>
            <div className="text-xs text-cyan-300/80">AI Companion Window</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${status === 'dead' ? 'bg-gray-500' : 'animate-pulse bg-green-400'}`} />
            <div className={`h-2 w-2 rounded-full ${status === 'speaking' ? 'animate-pulse bg-cyan-400' : 'bg-cyan-400/30'}`} />
          </div>
        </div>

        <div className="relative z-10 flex min-h-[280px] flex-1 items-center justify-center p-4">
          {status === 'dead' ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 grayscale">
                <span className="text-4xl">X</span>
              </div>
              <div className="text-xl text-slate-500">SIGNAL LOST</div>
            </div>
          ) : shouldUseLive2D ? (
            <div className="relative h-full min-h-[250px] w-full" style={{ minWidth: '250px' }}>
              <OpenLLMVTuberFrame
                baseUrl="http://127.0.0.1:12393"
                className="h-full w-full"
                mode={vtuberMode}
                ttsText={!isUserCompanion && status === 'speaking' ? currentSpeech : undefined}
                modelName={effectiveModelName}
                onReady={onVTuberReady}
                onSpeechEnd={onSpeechComplete}
                showControls={false}
              />
              {status === 'speaking' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 animate-ping rounded-full border border-cyan-400/30" style={{ animationDuration: '2s' }} />
                </div>
              )}
            </div>
          ) : (
            <StaticAvatar player={player} status={status} />
          )}

          <AnimatePresence>
            {status === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-4 top-4 z-30 rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-xs font-bold text-black shadow-xl"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 animate-pulse text-purple-600" />
                  <span>{thinkingText}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status === 'speaking' && currentSpeech && (
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-4 top-1/3 z-20 max-w-[180px]"
              >
                <div className="rounded-xl rounded-bl-sm border border-cyan-200 bg-white/95 p-3 text-slate-800 shadow-xl">
                  <div className="break-words text-sm font-medium leading-relaxed">
                    {currentSpeech.slice(0, 50)}
                    {currentSpeech.length > 50 ? '...' : ''}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-24 left-0 right-0 z-10 flex h-12 items-end justify-center gap-0.5 px-8">
          {audioWaveHeights.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-t transition-all duration-75 ${
                status === 'speaking' ? 'bg-gradient-to-t from-cyan-500 to-purple-400' : 'bg-gray-600/30'
              }`}
              style={{ height: `${Math.max(height * 0.4, 4)}%` }}
            />
          ))}
        </div>

        <div className="relative z-20 space-y-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-white drop-shadow-md">
                {player.name}
                {status === 'speaking' && <Volume2 className="h-5 w-5 animate-pulse text-cyan-400" />}
              </div>
              {player.role && (
                <div className="mt-0.5 flex items-center gap-1 text-xs uppercase text-purple-300">
                  <Zap className="h-3 w-3" />
                  ID: {player.id.slice(0, 8)}
                </div>
              )}
            </div>
            <div className={`flex flex-col items-end rounded-lg border bg-black/50 px-3 py-1.5 backdrop-blur ${emotionStyle.border}`}>
              <div className="text-[10px] uppercase text-gray-400">Mood</div>
              <div className={`flex items-center gap-1 text-sm font-bold uppercase ${emotionStyle.color}`}>
                {mood.emotion === 'happy' ? <Heart className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                {mood.emotion}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/45">
              <span>Emotion intensity</span>
              <span>{mood.intensity}%</span>
            </div>
            <Progress value={mood.intensity} className="h-1.5 bg-white/10" />
          </div>
        </div>
      </div>
    );
  },
);

AIVtuberObserver.displayName = 'AIVtuberObserver';
