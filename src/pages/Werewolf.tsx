import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { werewolfApi } from '@/db/api';
import { Users, Brain, Zap, Shield, Target, Plus, Play, BookOpen } from 'lucide-react';
import type { WerewolfPersona, WerewolfGameConfig } from '@/types';

export default function Werewolf() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<6 | 9 | 12>(6);
  const [gameConfig, setGameConfig] = useState<WerewolfGameConfig | null>(null);
  const [personas, setPersonas] = useState<WerewolfPersona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<WerewolfPersona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePersona, setShowCreatePersona] = useState(false);

  // 新人设表单状态
  const [newPersona, setNewPersona] = useState({
    name: '',
    description: '',
    logical_level: 0.5,
    emotional_level: 0.5,
    aggressive_level: 0.5,
    cautious_level: 0.5,
    trust_level: 0.5,
  });

  useEffect(() => {
    loadData();
  }, [selectedPlayerCount]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [personasData, configData] = await Promise.all([
        werewolfApi.getPublicPersonas(),
        werewolfApi.getConfigByPlayerCount(selectedPlayerCount),
      ]);
      setPersonas(personasData);
      setGameConfig(configData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载游戏数据，请刷新页面重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (persona: WerewolfPersona) => {
    if (selectedPersonas.find(p => p.id === persona.id)) {
      setSelectedPersonas(selectedPersonas.filter(p => p.id !== persona.id));
    } else {
      if (selectedPersonas.length < selectedPlayerCount - 1) {
        setSelectedPersonas([...selectedPersonas, persona]);
      } else {
        toast({
          title: '人设已满',
          description: `最多选择 ${selectedPlayerCount - 1} 个AI人设`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleCreatePersona = async () => {
    if (!newPersona.name.trim()) {
      toast({
        title: '请输入人设名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      const persona = await werewolfApi.createPersona({
        name: newPersona.name,
        type: 'custom',
        description: newPersona.description,
        personality_traits: {
          logical_level: newPersona.logical_level,
          emotional_level: newPersona.emotional_level,
          aggressive_level: newPersona.aggressive_level,
          cautious_level: newPersona.cautious_level,
          trust_level: newPersona.trust_level,
        },
        speaking_style: {
          speech_length: 'medium',
          speech_frequency: 'medium',
          logic_pattern: 'inductive',
          emotion_expression: 'moderate',
        },
        behavior_patterns: {
          voting_tendency: 'balanced',
          strategy_style: 'adaptive',
        },
        is_public: false,
      });

      if (persona) {
        toast({
          title: '创建成功',
          description: '自定义人设已创建',
        });
        setShowCreatePersona(false);
        setNewPersona({
          name: '',
          description: '',
          logical_level: 0.5,
          emotional_level: 0.5,
          aggressive_level: 0.5,
          cautious_level: 0.5,
          trust_level: 0.5,
        });
        loadData();
      }
    } catch (error) {
      console.error('创建人设失败:', error);
      toast({
        title: '创建失败',
        description: '无法创建人设，请重试',
        variant: 'destructive',
      });
    }
  };

  const handleStartGame = () => {
    if (selectedPersonas.length === 0) {
      toast({
        title: '请选择AI人设',
        description: '至少选择一个AI人设才能开始游戏',
        variant: 'destructive',
      });
      return;
    }

    console.log('=== 开始游戏 ===');
    console.log('选择的人数:', selectedPlayerCount);
    console.log('游戏配置:', gameConfig);
    console.log('选择的人设:', selectedPersonas);

    if (!gameConfig) {
      console.error('错误：游戏配置为空！');
      toast({
        title: '配置错误',
        description: '游戏配置加载失败，请刷新页面重试',
        variant: 'destructive',
      });
      return;
    }

    // 跳转到游戏房间页面
    navigate('/werewolf/game', {
      state: {
        playerCount: selectedPlayerCount,
        config: gameConfig,
        personas: selectedPersonas,
      },
    });
  };

  const getPersonalityColor = (level: number) => {
    if (level >= 0.7) return 'text-red-500';
    if (level >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI狼人杀
        </h1>
        <p className="text-muted-foreground">
          选择局数、配置AI人设，开始你的狼人杀之旅
        </p>
      </div>

      {/* 局数选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            选择局数
          </CardTitle>
          <CardDescription>不同局数有不同的角色配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[6, 9, 12].map((count) => (
              <Card
                key={count}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlayerCount === count
                    ? 'border-primary shadow-md'
                    : 'border-border'
                }`}
                onClick={() => setSelectedPlayerCount(count as 6 | 9 | 12)}
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-center">{count}人局</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {gameConfig && selectedPlayerCount === count && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>狼人:</span>
                        <Badge variant="destructive">{gameConfig.role_config.werewolf_count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>村民:</span>
                        <Badge>{gameConfig.role_config.villager_count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>预言家:</span>
                        <Badge variant="secondary">{gameConfig.role_config.seer_count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>女巫:</span>
                        <Badge variant="secondary">{gameConfig.role_config.witch_count}</Badge>
                      </div>
                      {gameConfig.role_config.hunter_count > 0 && (
                        <div className="flex justify-between">
                          <span>猎人:</span>
                          <Badge variant="secondary">{gameConfig.role_config.hunter_count}</Badge>
                        </div>
                      )}
                      {gameConfig.role_config.guard_count > 0 && (
                        <div className="flex justify-between">
                          <span>守卫:</span>
                          <Badge variant="secondary">{gameConfig.role_config.guard_count}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI人设选择 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                选择AI人设
              </CardTitle>
              <CardDescription>
                已选择 {selectedPersonas.length}/{selectedPlayerCount - 1} 个AI人设
              </CardDescription>
            </div>
            <Dialog open={showCreatePersona} onOpenChange={setShowCreatePersona}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  创建人设
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>创建自定义人设</DialogTitle>
                  <DialogDescription>
                    设置AI的性格特征和行为模式
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="persona-name">人设名称</Label>
                    <Input
                      id="persona-name"
                      placeholder="例如：冷静分析师"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="persona-desc">人设描述</Label>
                    <Input
                      id="persona-desc"
                      placeholder="描述这个人设的特点"
                      value={newPersona.description}
                      onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>逻辑性: {(newPersona.logical_level * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[newPersona.logical_level]}
                        onValueChange={([value]) => setNewPersona({ ...newPersona, logical_level: value })}
                        max={1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>情绪化: {(newPersona.emotional_level * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[newPersona.emotional_level]}
                        onValueChange={([value]) => setNewPersona({ ...newPersona, emotional_level: value })}
                        max={1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>激进度: {(newPersona.aggressive_level * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[newPersona.aggressive_level]}
                        onValueChange={([value]) => setNewPersona({ ...newPersona, aggressive_level: value })}
                        max={1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>谨慎度: {(newPersona.cautious_level * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[newPersona.cautious_level]}
                        onValueChange={([value]) => setNewPersona({ ...newPersona, cautious_level: value })}
                        max={1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>信任度: {(newPersona.trust_level * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[newPersona.trust_level]}
                        onValueChange={([value]) => setNewPersona({ ...newPersona, trust_level: value })}
                        max={1}
                        step={0.1}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreatePersona} className="w-full">
                    创建人设
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preset">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">预设人设</TabsTrigger>
              <TabsTrigger value="custom">自定义人设</TabsTrigger>
            </TabsList>
            <TabsContent value="preset" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personas.filter(p => p.type === 'preset').map((persona) => (
                    <Card
                      key={persona.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedPersonas.find(p => p.id === persona.id)
                          ? 'border-primary shadow-md'
                          : 'border-border'
                      }`}
                      onClick={() => handleSelectPersona(persona)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {persona.name}
                          {selectedPersonas.find(p => p.id === persona.id) && (
                            <Badge variant="default">已选</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{persona.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            <span className={getPersonalityColor(persona.personality_traits.logical_level)}>
                              逻辑 {(persona.personality_traits.logical_level * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            <span className={getPersonalityColor(persona.personality_traits.aggressive_level)}>
                              激进 {(persona.personality_traits.aggressive_level * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            <span className={getPersonalityColor(persona.personality_traits.cautious_level)}>
                              谨慎 {(persona.personality_traits.cautious_level * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span className={getPersonalityColor(persona.personality_traits.trust_level)}>
                              信任 {(persona.personality_traits.trust_level * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>使用次数: {persona.usage_count}</span>
                          <span>评分: {persona.rating.toFixed(1)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="custom" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无自定义人设</p>
                <p className="text-sm">点击"创建人设"按钮创建你的第一个自定义人设</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 开始游戏按钮 */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={selectedPersonas.length === 0}
          className="px-8"
        >
          <Play className="w-5 h-5 mr-2" />
          开始游戏
        </Button>
      </div>
    </div>
  );
}
