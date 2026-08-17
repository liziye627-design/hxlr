import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  LogIn,
  Play,
  Crown,
  RefreshCw,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface Script {
  scriptId: string;
  title: string;
  description: string;
  playerNum: number;
}

interface RoomInfo {
  roomId: string;
  size: number;
  currentPlayers: number;
  stage: string;
  scriptTitle: string | null;
}

interface RoomStateView {
  roomId: string;
  roomSize: number;
  stage: string;
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
  myPlayer: any;
  roleInfo: any[];
  clueInfo: any[];
  dialogues: any[];
  murder: any;
  canShowTruth: boolean;
}

interface JubenshaLobbyProps {
  socket: Socket;
  username: string;
  onGameStart: (roomId: string, roomState: RoomStateView) => void;
  onBack: () => void;
}

export function JubenshaLobby({ socket, username, onGameStart, onBack }: JubenshaLobbyProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomStateView | null>(null);
  const [availableScripts, setAvailableScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [newRoomSize, setNewRoomSize] = useState<number>(3);
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshRooms();

    socket.on('jubensha_room_state', (state: RoomStateView) => {
      setCurrentRoom(state);
    });

    return () => {
      socket.off('jubensha_room_state');
    };
  }, [socket]);

  const refreshRooms = () => {
    socket.emit('jubensha_get_rooms', (res: { success: boolean; rooms: RoomInfo[] }) => {
      if (res.success) {
        setRooms(res.rooms);
      }
    });
  };

  const createRoom = () => {
    setIsLoading(true);
    socket.emit('jubensha_create_room', { numPerson: newRoomSize, username }, (res: any) => {
      setIsLoading(false);
      if (res.success) {
        setCurrentRoom(res.roomState);
        setAvailableScripts(res.availableScripts);
      } else {
        alert(res.error);
      }
    });
  };

  const joinRoom = (roomId: string) => {
    setIsLoading(true);
    socket.emit('jubensha_join_room', { roomId, username }, (res: any) => {
      setIsLoading(false);
      if (res.success) {
        setCurrentRoom(res.roomState);
        setAvailableScripts(res.availableScripts);
      } else {
        alert(res.error);
      }
    });
  };

  const exitRoom = () => {
    if (!currentRoom) return;
    socket.emit('jubensha_exit_room', { roomId: currentRoom.roomId, username }, () => {
      setCurrentRoom(null);
      refreshRooms();
    });
  };

  const chooseScript = (scriptId: string) => {
    if (!currentRoom) return;
    socket.emit('jubensha_choose_script', { roomId: currentRoom.roomId, scriptId }, (res: any) => {
      if (!res.success) {
        alert(res.error);
      }
      setSelectedScript(scriptId);
    });
  };

  const startGame = () => {
    if (!currentRoom) return;
    setIsLoading(true);
    socket.emit('jubensha_start_game', { roomId: currentRoom.roomId }, (res: any) => {
      setIsLoading(false);
      if (res.success) {
        onGameStart(currentRoom.roomId, res.roomState);
      } else {
        alert(res.error);
      }
    });
  };

  const isMaster = currentRoom?.players.find(p => p.name === username)?.isMaster;
  const canStart = currentRoom && 
    currentRoom.scriptId && 
    currentRoom.players.length === currentRoom.roomSize &&
    isMaster;

  // 如果已在房间中，显示房间界面
  if (currentRoom) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  房间 {currentRoom.roomId.slice(-6)}
                </CardTitle>
                <CardDescription>
                  {currentRoom.players.length}/{currentRoom.roomSize} 人 · 
                  {currentRoom.scriptTitle || '未选择剧本'}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exitRoom}>
                退出房间
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 玩家列表 */}
            <div>
              <h3 className="font-medium mb-3">玩家列表</h3>
              <div className="flex flex-wrap gap-2">
                {currentRoom.players.map(player => (
                  <Badge
                    key={player.playerId}
                    variant={player.isMaster ? 'default' : 'secondary'}
                    className="py-2 px-3"
                  >
                    {player.isMaster && <Crown className="w-3 h-3 mr-1" />}
                    {player.name}
                  </Badge>
                ))}
                {Array.from({ length: currentRoom.roomSize - currentRoom.players.length }).map((_, i) => (
                  <Badge key={`empty-${i}`} variant="outline" className="py-2 px-3 opacity-50">
                    等待加入...
                  </Badge>
                ))}
              </div>
            </div>

            {/* 剧本选择（仅房主可见） */}
            {isMaster && (
              <div>
                <h3 className="font-medium mb-3">选择剧本</h3>
                <div className="grid gap-3">
                  {availableScripts.map(script => (
                    <Card
                      key={script.scriptId}
                      className={`cursor-pointer transition-all ${
                        currentRoom.scriptId === script.scriptId
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => chooseScript(script.scriptId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{script.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {script.description}
                            </p>
                          </div>
                          <Badge variant="outline">{script.playerNum}人</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 开始游戏按钮 */}
            <div className="flex justify-center pt-4">
              {isMaster ? (
                <Button
                  size="lg"
                  onClick={startGame}
                  disabled={!canStart || isLoading}
                  className="px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isLoading ? '加载中...' : '开始游戏'}
                </Button>
              ) : (
                <p className="text-muted-foreground">等待房主开始游戏...</p>
              )}
            </div>

            {!canStart && isMaster && (
              <p className="text-center text-sm text-muted-foreground">
                {!currentRoom.scriptId && '请先选择剧本'}
                {currentRoom.scriptId && currentRoom.players.length < currentRoom.roomSize && 
                  `等待更多玩家加入 (${currentRoom.players.length}/${currentRoom.roomSize})`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 大厅界面
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 创建房间 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              创建房间
            </CardTitle>
            <CardDescription>创建一个新的剧本杀房间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>房间人数</Label>
              <Select
                value={newRoomSize.toString()}
                onValueChange={(v) => setNewRoomSize(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3人</SelectItem>
                  <SelectItem value="4">4人</SelectItem>
                  <SelectItem value="5">5人</SelectItem>
                  <SelectItem value="6">6人</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createRoom} disabled={isLoading} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              创建房间
            </Button>
          </CardContent>
        </Card>

        {/* 加入房间 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              加入房间
            </CardTitle>
            <CardDescription>输入房间ID加入已有房间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>房间ID</Label>
              <Input
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="输入房间ID..."
              />
            </div>
            <Button
              onClick={() => joinRoom(joinRoomId)}
              disabled={!joinRoomId || isLoading}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              加入房间
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 房间列表 */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              可用房间
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshRooms}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无可用房间，创建一个吧！
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {rooms.map(room => (
                  <div
                    key={room.roomId}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">房间 {room.roomId.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.scriptTitle || '未选择剧本'} · {room.currentPlayers}/{room.size}人
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinRoom(room.roomId)}
                      disabled={room.currentPlayers >= room.size || room.stage !== 'SCRIPT'}
                    >
                      加入
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={onBack}>
          返回首页
        </Button>
      </div>
    </div>
  );
}
