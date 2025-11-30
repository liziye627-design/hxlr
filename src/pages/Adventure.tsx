import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatInterface } from '@/components/game/ChatInterface';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { companionApi, gameApi } from '@/db/api';
import { aiService } from '@/services/ai';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AICompanion, ChatMessage } from '@/types';

export default function Adventure() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        game_type: 'adventure',
        mode: 'solo',
        host_user_id: user.id,
        status: 'playing',
        players: [{ id: user.id, nickname: user.nickname }],
        ai_companions: [{ id: selectedCompanion.id, name: selectedCompanion.name }],
        game_data: { chapter: 1, choices: [] },
        started_at: new Date().toISOString(),
      });

      if (session) {
        setGameStarted(true);

        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `欢迎来到数字冒险世界！我是${selectedCompanion.name}，将作为你的向导。\n\n你发现自己站在一个神秘的十字路口。左边是一条通往黑暗森林的小径，右边是一座闪烁着微光的古老城堡，前方则是一片迷雾笼罩的平原。\n\n你想去哪里？`,
          timestamp: new Date().toISOString(),
          companion: selectedCompanion,
        };

        setMessages([welcomeMessage]);

        toast({
          title: '冒险开始',
          description: '开启你的奇幻之旅！',
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
      const storyContext = messages
        .map((m) => `${m.role === 'user' ? '玩家' : 'AI'}：${m.content}`)
        .join('\n');

      const response = await aiService.adventureNarration(storyContext, content, selectedCompanion);

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
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold mb-4">
                <span className="gradient-text">数字冒险</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                文本冒险游戏，通过对话推动故事发展，体验不同结局
              </p>
            </div>

            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">选择你的向导</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {companions.map((companion) => (
                  <button
                    key={companion.id}
                    onClick={() => setSelectedCompanion(companion)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedCompanion?.id === companion.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={companion.avatar_url || ''}
                      alt={companion.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3"
                    />
                    <h3 className="font-bold mb-1">{companion.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {companion.description}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <h3 className="font-bold mb-2">自由探索</h3>
                <p className="text-sm text-muted-foreground">通过对话选择推动故事发展</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-3">🎭</div>
                <h3 className="font-bold mb-2">多重结局</h3>
                <p className="text-sm text-muted-foreground">你的选择决定故事走向</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="font-bold mb-2">AI互动</h3>
                <p className="text-sm text-muted-foreground">与AI NPC进行真实对话</p>
              </Card>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={startGame}
                disabled={!selectedCompanion}
                className="gradient-bg-primary border-0 text-lg px-12"
              >
                <Play className="w-5 h-5 mr-2" />
                开始冒险
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
              <Button variant="ghost" size="sm" onClick={() => setGameStarted(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                退出冒险
              </Button>
              <span className="font-medium">数字冒险</span>
            </div>
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

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-200px)] bg-card rounded-xl border">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            companion={selectedCompanion || undefined}
            isLoading={isLoading}
            placeholder="输入你的行动或对话..."
          />
        </div>
      </div>
    </div>
  );
}
