import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/game/ChatInterface';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { companionApi, gameApi } from '@/db/api';
import { aiService } from '@/services/ai';
import { Users, Play, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage, AICompanion } from '@/types';

export default function Werewolf() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameMode, setGameMode] = useState<'pve' | 'pvp'>('pve');

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    const data = await companionApi.getAllCompanions();
    setCompanions(data);
    if (data.length > 0) {
      setSelectedCompanion(data[0]);
    }
  };

  const startGame = async () => {
    if (!user || !selectedCompanion) {
      toast({
        title: '无法开始游戏',
        description: '请先选择AI伴侣',
        variant: 'destructive',
      });
      return;
    }

    try {
      const session = await gameApi.createSession({
        game_type: 'werewolf',
        mode: gameMode,
        host_user_id: user.id,
        status: 'playing',
        players: [{ id: user.id, nickname: user.nickname }],
        ai_companions: [{ id: selectedCompanion.id, name: selectedCompanion.name }],
        game_data: { round: 1, phase: 'night' },
        started_at: new Date().toISOString(),
      });

      if (session) {
        setGameStarted(true);
        
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `欢迎来到狼人杀游戏！我是${selectedCompanion.name}，将作为你的AI伴侣陪你一起游戏。\n\n游戏即将开始，请准备好你的推理能力！`,
          timestamp: new Date().toISOString(),
          companion: selectedCompanion,
        };
        
        setMessages([welcomeMessage]);
        
        toast({
          title: '游戏开始',
          description: '祝你游戏愉快！',
        });
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: '开始游戏失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedCompanion) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await aiService.chat([...messages, userMessage], selectedCompanion);
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        companion: selectedCompanion,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast({
        title: '消息发送失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold mb-4">
                <span className="gradient-text">AI狼人杀</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                经典狼人杀游戏，与AI伴侣一起推理、投票、找出真相
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>选择游戏模式</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setGameMode('pve')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      gameMode === 'pve'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-4xl mb-3">🤖</div>
                    <h3 className="text-xl font-bold mb-2">PVE模式</h3>
                    <p className="text-sm text-muted-foreground">
                      与AI玩家对战，适合练习和学习
                    </p>
                  </button>
                  <button
                    onClick={() => setGameMode('pvp')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      gameMode === 'pvp'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-4xl mb-3">👥</div>
                    <h3 className="text-xl font-bold mb-2">PVP模式</h3>
                    <p className="text-sm text-muted-foreground">
                      真人+AI混合对战，更具挑战性
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>选择AI伴侣</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {companions.map((companion) => (
                    <button
                      key={companion.id}
                      onClick={() => setSelectedCompanion(companion)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedCompanion?.id === companion.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={companion.avatar_url || ''}
                        alt={companion.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3"
                      />
                      <h3 className="font-bold mb-1">{companion.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {companion.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                size="lg"
                onClick={startGame}
                disabled={!selectedCompanion}
                className="gradient-bg-primary border-0 text-lg px-12"
              >
                <Play className="w-5 h-5 mr-2" />
                开始游戏
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGameStarted(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                退出游戏
              </Button>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">狼人杀游戏</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{gameMode === 'pve' ? 'PVE模式' : 'PVP模式'}</Badge>
              {selectedCompanion && (
                <div className="flex items-center gap-2">
                  <img
                    src={selectedCompanion.avatar_url || ''}
                    alt={selectedCompanion.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium">{selectedCompanion.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-200px)] bg-card rounded-xl border">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            companion={selectedCompanion || undefined}
            isLoading={isLoading}
            placeholder="输入你的发言或行动..."
          />
        </div>
      </div>
    </div>
  );
}
