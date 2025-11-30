import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameSocket } from '../../hooks/useGameSocket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { MessageSquare, Gift, Settings, Users, Send, Eye, Skull, Heart, Shield } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import type { WerewolfPlayer } from '../../types';

export default function WerewolfGameView() {
  const location = useLocation();
  const { toast } = useToast();
  const {
    connected,
    roomState,
    chatMessages,
    createRoom,
    joinRoom,
    startGame,
    sendNightAction,
    sendVote,
    sendChat,
    activeSpeakerId,
  } = useGameSocket();

  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // 狼人聊天
  const [werewolfChatInput, setWerewolfChatInput] = useState('');
  const [werewolfMessages, setWerewolfMessages] = useState<any[]>([]);

  // 女巫状态
  const [witchAction, setWitchAction] = useState<'save' | 'poison' | null>(null);

  // 预言家查验结果
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [checkResult, setCheckResult] = useState<{ playerId: string; isWerewolf: boolean } | null>(
    null,
  );

  // 临时发言状态（用于真人玩家发言时的气泡显示）
  const [tempSpeakerId, setTempSpeakerId] = useState<string | null>(null);

  const myPlayer = roomState?.players.find((p) => p.id === currentPlayerId);
  const myRole = roomState?.myRole || myPlayer?.role;

  // 从room_state获取玩家ID
  useEffect(() => {
    if (roomState?.myId && !currentPlayerId) {
      setCurrentPlayerId(roomState.myId);
    }
  }, [roomState?.myId, currentPlayerId]);

  // 监听新消息，触发真人玩家的气泡
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      // 如果不是系统消息，且当前没有AI在发言（activeSpeakerId），则显示气泡
      if (lastMsg.senderId !== 'system' && !activeSpeakerId) {
        setTempSpeakerId(lastMsg.senderId);
        const timer = setTimeout(() => setTempSpeakerId(null), 5000); // 5秒后消失
        return () => clearTimeout(timer);
      }
    }
  }, [chatMessages, activeSpeakerId]);

  // 从 Lobby 创建或加入房间
  useEffect(() => {
    const config = location.state as any;

    // 如果没有配置且没有连接到房间，延迟后重定向到Lobby
    if (!config && !roomState && connected) {
      const redirectTimer = setTimeout(() => {
        if (!roomState) {
          console.log('No configuration found and no room state, redirecting to lobby');
          window.location.href = '/werewolf';
        }
      }, 2000); // 等待2秒看是否能收到room_state

      return () => clearTimeout(redirectTimer);
    }

    if (config && connected && !roomState) {
      if (config.action === 'create') {
        handleCreateRoom(config);
      } else if (config.action === 'join') {
        handleJoinRoom(config);
      }
    }
  }, [location.state, connected, roomState]);

  const handleCreateRoom = async (config: any) => {
    try {
      console.log('Creating room with config:', config);
      const result = await createRoom(
        config.roomName || '狼人杀房间',
        config.playerName || '玩家1',
        config.mode || 6
      );
      console.log('Room created:', result);
      // playerId会通过room_state的myId自动设置
      toast({ title: '房间创建成功', description: `房间ID: ${result.roomId.slice(-4)}` });
    } catch (error: any) {
      console.error('Create room error:', error);
      toast({ title: '创建失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleJoinRoom = async (config: any) => {
    try {
      await joinRoom(config.roomId, config.playerName || '玩家', false);
      // playerId会在room_state事件中通过myId获取
      toast({ title: '加入成功', description: `已加入房间` });
    } catch (error: any) {
      toast({ title: '加入失败', description: error.message, variant: 'destructive' });
    }
  };

  // 添加AI陪玩
  const handleAddAI = async () => {
    if (!roomState) return;
    const emptySlots = 6 - roomState.players.length;
    if (emptySlots <= 0) {
      toast({ title: '房间已满', description: '无法添加更多AI' });
      return;
    }

    try {
      for (let i = 0; i < emptySlots; i++) {
        await joinRoom(roomState.roomId, `AI_${i + 1}`, true);
        await new Promise((r) => setTimeout(r, 200));
      }
      toast({ title: 'AI陪玩已添加', description: `已添加${emptySlots}个AI` });
    } catch (error: any) {
      toast({ title: '添加失败', description: error.message, variant: 'destructive' });
    }
  };

  // 狼人刀人
  const handleWerewolfKill = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendNightAction(roomState.roomId, currentPlayerId, 'kill', targetId);
      setShowSkillPanel(false);
      toast({ title: '狼人刀人', description: '已选择击杀目标' });
    } catch (error: any) {
      toast({ title: '失败', description: error.message, variant: 'destructive' });
    }
  };

  // 预言家查验
  const handleSeerCheck = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendNightAction(roomState.roomId, currentPlayerId, 'check', targetId);

      // 模拟查验结果（实际应从后端获取）
      const target = roomState.players.find((p) => p.id === targetId);
      const isWerewolf = target?.role === 'werewolf';
      setCheckResult({ playerId: targetId, isWerewolf });

      setShowSkillPanel(false);
      toast({
        title: '查验结果',
        description: isWerewolf ? '这是狼人！' : '这是好人',
        variant: isWerewolf ? 'destructive' : 'default',
      });
    } catch (error: any) {
      toast({ title: '失败', description: error.message, variant: 'destructive' });
    }
  };

  // 女巫救人 (kept for future implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleWitchSave = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendNightAction(roomState.roomId, currentPlayerId, 'save', targetId);
      setWitchAction('save');
      setShowSkillPanel(false);
      toast({ title: '女巫救人', description: '已使用解药' });
    } catch (error: any) {
      toast({ title: '失败', description: error.message, variant: 'destructive' });
    }
  };

  // 女巫毒人
  const handleWitchPoison = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendNightAction(roomState.roomId, currentPlayerId, 'poison', targetId);
      setWitchAction('poison');
      setShowSkillPanel(false);
      toast({ title: '女巫毒人', description: '已使用毒药' });
    } catch (error: any) {
      toast({ title: '失败', description: error.message, variant: 'destructive' });
    }
  };

  // 守卫保护
  const handleGuardProtect = async (targetId: string) => {
    if (!roomState) return;
    try {
      await sendNightAction(roomState.roomId, currentPlayerId, 'protect', targetId);
      setShowSkillPanel(false);
      toast({ title: '守卫保护', description: '已选择保护目标' });
    } catch (error: any) {
      toast({ title: '失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendChat = () => {
    if (!roomState || !chatInput.trim()) return;
    sendChat(roomState.roomId, currentPlayerId, chatInput);
    setChatInput('');
  };

  // 狼人私聊
  const handleWerewolfChat = () => {
    if (!werewolfChatInput.trim()) return;
    // TODO: 发送狼人私聊消息
    // 这里暂时模拟本地显示
    const msg = {
      senderId: currentPlayerId,
      senderName: myPlayer?.name || '狼人',
      content: werewolfChatInput,
    };
    setWerewolfMessages([...werewolfMessages, msg]);

    // 触发自己的气泡
    setTempSpeakerId(currentPlayerId);
    setTimeout(() => setTempSpeakerId(null), 5000);

    setWerewolfChatInput('');
  };

  // 获取玩家当前的发言内容
  const getPlayerSpeech = (playerId: string) => {
    // 优先显示狼人私聊（如果是狼人且在夜晚）
    if (myRole === 'werewolf' && roomState?.phase === 'NIGHT') {
      const lastWolfMsg = werewolfMessages[werewolfMessages.length - 1];
      if (lastWolfMsg && lastWolfMsg.senderId === playerId) {
        return lastWolfMsg.content;
      }
    }

    // 显示普通聊天
    const lastMsg = chatMessages.filter(m => m.senderId === playerId).pop();
    return lastMsg ? lastMsg.content : '';
  };

  if (!roomState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* 旋转的狼人头像 */}
          <div className="text-8xl animate-spin">🐺</div>

          {/* 加载文字 */}
          <p className="text-gray-200 text-2xl font-bold">准备进入游戏...</p>

          {/* 进度条 */}
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>

          <p className="text-gray-500 text-sm">正在连接房间...</p>
        </div>
      </div>
    );
  }

  const phase = roomState.phase;
  const timer = roomState.timer;
  const players = roomState.players;
  const alivePlayers = players.filter((p) => p.is_alive && p.id !== currentPlayerId);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden text-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/bg-werewolf.jpg')] bg-cover bg-center opacity-20 pointer-events-none"></div>

      {/* 顶部信息栏 */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-gray-800/80 backdrop-blur-md shadow-md rounded-full px-6 py-2 flex items-center gap-2 border border-gray-700">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-gray-200 font-bold">房间号: {roomState.roomId.slice(-4)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-800/80 backdrop-blur-md shadow-md rounded-full px-4 py-2 border border-gray-700">
            <span className="text-gray-200">{players.length} 人</span>
          </div>

          {/* AI陪玩按钮 */}
          {players.length < 6 && (
            <button
              onClick={handleAddAI}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-bold shadow-md flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              AI陪玩
            </button>
          )}

          {/* 开始游戏按钮 */}
          {phase === 'WAITING' && players.length >= 6 && (
            <button
              onClick={() => startGame(roomState.roomId, currentPlayerId)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-md transition-all hover:scale-105"
            >
              开始游戏
            </button>
          )}

          <button className="w-10 h-10 bg-gray-800/80 backdrop-blur-md shadow-md rounded-full flex items-center justify-center hover:bg-gray-700 border border-gray-700">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* 阶段提示条 */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`shadow-lg rounded-full px-8 py-3 border-2 transition-all duration-500 ${phase === 'NIGHT' ? 'bg-indigo-900/90 border-indigo-500' : 'bg-blue-600/90 border-blue-400'
          }`}>
          <p className="text-white text-lg font-bold flex items-center gap-3">
            {phase === 'NIGHT' ? '🌙' : '☀️'}
            {getPhaseText(phase)}
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{timer}s</span>
          </p>
        </div>
      </div>

      {/* 座位区域 - 左侧 */}
      <div className="absolute left-12 top-32 space-y-8">
        {players.slice(0, 3).map((player, idx) => (
          <SeatCard
            key={player.id}
            player={player}
            position={idx + 1}
            showCheckButton={myRole === 'seer' && phase === 'NIGHT' && player.is_alive}
            onCheck={() => setSelectedTarget(player.id)}
            isSpeaking={activeSpeakerId === player.id || tempSpeakerId === player.id}
            speechContent={getPlayerSpeech(player.id)}
          />
        ))}
      </div>

      {/* 座位区域 - 右侧 */}
      <div className="absolute right-12 top-32 space-y-8">
        {players.slice(3, 6).map((player, idx) => (
          <SeatCard
            key={player.id}
            player={player}
            position={idx + 4}
            showCheckButton={myRole === 'seer' && phase === 'NIGHT' && player.is_alive}
            onCheck={() => setSelectedTarget(player.id)}
            isSpeaking={activeSpeakerId === player.id || tempSpeakerId === player.id}
            speechContent={getPlayerSpeech(player.id)}
          />
        ))}
      </div>

      {/* 中央发言区域 (历史记录) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem]">
        <Card className="shadow-2xl border-gray-700 bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="bg-gray-900/50 border-b border-gray-700 py-3">
            <CardTitle className="text-gray-200 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 游戏记录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 p-4">
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-sm ${msg.senderId === 'system'
                      ? 'bg-blue-900/30 border border-blue-800 text-blue-200'
                      : 'bg-gray-700/50 border border-gray-600 text-gray-200'
                      }`}
                  >
                    <p className={`font-bold mb-1 ${msg.senderId === 'system' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {msg.senderName}
                    </p>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 底部工具栏 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 w-full max-w-2xl px-4">
        <div className="relative flex-1">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder={phase === 'DAY_DISCUSS' ? '轮到你发言了...' : '输入消息...'}
            className="w-full bg-gray-800/90 shadow-lg rounded-full border-gray-600 text-white placeholder:text-gray-500 pl-6 pr-12 py-6"
            disabled={!myPlayer?.is_alive}
          />
          <button
            onClick={handleSendChat}
            disabled={!myPlayer?.is_alive || !chatInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 玩家角色身份显示 */}
      {myRole && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-20">
          <Card className="shadow-xl border-yellow-500/50 bg-gray-900/80 backdrop-blur-md">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="text-3xl filter drop-shadow-lg">
                {myRole === 'werewolf' && '🐺'}
                {myRole === 'seer' && '🔮'}
                {myRole === 'witch' && '🧪'}
                {myRole === 'guard' && '🛡️'}
                {myRole === 'hunter' && '🏹'}
                {myRole === 'villager' && '👤'}
              </div>
              <div>
                <p className="text-xs text-gray-400">你的身份</p>
                <p className="text-lg font-bold text-yellow-400">{getRoleText(myRole)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 夜间狼人聊天面板 */}
      {myRole === 'werewolf' && phase === 'NIGHT' && (
        <div className="fixed bottom-32 left-8 z-20">
          <Card className="w-80 shadow-xl border-red-900/50 bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="bg-red-900/20 border-b border-red-900/30 py-3">
              <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                <span>🐺</span> 狼人频道
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-40 mb-3 pr-2">
                <div className="space-y-2">
                  {werewolfMessages.map((msg, idx) => (
                    <div key={idx} className="p-2 bg-red-900/20 rounded border border-red-900/30">
                      <p className="text-xs font-bold text-red-400">{msg.senderName}</p>
                      <p className="text-xs text-red-200">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={werewolfChatInput}
                  onChange={(e) => setWerewolfChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWerewolfChat()}
                  placeholder="与队友密谋..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Button size="sm" onClick={handleWerewolfChat} className="bg-red-700 hover:bg-red-800">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 投票面板 */}
      {phase === 'DAY_VOTE' && myPlayer?.is_alive && !myPlayer?.hasVoted && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-800 w-96 border-gray-700 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-b border-gray-700">
              <CardTitle className="text-gray-200">投票驱逐玩家</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <p className="text-gray-400 text-sm">选择一名玩家进行投票</p>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {alivePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={async () => {
                        try {
                          await sendVote(roomState.roomId, currentPlayerId, player.id);
                          toast({ title: '投票成功', description: `已投票给 ${player.name}` });
                        } catch (error: any) {
                          toast({
                            title: '投票失败',
                            description: error.message,
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="w-full p-3 rounded-lg text-left transition-all bg-gray-700/50 hover:bg-red-900/30 border border-gray-600 hover:border-red-500 flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                          alt={player.name}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-200 group-hover:text-red-300">{player.name}</p>
                        <p className="text-xs text-gray-500">座位 {player.position}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 角色技能面板 */}
      {showSkillPanel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-800 w-96 border-gray-700 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700">
              <CardTitle className="text-gray-200">{getRoleText(myRole)} - 选择目标</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {alivePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (myRole === 'werewolf') handleWerewolfKill(player.id);
                        else if (myRole === 'seer') handleSeerCheck(player.id);
                        else if (myRole === 'guard') handleGuardProtect(player.id);
                        else if (myRole === 'witch' && witchAction === 'poison')
                          handleWitchPoison(player.id);
                      }}
                      className="w-full p-3 rounded-lg text-left transition-all bg-gray-700/50 hover:bg-blue-900/30 border border-gray-600 hover:border-blue-500 text-gray-200"
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <Button onClick={() => setShowSkillPanel(false)} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                取消
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 女巫专用技能面板 */}
      {myRole === 'witch' && phase === 'NIGHT' && !myPlayer?.hasActedNight && (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-20">
          <Card className="w-72 shadow-xl border-purple-500/50 bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="bg-purple-900/20 border-b border-purple-900/30">
              <CardTitle className="text-purple-300">女巫操作</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {roomState.witchPotions?.antidote && (
                <Button
                  onClick={() => {
                    setWitchAction('save');
                    // 这里应该显示被杀的玩家
                    toast({ title: '提示', description: '选择是否救人' });
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  使用解药救人
                </Button>
              )}

              {roomState.witchPotions?.poison && (
                <Button
                  onClick={() => {
                    setWitchAction('poison');
                    setShowSkillPanel(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Skull className="w-4 h-4 mr-2" />
                  使用毒药杀人
                </Button>
              )}

              <Button
                onClick={() => {
                  // 跳过女巫操作
                  toast({ title: '女巫', description: '已跳过操作' });
                }}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                跳过
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 狼人/预言家/守卫技能按钮 */}
      {phase === 'NIGHT' &&
        myRole &&
        ['werewolf', 'seer', 'guard'].includes(myRole) &&
        !myPlayer?.hasActedNight &&
        !showSkillPanel && (
          <button
            onClick={() => setShowSkillPanel(true)}
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg animate-pulse z-20"
          >
            使用{getRoleText(myRole)}技能
          </button>
        )}
    </div>
  );
}

// 座位卡片组件
function SeatCard({
  player,
  position,
  showCheckButton,
  onCheck,
  isSpeaking,
  speechContent,
}: {
  player: WerewolfPlayer;
  position: number;
  showCheckButton?: boolean;
  onCheck?: () => void;
  isSpeaking?: boolean;
  speechContent?: string;
}) {
  return (
    <div className={`w-24 relative transition-all duration-500 ${isSpeaking ? 'transform -translate-y-4 scale-110 z-30' : ''}`}>
      {/* 气泡对话框 */}
      {isSpeaking && speechContent && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 bg-white text-gray-900 p-3 rounded-xl shadow-xl z-40 animate-in fade-in zoom-in duration-300">
          <p className="text-xs leading-relaxed font-medium line-clamp-3">{speechContent}</p>
          {/* 气泡尖角 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"></div>
        </div>
      )}

      <div className={`bg-gray-800 shadow-lg rounded-2xl p-2 flex flex-col items-center gap-2 border transition-colors ${isSpeaking ? 'border-yellow-400 shadow-yellow-400/20' : 'border-gray-700'
        }`}>
        {/* 座位号 */}
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center absolute -top-2 -left-2 border-2 border-gray-800">
          <span className="text-white text-xs font-bold">{position}</span>
        </div>

        {/* 玩家头像 */}
        <div className={`w-16 h-16 rounded-full overflow-hidden bg-gray-700 border-2 ${isSpeaking ? 'border-yellow-400' : 'border-transparent'
          }`}>
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
            alt={player.name}
            className={player.is_alive ? '' : 'grayscale opacity-50'}
          />
        </div>

        {/* 玩家名字 */}
        <p className={`text-xs text-center font-bold truncate w-full ${isSpeaking ? 'text-yellow-400' : 'text-gray-300'}`}>
          {player.name}
        </p>

        {/* 预言家查验按钮 */}
        {showCheckButton && onCheck && (
          <button
            onClick={onCheck}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg"
          >
            <Eye className="w-3 h-3" />
            查验
          </button>
        )}

        {/* 死亡状态覆盖层 */}
        {!player.is_alive && (
          <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center backdrop-blur-[1px]">
            <div className="text-4xl">🪦</div>
            <span className="text-white text-xs mt-1 font-bold">已阵亡</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 辅助函数
function getPhaseText(phase: string): string {
  const phaseMap: Record<string, string> = {
    WAITING: '等待中',
    NIGHT: '夜晚',
    DAY_RESULT: '天亮了',
    DAY_DISCUSS: '白天讨论',
    DAY_VOTE: '投票阶段',
    HUNTER_SHOOT: '猎人开枪',
    BADGE_TRANSFER: '移交警徽',
    GAME_OVER: '游戏结束',
  };
  return phaseMap[phase] || phase;
}

function getRoleText(role: string | null | undefined): string {
  const roleMap: Record<string, string> = {
    werewolf: '狼人',
    villager: '村民',
    seer: '预言家',
    witch: '女巫',
    hunter: '猎人',
    guard: '守卫',
  };
  return roleMap[role || ''] || '未知';
}
