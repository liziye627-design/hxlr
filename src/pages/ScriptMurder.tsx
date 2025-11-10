import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/game/ChatInterface';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { storyApi, companionApi, gameApi } from '@/db/api';
import { aiService } from '@/services/ai';
import { ArrowLeft, Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Story, AICompanion, ChatMessage } from '@/types';

export default function ScriptMurder() {
  const navigate = useNavigate();
  const { user, isVIP } = useUser();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [storiesData, companionsData] = await Promise.all([
      storyApi.getAllStories(),
      companionApi.getAllCompanions(),
    ]);
    setStories(storiesData);
    setCompanions(companionsData);
    if (companionsData.length > 0) {
      setSelectedCompanion(companionsData[0]);
    }
  };

  const startGame = async () => {
    if (!user || !selectedStory || !selectedCompanion) {
      toast({
        title: '无法开始游戏',
        description: '请选择剧本和AI伴侣',
        variant: 'destructive',
      });
      return;
    }

    if (selectedStory.is_premium && !isVIP) {
      toast({
        title: '需要VIP',
        description: '这是高级剧本，需要VIP会员才能游玩',
        variant: 'destructive',
      });
      return;
    }

    try {
      await storyApi.incrementPlayCount(selectedStory.id);
      
      const session = await gameApi.createSession({
        game_type: 'script_murder',
        mode: 'solo',
        host_user_id: user.id,
        status: 'playing',
        players: [{ id: user.id, nickname: user.nickname }],
        ai_companions: [{ id: selectedCompanion.id, name: selectedCompanion.name }],
        game_data: { story_id: selectedStory.id, chapter: 1 },
        started_at: new Date().toISOString(),
      });

      if (session) {
        setGameStarted(true);
        
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `欢迎来到《${selectedStory.title}》！\n\n${selectedStory.story_data?.intro || selectedStory.description}\n\n我是${selectedCompanion.name}，将作为主持人引导你探索这个故事。准备好了吗？`,
          timestamp: new Date().toISOString(),
          companion: selectedCompanion,
        };
        
        setMessages([welcomeMessage]);
        
        toast({
          title: '游戏开始',
          description: '开始你的推理之旅！',
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
    if (!selectedCompanion || !selectedStory) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const context = `剧本：${selectedStory.title}\n背景：${selectedStory.description}`;
      const response = await aiService.scriptMurderInteraction(
        context,
        selectedCompanion,
        content
      );
      
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'normal':
        return 'bg-blue-500';
      case 'hard':
        return 'bg-orange-500';
      case 'insane':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '新手';
      case 'normal':
        return '普通';
      case 'hard':
        return '困难';
      case 'insane':
        return '疯狂';
      default:
        return difficulty;
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

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold mb-4">
                <span className="gradient-text">AI剧本杀</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                沉浸式剧本体验，AI主持引导，多种故事等你探索
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              {stories.map((story) => (
                <Card
                  key={story.id}
                  className={`cursor-pointer transition-all hover:shadow-primary ${
                    selectedStory?.id === story.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="relative h-48 overflow-hidden rounded-t-xl">
                    <img
                      src={story.cover_url || ''}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {story.is_premium && (
                      <Badge className="absolute top-3 right-3 gradient-bg-primary border-0">
                        <Star className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    <Badge className={`absolute top-3 left-3 ${getDifficultyColor(story.difficulty)} border-0`}>
                      {getDifficultyText(story.difficulty)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold mb-2">{story.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {story.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{story.min_players}-{story.max_players}人</span>
                      <span>⭐ {story.rating.toFixed(1)}</span>
                      <span>🎮 {story.play_count}次</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">选择AI主持人</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        className="w-16 h-16 rounded-full mx-auto mb-2"
                      />
                      <p className="font-medium text-sm">{companion.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                size="lg"
                onClick={startGame}
                disabled={!selectedStory || !selectedCompanion}
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
              <div>
                <h2 className="font-bold">{selectedStory?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedStory?.category} · {getDifficultyText(selectedStory?.difficulty || '')}
                </p>
              </div>
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
            placeholder="输入你的问题或行动..."
          />
        </div>
      </div>
    </div>
  );
}
