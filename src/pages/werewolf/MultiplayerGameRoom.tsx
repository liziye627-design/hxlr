import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameSocket } from '../../hooks/useGameSocket';
import { PhaseIndicator } from '../../components/werewolf/PhaseIndicator';
import { RoundTableView } from '../../components/werewolf/RoundTableView';
import { NightActionPanel } from '../../components/werewolf/NightActionPanel';
import { AIFillingAnimation } from '../../components/werewolf/AIFillingAnimation';
import { RoleCardReveal } from '../../components/werewolf/RoleCardReveal';
import { PhaseTransition } from '../../components/werewolf/PhaseTransition';
import { SheriffElectionPanel } from '../../components/werewolf/SheriffElectionPanel';
import { HostControlPanel } from '../../components/werewolf/HostControlPanel';
import { SubtitleOverlay } from '../../components/werewolf/SubtitleOverlay';
import { VoiceSettingsDialog } from '../../components/werewolf/VoiceSettingsDialog';
import { tts } from '../../services/TTSService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import type { Room, SeerCheckResult } from './types';
import { Users, Play, LogOut, Bot, Volume2, VolumeX, Mic, MicOff, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { AIVtuberObserver } from '../../components/werewolf/AIVtuberObserver';
import { stt } from '../../services/STTService';
import { useToast } from '../../hooks/use-toast';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { usePlayerSpeeches } from '../../hooks/usePlayerSpeeches';

export default function MultiplayerGameRoom() {
  const location = useLocation();
  const {
    connected,
    roomState,
    chatMessages,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendNightAction,
    sendVote,
    sendChat,
    sendSpeechEnd,
    getRooms,
    sendHunterShoot,
    sendBadgeTransfer,
    activeSpeakerId,
    speakerRemainingSeconds,
    aiThinkingIds,
    speakerOrderIndex,
    speakerOrderTotal,
    nightHintTargetId,
    nightHintInfo,
    // Sheriff Election
    sheriffCandidates,
    applySheriff,
    voteSheriff,
    // Host Controls
    isPaused,
    hostPause,
    hostResume,
    hostForceSkip,
    debugRestore,
  } = useGameSocket();

  const { toast } = useToast();
  const { playSound, toggleMute } = useSoundEffects();
  const { activeSpeeches } = usePlayerSpeeches();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const vtuberPanelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'lobby' | 'create' | 'join' | 'game'>('lobby');
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState<6 | 9 | 12>(6);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [isFillingAI, setIsFillingAI] = useState(false);
  const [aiFilledCount, setAiFilledCount] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [hasShownRoleCard, setHasShownRoleCard] = useState(false);
  const [narratorMessage, setNarratorMessage] = useState('');
  const [showNarrator, setShowNarrator] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsSpeakingPlayerId, setTtsSpeakingPlayerId] = useState<string | null>(null);
  const ttsPendingCountsRef = useRef<Record<string, number>>({});
  const [isRecording, setIsRecording] = useState(false);
  const sttSupported = typeof window !== 'undefined' && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
  const [latestSpeeches, setLatestSpeeches] = useState<Record<string, string>>({});
  const [chatFilter, setChatFilter] = useState<'all' | 'speech' | 'system' | 'wolf'>('all');
  const [isHostPanelOpen, setIsHostPanelOpen] = useState(false);
  const fallbackMessages = useMemo(() => {
    if (!roomState) return [] as Array<{ id: string; senderId: string; senderName: string; content: string; type?: 'speech' | 'chat' | 'system' }>;
    const logs = (roomState.gameLog || []).filter(l => l.event === 'speech' && l.details?.content)
    const speechMsgs = logs.slice(-60).map((l, idx) => ({
      id: `${l.timestamp}_${idx}`,
      senderId: String((l.details as any)?.senderId || ''),
      senderName: String((l.details as any)?.senderName || '玩家'),
      content: String((l.details as any)?.content || ''),
      type: 'speech' as const,
    }))
    const isWolfNight = roomState.phase === 'NIGHT' && roomState.myRole === 'werewolf'
    const wolfMsgs = isWolfNight && Array.isArray((roomState as any).wolfChats)
      ? (roomState as any).wolfChats.slice(-40).map((m: any, idx: number) => ({
        id: `wolf_${m.timestamp}_${idx}`,
        senderId: m.senderId,
        senderName: roomState.players.find(p => p.id === m.senderId)?.name || '狼人',
        content: m.content,
        type: 'chat' as const,
      }))
      : []
    return [...speechMsgs, ...wolfMsgs]
  }, [roomState?.gameLog])
  const seerHistory = useMemo((): SeerCheckResult[] => {
    if (!roomState) return []
    return deriveSeerChecks(roomState) as SeerCheckResult[]
  }, [roomState?.gameLog])

  // 从 Lobby 传递的配置
  const lobbyConfig = location.state as {
    mode?: 6 | 9 | 12;
    aiPersonas?: string[];
    autoStart?: boolean;
  } | null;

  // 监听阶段变化并播放音效和旁白
  useEffect(() => {
    if (!roomState) return;
    if (prevPhaseRef.current === roomState.phase) return;
    prevPhaseRef.current = roomState.phase;

    let message = '';
    // 播放阶段转换音效
    if (roomState.phase === 'NIGHT') {
      playSound('night-transition');
      message = '天黑请闭眼，狼人请睁眼...';
    } else if (roomState.phase === 'DAY_DISCUSS') {
      playSound('day-transition');
      message = '天亮了，现在开始讨论...';
    } else if (roomState.phase === 'DAY_MORNING_RESULT') {
      playSound('day-transition');
      message = '天亮了，昨晚...';
    } else if (roomState.phase === 'GAME_OVER') {
      playSound('game-end');
      message = '游戏结束';
    } else if (roomState.phase === 'DAY_VOTE') {
      message = '现在开始投票...';
    } else if (roomState.phase === 'HUNTER_SHOOT') {
      message = '猎人请发动技能...';
    } else if (roomState.phase === 'DAY_DEATH_LAST_WORDS') {
      message = '请发表遗言...';
    }

    if (message) {
      setNarratorMessage(message);
      setShowNarrator(true);
    }
  }, [roomState?.phase, playSound]);

  // 处理从Lobby传来的配置
  useEffect(() => {
    if (lobbyConfig && connected && !roomState) {
      // 自动设置配置
      setPlayerCount(lobbyConfig.mode || 6);
      setPlayerName('玩家1');
      setRoomName(`${lobbyConfig.mode}人局 - ${Date.now()}`);

      // 自动创建房间并补位AI
      autoCreateAndFillAI();
    }
  }, [lobbyConfig, connected, roomState]);

  // Listen to chat messages and show speech bubbles
  // 仅在右侧滚动框显示发言，移除圆桌头像气泡，避免界面冗杂
  useEffect(() => {
    if (chatMessages.length > 0 && roomState) {
      const latestMessage = chatMessages[chatMessages.length - 1];
      if (latestMessage.type === 'speech') {
        if (latestMessage.senderId) {
          setLatestSpeeches(prev => ({ ...prev, [latestMessage.senderId]: latestMessage.content }));
        }
        if (ttsEnabled && latestMessage.id !== lastSpokenMessageIdRef.current) {
          lastSpokenMessageIdRef.current = latestMessage.id;
          const role = roomState.players.find(p => p.id === latestMessage.senderId)?.role || 'villager'
          tts.speak(latestMessage.content, latestMessage.senderId, { role });
        }
      }
    }
  }, [chatMessages, roomState, ttsEnabled]);

  // 自动滚动到日志底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [chatMessages]);

  // Show role card when role is assigned
  useEffect(() => {
    if (roomState?.myRole && !hasShownRoleCard && roomState.phase !== 'WAITING') {
      setShowRoleCard(true);
      setHasShownRoleCard(true);
      playSound('game-start');
    }
  }, [roomState?.myRole, roomState?.phase, hasShownRoleCard, playSound]);

  useEffect(() => {
    if (connected && view === 'lobby') {
      loadRooms();
    }
  }, [connected, view]);

  const loadRooms = async () => {
    try {
      const rooms = await getRooms();
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName || !playerName) {
      toast({
        title: '错误',
        description: '请填写房间名和玩家名',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { roomId, playerId } = await createRoom(roomName, playerName, playerCount);
      setCurrentPlayerId(playerId);
      setView('game');
      toast({
        title: '房间已创建',
        description: `房间 ID: ${roomId}`,
      });
    } catch (error: any) {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!playerName) {
      toast({
        title: '错误',
        description: '请填写玩家名',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { playerId } = await joinRoom(roomId, playerName);
      setCurrentPlayerId(playerId);
      setView('game');
      toast({
        title: '成功加入房间',
      });
    } catch (error: any) {
      toast({
        title: '加入失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLeaveRoom = () => {
    if (roomState) {
      leaveRoom(roomState.roomId, currentPlayerId);
      setView('lobby');
    }
  };

  const handleStartGame = async () => {
    if (!roomState) return;

    try {
      await startGame(roomState.roomId, currentPlayerId);
      playSound('game-start');
      toast({
        title: '游戏开始',
      });
    } catch (error: any) {
      toast({
        title: '启动失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleNightAction = async (actionType: string, targetId: string | null) => {
    if (!roomState) return;

    try {
      await sendNightAction(roomState.roomId, currentPlayerId, actionType, targetId);
      playSound('skill-use');
      toast({
        title: '行动已提交',
      });
    } catch (error: any) {
      toast({
        title: '提交失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleVote = async (targetId: string) => {
    if (!roomState) return;

    try {
      await sendVote(roomState.roomId, currentPlayerId, targetId);
      playSound('voting');
      toast({
        title: '投票已提交',
      });
    } catch (error: any) {
      toast({
        title: '投票失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleHunterShoot = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendHunterShoot(roomState.roomId, currentPlayerId, targetId);
      toast({ title: '开枪成功' });
    } catch (error: any) {
      toast({ title: '开枪失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleBadgeTransfer = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendBadgeTransfer(roomState.roomId, currentPlayerId, targetId);
      toast({ title: '移交警徽成功' });
    } catch (error: any) {
      toast({ title: '移交失败', description: error.message, variant: 'destructive' });
    }
  };

  // ========== Sheriff Election Handlers ==========

  const handleApplySheriff = async () => {
    if (!roomState) return;
    try {
      await applySheriff(roomState.roomId, currentPlayerId);
      toast({ title: '已申请竞选警长' });
    } catch (error: any) {
      toast({ title: '申请失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleVoteSheriff = async (targetId: string) => {
    if (!roomState) return;
    try {
      await voteSheriff(roomState.roomId, currentPlayerId, targetId);
      toast({ title: '投票成功' });
    } catch (error: any) {
      toast({ title: '投票失败', description: error.message, variant: 'destructive' });
    }
  };

  // ========== Host Control Handlers ==========

  const handleHostPause = async () => {
    if (!roomState) return;
    try {
      await hostPause(roomState.roomId, currentPlayerId);
    } catch (error: any) {
      toast({ title: '暂停失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleHostResume = async () => {
    if (!roomState) return;
    try {
      await hostResume(roomState.roomId, currentPlayerId);
    } catch (error: any) {
      toast({ title: '恢复失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleHostForceSkip = async () => {
    if (!roomState) return;
    try {
      await hostForceSkip(roomState.roomId, currentPlayerId);
      toast({ title: '已强制跳过' });
    } catch (error: any) {
      toast({ title: '操作失败', description: error.message, variant: 'destructive' });
    }
  };

  // Determine if current player can speak
  const canCurrentPlayerSpeak =
    (roomState?.phase === 'DAY_DISCUSS' || roomState?.phase === 'DAY_DEATH_LAST_WORDS') &&
    activeSpeakerId === currentPlayerId &&
    roomState?.players.find(p => p.id === currentPlayerId)?.is_alive;

  const handleSendChat = () => {
    if (!roomState || !chatInput.trim()) return;

    // Strict mode: Only allow speech if it's your turn
    if (!canCurrentPlayerSpeak) {
      toast({ title: '现在不是你的发言时间', variant: 'destructive' });
      return;
    }

    sendChat(roomState.roomId, currentPlayerId, chatInput, 'speech');
    setChatInput('');
  };

  const handleEndTurn = () => {
    if (!roomState) return;
    sendSpeechEnd(roomState.roomId, currentPlayerId);
  };

  useEffect(() => {
    if (!roomState) return;
    const isSpeakingPhase = roomState.phase === 'DAY_DISCUSS' || roomState.phase === 'DAY_DEATH_LAST_WORDS';
    if (isSpeakingPhase && activeSpeakerId === currentPlayerId && (speakerRemainingSeconds ?? 0) <= 0) {
      sendSpeechEnd(roomState.roomId, currentPlayerId);
    }
  }, [speakerRemainingSeconds, activeSpeakerId, roomState]);

  useEffect(() => {
    const unsubscribe = tts.subscribe((isPlaying, _text, playerId) => {
      if (!roomState) return;
      const speakingPhase = roomState.phase === 'DAY_DISCUSS' || roomState.phase === 'DAY_DEATH_LAST_WORDS';
      if (isPlaying && playerId) {
        const counts = ttsPendingCountsRef.current;
        counts[playerId] = (counts[playerId] || 0) + 1;
        setTtsSpeakingPlayerId(playerId);
      }
      if (!isPlaying) {
        setTtsSpeakingPlayerId(prev => (prev === playerId ? null : prev));
      }
      if (!isPlaying && playerId) {
        const counts = ttsPendingCountsRef.current;
        counts[playerId] = Math.max(0, (counts[playerId] || 1) - 1);
        if (speakingPhase && activeSpeakerId === playerId && counts[playerId] === 0) {
          sendSpeechEnd(roomState.roomId, playerId);
        }
      }
    });
    return () => unsubscribe();
  }, [roomState, activeSpeakerId, currentPlayerId, sendSpeechEnd]);

  useEffect(() => {
    const unsubscribe = stt.subscribe(({ recording, transcript, playerId, isFinal, error }) => {
      setIsRecording(!!recording);
      if (error) {
        const msgMap: Record<string, string> = {
          stt_unsupported: '当前浏览器不支持语音识别，请使用Chrome并开启麦克风权限',
          stt_error: '语音识别发生错误',
          'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏右侧开启麦克风权限',
          'no-speech': '没有检测到语音，请重试',
          'audio-capture': '无法访问麦克风，请检查设备与权限',
          network: '语音识别网络错误',
          stt_start_failed: '语音识别启动失败，请刷新页面后重试',
        };
        toast({ title: '语音输入失败', description: msgMap[error] || String(error), variant: 'destructive' });
      }
      if (!isFinal && transcript && playerId === currentPlayerId) {
        setChatInput(transcript);
      }
      if (isFinal && transcript && roomState && playerId === currentPlayerId) {
        if (!canCurrentPlayerSpeak) return;
        sendChat(roomState.roomId, currentPlayerId, transcript, 'speech');
        setChatInput('');
      }
    });
    return () => unsubscribe();
  }, [roomState, currentPlayerId, canCurrentPlayerSpeak, sendChat]);

  // AI补位
  const handleQuickFillAI = async () => {
    if (!roomState) return;

    const emptySlots = playerCount - roomState.players.length;
    if (emptySlots <= 0) {
      toast({ title: '房间已满', description: '无需补位', variant: 'default' });
      return;
    }

    setIsFillingAI(true);
    setAiFilledCount(0);

    try {
      // 逐个添加AI玩家
      for (let i = 0; i < emptySlots; i++) {
        const aiName = `AI_${String.fromCharCode(65 + (roomState.players.length + i))}`; // AI_A, AI_B, ...

        await joinRoom(roomState.roomId, aiName, true); // isAI=true
        setAiFilledCount(i + 1);

        // 动画延迟
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: '补位成功',
        description: `已添加 ${emptySlots} 名AI玩家`,
      });
    } catch (error: any) {
      toast({
        title: '补位失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsFillingAI(false);
    }
  };

  // 自动创建房间并补位AI（从Lobby跳转时使用）
  const autoCreateAndFillAI = async () => {
    if (!lobbyConfig) return;

    try {
      // 1. 创建房间
      const roomNameAuto = `${lobbyConfig.mode}人局`;
      const { roomId, playerId } = await createRoom(roomNameAuto, '玩家1', lobbyConfig.mode || 6);
      setCurrentPlayerId(playerId);
      setView('game');

      // 2. 等待房间状态更新
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. 补位AI
      if (lobbyConfig.aiPersonas && lobbyConfig.aiPersonas.length > 0) {
        setIsFillingAI(true);
        setAiFilledCount(0);

        for (let i = 0; i < lobbyConfig.aiPersonas.length; i++) {
          const personaId = lobbyConfig.aiPersonas[i];
          const aiName = `AI_${personaId.slice(0, 3).toUpperCase()}${i}`;

          await joinRoom(roomId, aiName, true);
          setAiFilledCount(i + 1);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        setIsFillingAI(false);

        toast({
          title: '房间创建成功',
          description: `已自动补位 ${lobbyConfig.aiPersonas.length} 个AI`,
        });
      }
    } catch (error: any) {
      toast({
        title: '自动创建失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Lobby View
  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">狼人杀多人游戏</h1>
            <p className="text-slate-300">{connected ? '✓ 已连接到服务器' : '⚠ 未连接到服务器'}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">创建房间</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="房间名称"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  placeholder="您的昵称"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <select
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value) as 6 | 9 | 12)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                >
                  <option value={6}>6 人局</option>
                  <option value={9}>9 人局</option>
                  <option value={12}>12 人局</option>
                </select>
                <Button onClick={handleCreateRoom} className="w-full" disabled={!connected}>
                  <Users className="w-4 h-4 mr-2" />
                  创建房间
                </Button>
              </CardContent>
            </Card>

            {/* Available Rooms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  可用房间
                  <Button size="sm" onClick={loadRooms} disabled={!connected}>
                    刷新
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="您的昵称"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mb-4"
                />
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {availableRooms.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">暂无可用房间</p>
                    ) : (
                      availableRooms.map((room) => (
                        <div
                          key={room.id}
                          className="bg-slate-700 p-3 rounded flex items-center justify-between"
                        >
                          <div>
                            <div className="text-white font-semibold">{room.name}</div>
                            <div className="text-sm text-slate-400">
                              {room.currentPlayers} / {room.maxPlayers} 玩家
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleJoinRoom(room.id)}>
                            加入
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Game View
  if (view === 'game' && roomState) {
    const isHost = roomState.players.find((p) => p.id === currentPlayerId)?.position === 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {roomState.roomName}
                <span className="text-sm font-normal text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  ID: {roomState.roomId.slice(-4)}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <VoiceSettingsDialog />
              {/* Sound Control */}
              <Button
                onClick={() => {
                  const muted = toggleMute();
                  setSoundMuted(muted);
                }}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white"
                title={soundMuted ? "取消静音" : "静音"}
              >
                {soundMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white"
                title={ttsEnabled ? "关闭语音" : "开启语音"}
              >
                {ttsEnabled ? (
                  <Volume2 className="w-5 h-5 text-green-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
              </Button>
              <Button onClick={handleLeaveRoom} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-2" />
                离开
              </Button>
              {import.meta.env.DEV && (
                <Button
                  onClick={async () => {
                    if (!roomState) return;
                    try {
                      await debugRestore(roomState.roomId, 12);
                      toast({ title: '已恢复到截图场景：白天讨论与AI发言' });
                    } catch (error: any) {
                      toast({ title: '恢复失败', description: error.message, variant: 'destructive' });
                    }
                  }}
                  variant="secondary"
                >
                  快速复原
                </Button>
              )}
            </div>
          </div>

          {/* Phase Indicator */}
          {roomState.phase !== 'WAITING' && (
            <PhaseIndicator
              phase={roomState.phase as any}
              timer={roomState.timer}
              currentRound={roomState.currentRound}
              orderIndex={speakerOrderIndex}
              orderTotal={speakerOrderTotal}
              currentSpeakerName={roomState.players.find(p => p.id === activeSpeakerId)?.name || null}
            />
          )}

          {roomState.phase === 'DAY_DISCUSS' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <div className="flex flex-wrap gap-2 items-center">
                {(roomState.currentSpeakerOrder || []).map((pid) => {
                  const p = roomState.players.find(x => x.id === pid);
                  const isCurrent = pid === activeSpeakerId;
                  const done = !!p?.hasSpokenThisRound;
                  return (
                    <div key={pid} className={`px-2 py-1 rounded text-xs border ${isCurrent ? 'bg-yellow-700 text-white border-yellow-600' : done ? 'bg-green-900 text-green-200 border-green-700' : 'bg-slate-700 text-slate-200 border-slate-600'}`}>
                      {p?.position ?? '?'}号 {p?.name ?? ''} {done ? '✓' : isCurrent ? '●' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Game Area: Split into Left (Table) and Right (Panel) */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Round Table (Always Visible) */}
            <div className="lg:col-span-2 relative min-h-[500px] bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex items-center justify-center">
              {/* AI Filling Animation Overlay */}
              {isFillingAI && (
                <div className="absolute inset-0 z-[999] bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-auto">
                  <AIFillingAnimation
                    totalSlots={playerCount - roomState.players.length}
                    filledSlots={aiFilledCount}
                    isGenerating={isFillingAI}
                    onCancel={() => setIsFillingAI(false)}
                  />
                </div>
              )}

              {(() => {
                const displayThinkingIds = aiThinkingIds;
                const recordingPlayerId = isRecording ? currentPlayerId : null;
                return (
                  <RoundTableView
                    players={roomState.players}
                    currentPlayerId={currentPlayerId}
                    currentPlayerRole={roomState.myRole}
                    sheriffId={roomState.sheriffId}
                    activeSpeakerId={activeSpeakerId}
                    ttsSpeakingPlayerId={ttsSpeakingPlayerId}
                    recordingPlayerId={recordingPlayerId}
                    speakerRemainingSeconds={speakerRemainingSeconds}
                    aiThinkingIds={displayThinkingIds}
                    activeSpeeches={activeSpeeches}
                    seerCheckHistory={seerHistory}
                    vtuberPanelRef={vtuberPanelRef}
                    onPlayerClick={(player) => {
                      // 讨论期：点击头像显示该玩家最近一次发言
                      if (roomState.phase === 'DAY_DISCUSS' || roomState.phase === 'DAY_DEATH_LAST_WORDS') {
                        const content = latestSpeeches[player.id] || '暂无发言';
                        toast({ title: `${player.position}号(${player.name}) 最近发言`, description: content });
                        return;
                      }
                      // 投票/技能期：按互动逻辑处理
                      if (roomState.phase === 'DAY_VOTE') handleVote(player.id);
                      else if (roomState.phase === 'HUNTER_SHOOT') handleHunterShoot(player.id);
                      else if (roomState.phase === 'BADGE_TRANSFER') handleBadgeTransfer(player.id);
                    }}
                  />
                );
              })()}

              {/* Host Controls (Only in Waiting) */}
              {roomState.phase === 'WAITING' && isHost && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                  {roomState.players.length < playerCount && (
                    <Button
                      onClick={handleQuickFillAI}
                      variant="secondary"
                      disabled={isFillingAI}
                      className="shadow-lg"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI补位
                    </Button>
                  )}
                  <Button onClick={handleStartGame} size="lg" className="shadow-lg bg-green-600 hover:bg-green-700">
                    <Play className="w-5 h-5 mr-2" />
                    开始游戏
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Dynamic Side Panel with AI VTuber View */}
            <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-100px)] sticky top-24">

              {/* 1. Collapsible Host & Sheriff Panels */}
              <div className="space-y-2 relative z-50">
                {isHost && (
                  <div className="bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
                    <div
                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-slate-700/50"
                      onClick={() => setIsHostPanelOpen(!isHostPanelOpen)}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Bot className="w-3 h-3" /> 主持人控制台
                      </div>
                      {isHostPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>

                    {isHostPanelOpen && (
                      <div className="p-2 border-t border-slate-700">
                        <HostControlPanel
                          isHost={isHost}
                          isPaused={isPaused || false}
                          currentSpeakerId={activeSpeakerId}
                          currentPlayerId={currentPlayerId}
                          players={roomState.players}
                          onPause={handleHostPause}
                          onResume={handleHostResume}
                          onForceSkip={handleHostForceSkip}
                        />
                      </div>
                    )}
                  </div>
                )}

                {roomState.phase && (
                  <SheriffElectionPanel
                    phase={roomState.phase}
                    currentRound={roomState.currentRound}
                    candidates={sheriffCandidates}
                    players={roomState.players}
                    currentPlayerId={currentPlayerId}
                    hasApplied={sheriffCandidates.includes(currentPlayerId)}
                    onApply={handleApplySheriff}
                    onVote={handleVoteSheriff}
                    className="scale-90 origin-top-right mb-2" // Make compact
                  />
                )}
              </div>

              {/* 2. Main "Live View" Port - AI VTuber Observer */}
              {/* Focus Priority: Active Speaker > Self > Narrator/None */}
              {(() => {
                const targetPlayerId = activeSpeakerId || currentPlayerId;
                const targetPlayer = roomState.players.find(p => p.id === targetPlayerId);
                const isSpeaking = activeSpeakerId === targetPlayerId;
                const isThinking = targetPlayerId && aiThinkingIds?.has(targetPlayerId);

                // Mock Mood Logic
                const getMood = (p: any, status: string) => {
                  if (status === 'dead') return { emotion: 'panic', intensity: 0 };
                  if (status === 'speaking') return { emotion: p.role === 'werewolf' ? 'scheming' : 'happy', intensity: 80 };
                  if (status === 'thinking') return { emotion: 'calm', intensity: 45 };
                  return { emotion: 'calm', intensity: 20 };
                };

                const status = !targetPlayer?.is_alive ? 'dead'
                  : isSpeaking ? 'speaking'
                    : isThinking ? 'thinking'
                      : 'idle';

                return (
                  <div className="flex-1 min-h-0 relative flex flex-col">
                    <AIVtuberObserver
                      ref={vtuberPanelRef}
                      player={targetPlayer ? {
                        id: targetPlayer.id,
                        name: targetPlayer.name,
                        role: targetPlayer.role,
                        isAlive: targetPlayer.is_alive,
                      } : null}
                      status={status}
                      mood={getMood(targetPlayer, status)}
                      currentSpeech={targetPlayer ? latestSpeeches[targetPlayer.id] : ''}
                      className="flex-1"
                      isUserCompanion={targetPlayerId === currentPlayerId}
                      onSpeechComplete={() => {
                        // AI 玩家发言完成后通知游戏继续
                        if (targetPlayerId !== currentPlayerId && roomState) {
                          sendSpeechEnd(roomState.roomId, targetPlayerId);
                        }
                      }}
                    />

                    {/* Floating Mic Request Icon */}
                    <div className="absolute top-4 right-4 z-50">
                      {/* Only show if I am NOT speaking but want to? Or just generic Mic control? 
                               Keeping generic voice settings dialog access here or small indicator */}
                      {canCurrentPlayerSpeak && (
                        <div className="w-8 h-8 rounded-full bg-green-500/80 backdrop-blur flex items-center justify-center animate-pulse shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Mic className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Bottom: System Guide & Compact Log/Input */}
              <div className="h-[35%] flex flex-col gap-2 min-h-[200px]">
                {/* System Guide Condensed */}
                {/* <SystemGuide ... /> - Replacing with integrated status in VTuber or small bar */}

                {/* Action Panels Overlay? No, keep them accessible */}
                {/* Night Actions */}
                {roomState.phase === 'NIGHT' && roomState.myRole && (
                  <div className="absolute top-1/2 left-0 w-full z-50 p-2">
                    <Card className="bg-indigo-900/90 backdrop-blur border-indigo-500/50 shadow-2xl">
                      <CardHeader className="py-2"><CardTitle className="text-sm">夜间行动</CardTitle></CardHeader>
                      <CardContent className="p-2">
                        <NightActionPanel
                          myRole={roomState.myRole}
                          players={roomState.players}
                          myId={currentPlayerId}
                          nightHintTargetId={nightHintTargetId || undefined}
                          nightHintTargetName={nightHintInfo?.name}
                          nightHintTargetRole={nightHintInfo?.role}
                          nightHintTargetPosition={nightHintInfo?.position}
                          onActionSubmit={handleNightAction}
                          compact={true}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Voting Prompt */}
                {roomState.phase === 'DAY_VOTE' && (
                  <div className="bg-red-900/80 backdrop-blur p-2 rounded text-center text-red-100 font-bold border border-red-500 animate-pulse">
                    ⚠️ 请点击左侧头像投票
                  </div>
                )}

                {/* Chat/Input Container - Styled as "Control Deck" */}
                <Card className="flex-1 bg-black/60 backdrop-blur border-slate-700 flex flex-col overflow-hidden">
                  {/* Tab/Header */}
                  <div className="flex items-center gap-1 p-1 bg-black/40 border-b border-white/5 overflow-x-auto">
                    <Button size="sm" variant={chatFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setChatFilter('all')} className="h-6 text-[10px] px-2">ALL</Button>
                    <Button size="sm" variant={chatFilter === 'speech' ? 'secondary' : 'ghost'} onClick={() => setChatFilter('speech')} className="h-6 text-[10px] px-2">LIVE</Button>
                    <Button size="sm" variant={chatFilter === 'system' ? 'secondary' : 'ghost'} onClick={() => setChatFilter('system')} className="h-6 text-[10px] px-2">SYS</Button>
                    {(roomState.phase === 'NIGHT' && roomState.myRole === 'werewolf') && (
                      <Button size="sm" variant="destructive" onClick={() => setChatFilter('wolf')} className="h-6 text-[10px] px-2">WOLF</Button>
                    )}
                  </div>

                  {/* Scroller */}
                  <ScrollArea className="flex-1 p-2" ref={scrollAreaRef}>
                    <div className="space-y-2">
                      {/* Log entries styled as terminal/chat lines */}
                      {(() => {
                        const source = chatMessages.length ? chatMessages.slice(-20) : fallbackMessages.slice(-20); // Show fewer
                        const filtered = source.filter((m) => {
                          if (chatFilter === 'speech') return m.type === 'speech';
                          if (chatFilter === 'system') return m.type === 'system';
                          if (chatFilter === 'wolf') return m.type === 'chat';
                          return true;
                        });
                        return filtered.map((msg) => {
                          const isMe = msg.senderId === currentPlayerId;
                          const isSystem = msg.type === 'system';
                          if (isSystem) return (
                            <div key={msg.id} className="text-[10px] text-blue-300 font-mono border-l-2 border-blue-500 pl-2">
                              [{new Date().toLocaleTimeString().slice(0, 5)}] SYS: {msg.content}
                            </div>
                          );
                          return (
                            <div key={msg.id} className={`flex gap-2 text-xs ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className={`font-bold ${isMe ? 'text-indigo-400' : 'text-slate-400'}`}>{msg.senderName}:</span>
                              <span className="text-slate-200 break-all">{msg.content}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-2 bg-black/20 border-t border-white/5">
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                      className="flex gap-2"
                    >
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={canCurrentPlayerSpeak ? "请输入发言..." : "..."}
                        className="h-8 text-xs bg-transparent border-slate-600 focus:border-indigo-500 text-white"
                        disabled={!canCurrentPlayerSpeak && !(roomState.phase === 'NIGHT' && roomState.myRole === 'werewolf')}
                      />
                      <Button type="submit" size="sm" className="h-8 w-10 p-0" variant="secondary" disabled={!canCurrentPlayerSpeak}>
                        <Send className="w-3 h-3" />
                      </Button>
                      {sttSupported && (
                        <Button
                          type="button"
                          onClick={() => isRecording ? stt.stop() : stt.start(currentPlayerId)}
                          size="sm"
                          className={`h-8 w-8 p-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700'}`}
                        >
                          {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        </Button>
                      )}
                    </form>
                  </div>
                </Card>
              </div>

            </div>
          </div>
        </div>

        {/* Overlays */}
        <SubtitleOverlay />
        {showNarrator && (
          <PhaseTransition
            phase={roomState.phase}
            message={narratorMessage}
            onComplete={() => setShowNarrator(false)}
          />
        )}

        {roomState.myRole && (
          <RoleCardReveal
            role={roomState.myRole}
            playerName={roomState.players.find(p => p.id === roomState.myId)?.name || '你'}
            isVisible={showRoleCard}
            onClose={() => setShowRoleCard(false)}
          />
        )}

        {/* Game Over Overlay */}
        {roomState.phase === 'GAME_OVER' && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-700 max-w-lg w-full shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-4xl mb-2">
                  {roomState.winner === 'werewolf' ? '🐺 狼人获胜' : '👑 好人获胜'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-2">
                  {roomState.players.map(p => (
                    <div key={p.id} className="flex flex-col items-center p-2 bg-slate-800 rounded border border-slate-700">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                        className="w-10 h-10 rounded-full mb-1"
                      />
                      <span className="text-xs text-white font-bold">{p.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.role === 'werewolf' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                        }`}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleLeaveRoom} size="lg" className="w-full">
                  返回大厅
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return null;
}

import { RoomState } from '../../hooks/useGameSocket';

function deriveSeerChecks(roomState: RoomState): Array<{ targetId: string; targetName: string; isWerewolf: boolean; round: number }> {
  const checks: Array<{ targetId: string; targetName: string; isWerewolf: boolean; round: number }> = [];
  for (const log of roomState.gameLog) {
    if (log.event === 'Night actions resolved' && log.details?.checkResults) {
      for (const r of log.details.checkResults as any[]) {
        const target = roomState.players.find((p: any) => p.id === r.targetId);
        checks.push({
          targetId: r.targetId,
          targetName: target?.name || '',
          isWerewolf: r.result === 'Werewolf',
          round: log.round,
        });
      }
    }
    if (log.event === 'Seer private check' && log.details?.targetId) {
      checks.push({
        targetId: log.details.targetId as string,
        targetName: (log.details.targetName as string) || '',
        isWerewolf: (log.details.result as string) === 'Werewolf',
        round: log.round,
      });
    }
  }
  return checks;
}
