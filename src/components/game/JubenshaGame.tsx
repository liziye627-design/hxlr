import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Send,
  Search,
  Users,
  BookOpen,
  Clock,
  MessageSquare,
  Vote,
  Eye,
  CheckCircle,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';

// 游戏阶段
type GameStage = 'SCRIPT' | 'INTRO' | 'CLUE' | 'DISCUSSION' | 'VOTE' | 'TRUTH';

const STAGE_NAMES: Record<GameStage, string> = {
  SCRIPT: '剧本环节',
  INTRO: '介绍环节',
  CLUE: '线索环节',
  DISCUSSION: '讨论环节',
  VOTE: '投票环节',
  TRUTH: '真相环节',
};

const STAGE_ORDER: GameStage[] = ['SCRIPT', 'INTRO', 'CLUE', 'DISCUSSION', 'VOTE', 'TRUTH'];

interface RoomStateView {
  roomId: string;
  roomSize: number;
  stage: GameStage;
  stageIndex: number;
  scriptId: string | null;
  scriptTitle: string | null;
  players: Array<{
    playerId: string;
    playerRoomId: number;
    name: string;
    roleId: string | null;
    roleName: string | null;
    isMaster: boolean;
    isReady: boolean;
  }>;
  myPlayer: {
    playerId: string;
    playerRoomId: number;
    roleId: string | null;
    roleName: string | null;
    background: string;
    timeline: string;
    task: string;
    isMurder: boolean;
    movementPoint: number;
  } | null;
  roleInfo: Array<{
    roleId: string;
    roleScriptId: number;
    roleName: string;
    roleDescription: string;
  }>;
  clueInfo: Array<{
    clueId: string;
    clueScriptId: number;
    roleId: string;
    text: string;
    description: string;
    discovered: boolean;
    isPublic: boolean;
    ownerId: string | null;
  }>;
  dialogues: Array<{
    dialogueId: string;
    playerName: string;
    content: string;
    sendTime: string;
  }>;
  murder: { roleId: string; roleName: string } | null;
  canShowTruth: boolean;
}

interface JubenshaGameProps {
  socket: Socket;
  roomId: string;
  username: string;
  initialState: RoomStateView;
  onExit: () => void;
}

