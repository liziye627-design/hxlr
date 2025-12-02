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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {companions.map((companion) => (
                  <button
                    key={companion.id}
                    onClick={() => setSelectedCompanion(companion)}
                    className={`relative group p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                      selectedCompanion?.id === companion.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xl scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-card/50 hover:shadow-lg hover:-translate-y-1'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className={`w-24 h-24 rounded-full mx-auto mb-4 p-1 transition-all duration-500 ${
                         selectedCompanion?.id === companion.id ? 'bg-gradient-to-r from-primary to-purple-500' : 'bg-transparent'
                      }`}>
                        <img
                          src={companion.avatar_url || ''}
                          alt={companion.name}
                          className="w-full h-full rounded-full object-cover border-2 border-background"
                        />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{companion.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {companion.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center bg-card/50 border-white/10 hover:bg-card/80 transition-colors">
                <div className="text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-600 animate-pulse">🗺️</div>
                <h3 className="font-bold mb-2 text-lg">自由探索</h3>
                <p className="text-sm text-muted-foreground">开放式世界，每一个选择都通向未知的领域</p>
              </Card>
              <Card className="p-6 text-center bg-card/50 border-white/10 hover:bg-card/80 transition-colors">
                <div className="text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-red-600 animate-pulse">🎭</div>
                <h3 className="font-bold mb-2 text-lg">多重结局</h3>
                <p className="text-sm text-muted-foreground">你的决定将编织出独一无二的传奇故事</p>
              </Card>
              <Card className="p-6 text-center bg-card/50 border-white/10 hover:bg-card/80 transition-colors">
                <div className="text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-br from-green-400 to-teal-600 animate-pulse">🤝</div>
                <h3 className="font-bold mb-2 text-lg">AI深度互动</h3>
                <p className="text-sm text-muted-foreground">与拥有鲜活个性的AI伙伴共同经历冒险</p>
              </Card>
            </div>

            <div className="text-center pb-12">
              <Button
                size="lg"
                onClick={startGame}
                disabled={!selectedCompanion}
                className="h-14 px-12 text-lg rounded-full gradient-bg-primary shadow-lg hover:shadow-primary/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                开始你的冒险
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setGameStarted(false)} className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                退出冒险
              </Button>
              <span className="font-medium text-lg hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                数字冒险
              </span>
            </div>
            {selectedCompanion && (
              <div className="flex items-center gap-3 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                <div className="relative">
                  <img
                    src={selectedCompanion.avatar_url || ''}
                    alt={selectedCompanion.name}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{selectedCompanion.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-1">AI 向导</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-4 md:py-6 max-w-5xl">
        <div className="h-[calc(100vh-140px)] bg-card/30 rounded-2xl border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            companion={selectedCompanion || undefined}
            isLoading={isLoading}
            placeholder={`告诉 ${selectedCompanion?.name} 你想做什么...`}
          />
        </div>
      </div>
    </div>
  );
}