export function JubenshaGame({ socket, roomId, username, initialState, onExit }: JubenshaGameProps) {
  const [roomState, setRoomState] = useState<RoomStateView>(initialState);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [scriptTab, setScriptTab] = useState<'background' | 'timeline' | 'task' | 'truth'>('background');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 监听房间状态更新
    socket.on('jubensha_room_state', (state: RoomStateView) => {
      setRoomState(state);
    });

    // 监听新消息
    socket.on('jubensha_message', (dialogue: any) => {
      setRoomState(prev => ({
        ...prev,
        dialogues: [...prev.dialogues, dialogue],
      }));
    });

    return () => {
      socket.off('jubensha_room_state');
      socket.off('jubensha_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState.dialogues]);

  const handleReady = () => {
    socket.emit('jubensha_ready', { roomId, username }, (res: any) => {
      if (!res.success) {
        console.error('准备失败:', res.error);
      }
    });
  };

  const handleSearchClue = (clueId: string) => {
    socket.emit('jubensha_check_clue', { roomId, username, clueId }, (res: any) => {
      if (!res.success) {
        alert(res.error);
      }
    });
  };

  const handlePublicClue = (clueId: string) => {
    socket.emit('jubensha_public_clue', { roomId, username, clueId }, (res: any) => {
      if (!res.success) {
        alert(res.error);
      }
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    socket.emit('jubensha_send_message', { roomId, username, message }, (res: any) => {
      if (res.success) {
        setMessage('');
      }
    });
  };

  const handleVote = () => {
    if (!selectedVote) return;
    socket.emit('jubensha_vote', { roomId, username, targetRoleId: selectedVote }, (res: any) => {
      if (!res.success) {
        alert(res.error);
      }
    });
  };

  const handleExit = () => {
    socket.emit('jubensha_exit_room', { roomId, username }, () => {
      onExit();
    });
  };

  const myPlayer = roomState.myPlayer;
  const isReady = roomState.players.find(p => p.name === username)?.isReady;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                退出游戏
              </Button>
              <div>
                <h2 className="font-bold">{roomState.scriptTitle || '剧本杀'}</h2>
                <p className="text-sm text-muted-foreground">
                  房间: {roomId.slice(-6)} · {roomState.players.length}/{roomState.roomSize}人
                </p>
              </div>
            </div>
            {myPlayer && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{myPlayer.roleName}</Badge>
                {myPlayer.isMurder && <Badge variant="destructive">凶手</Badge>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {STAGE_ORDER.map((stage, index) => (
              <Badge
                key={stage}
                variant={index === roomState.stageIndex ? 'default' : index < roomState.stageIndex ? 'secondary' : 'outline'}
                className="whitespace-nowrap"
              >
                {index < roomState.stageIndex && <CheckCircle className="w-3 h-3 mr-1" />}
                {STAGE_NAMES[stage]}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Script Content */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                剧本内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={scriptTab} onValueChange={(v) => setScriptTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="background">背景</TabsTrigger>
                  <TabsTrigger value="timeline">时间线</TabsTrigger>
                  <TabsTrigger value="task">任务</TabsTrigger>
                  {roomState.canShowTruth && <TabsTrigger value="truth">真相</TabsTrigger>}
                </TabsList>
                <ScrollArea className="h-[200px] mt-4">
                  <TabsContent value="background" className="mt-0">
                    <p className="text-sm whitespace-pre-wrap">{myPlayer?.background || '暂无背景信息'}</p>
                  </TabsContent>
                  <TabsContent value="timeline" className="mt-0">
                    <p className="text-sm whitespace-pre-wrap">{myPlayer?.timeline || '暂无时间线'}</p>
                  </TabsContent>
                  <TabsContent value="task" className="mt-0">
                    <p className="text-sm whitespace-pre-wrap">{myPlayer?.task || '暂无任务'}</p>
                  </TabsContent>
                  {roomState.canShowTruth && (
                    <TabsContent value="truth" className="mt-0">
                      <p className="text-sm font-bold text-destructive">
                        凶手是：{roomState.murder?.roleName || '未知'}
                      </p>
                    </TabsContent>
                  )}
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>

          {/* Middle Panel - Clues */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                线索搜证
                {myPlayer && roomState.stage === 'CLUE' && (
                  <Badge variant="outline" className="ml-auto">
                    行动点: {myPlayer.movementPoint}/1
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Role Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                {roomState.roleInfo.map((role, index) => (
                  <Button
                    key={role.roleId}
                    variant={selectedRole === index ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(index)}
                  >
                    {role.roleName}
                  </Button>
                ))}
              </div>

              {/* Clues for selected role */}
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {roomState.clueInfo
                    .filter(c => c.roleId === roomState.roleInfo[selectedRole]?.roleId)
                    .map(clue => (
                      <div
                        key={clue.clueId}
                        className={`p-3 rounded-lg border ${clue.discovered ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{clue.text}</span>
                          {clue.discovered && clue.isPublic && (
                            <Badge variant="secondary" className="text-xs">公开</Badge>
                          )}
                        </div>
                        {clue.discovered ? (
                          <p className="text-sm text-muted-foreground">{clue.description}</p>
                        ) : (
                          roomState.stage === 'CLUE' && myPlayer && myPlayer.movementPoint > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSearchClue(clue.clueId)}
                            >
                              <Search className="w-3 h-3 mr-1" />
                              搜索
                            </Button>
                          )
                        )}
                        {clue.discovered && !clue.isPublic && clue.ownerId === myPlayer?.playerId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2"
                            onClick={() => handlePublicClue(clue.clueId)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            公开线索
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - Chat */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                讨论区
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] mb-4">
                <div className="space-y-2">
                  {roomState.dialogues.map(d => (
                    <div key={d.dialogueId} className="text-sm">
                      <span className="font-medium text-primary">{d.playerName}:</span>{' '}
                      <span>{d.content}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入消息..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vote Section */}
        {roomState.stage === 'VOTE' && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Vote className="w-5 h-5" />
                投票选出凶手
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {roomState.roleInfo.map(role => (
                  <Button
                    key={role.roleId}
                    variant={selectedVote === role.roleId ? 'default' : 'outline'}
                    onClick={() => setSelectedVote(role.roleId)}
                  >
                    {role.roleName}
                  </Button>
                ))}
              </div>
              <Button onClick={handleVote} disabled={!selectedVote}>
                确认投票
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Players & Ready Button */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="w-5 h-5" />
                <div className="flex gap-2">
                  {roomState.players.map(p => (
                    <Badge
                      key={p.playerId}
                      variant={p.isReady ? 'default' : 'outline'}
                    >
                      {p.name} {p.roleName ? `(${p.roleName})` : ''} {p.isMaster && '👑'}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleReady}
                disabled={isReady}
                variant={isReady ? 'secondary' : 'default'}
              >
                {isReady ? '已准备' : '准备就绪'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
