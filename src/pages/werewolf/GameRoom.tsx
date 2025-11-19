import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { werewolfApi, gameApi } from '@/db/api';
import { aiService } from '@/services/ai';
import { Send, Users, Moon, Sun, Vote, Brain, ArrowLeft, Download } from 'lucide-react';
import type { WerewolfPersona, WerewolfGameConfig, WerewolfPlayer, WerewolfSpeechRecord } from '@/types';

export default function GameRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { playerCount, config, personas } = location.state as {
    playerCount: 6 | 9 | 12;
    config: WerewolfGameConfig;
    personas: WerewolfPersona[];
  };

  const [sessionId, setSessionId] = useState<string>('');
  const [players, setPlayers] = useState<WerewolfPlayer[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<'night' | 'day' | 'vote'>('night');
  const [speeches, setSpeeches] = useState<WerewolfSpeechRecord[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [showLearningDialog, setShowLearningDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [speeches]);

  const initializeGame = async () => {
    try {
      // 创建游戏会话
      const session = await gameApi.createSession({
        game_type: 'werewolf',
        mode: 'pve',
        game_data: {
          player_count: playerCount,
          config,
        },
      });

      if (!session) {
        throw new Error('创建游戏会话失败');
      }

      setSessionId(session.id);

      // 初始化玩家列表
      const playersList: WerewolfPlayer[] = [
        {
          id: 'user',
          name: '你',
          type: 'user',
          is_alive: true,
          position: 1,
        },
        ...personas.map((persona, index) => ({
          id: persona.id,
          name: persona.name,
          type: 'ai' as const,
          persona,
          is_alive: true,
          position: index + 2,
        })),
      ];

      setPlayers(playersList);

      // 添加系统消息
      const systemMessage: WerewolfSpeechRecord = {
        id: 'system-1',
        session_id: session.id,
        round_number: 1,
        phase: 'night',
        speaker_type: 'ai',
        speaker_id: 'system',
        speaker_name: '系统',
        role: null,
        content: `欢迎来到${playerCount}人局狼人杀游戏！游戏即将开始，请准备好你的策略。`,
        emotion: null,
        target_player: null,
        vote_result: null,
        created_at: new Date().toISOString(),
      };

      setSpeeches([systemMessage]);

      toast({
        title: '游戏开始',
        description: '祝你游戏愉快！',
      });
    } catch (error) {
      console.error('初始化游戏失败:', error);
      toast({
        title: '初始化失败',
        description: '无法创建游戏，请返回重试',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !sessionId) return;

    const userSpeech: WerewolfSpeechRecord = {
      id: `user-${Date.now()}`,
      session_id: sessionId,
      round_number: currentRound,
      phase: currentPhase,
      speaker_type: 'user',
      speaker_id: 'user',
      speaker_name: '你',
      role: null,
      content: userInput,
      emotion: null,
      target_player: null,
      vote_result: null,
      created_at: new Date().toISOString(),
    };

    setSpeeches(prev => [...prev, userSpeech]);
    setUserInput('');

    // 记录发言到数据库
    if (isRecording) {
      await werewolfApi.recordSpeech(userSpeech);
    }

    // AI回复
    setIsAIThinking(true);
    try {
      // 随机选择一个AI玩家回复
      const aiPlayers = players.filter(p => p.type === 'ai' && p.is_alive);
      if (aiPlayers.length > 0) {
        const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        
        // 构建AI提示词
        const prompt = `你是狼人杀游戏中的玩家"${randomAI.name}"，你的人设特征如下：
${randomAI.persona?.description}

性格特征：
- 逻辑性: ${((randomAI.persona?.personality_traits.logical_level || 0.5) * 100).toFixed(0)}%
- 情绪化: ${((randomAI.persona?.personality_traits.emotional_level || 0.5) * 100).toFixed(0)}%
- 激进度: ${((randomAI.persona?.personality_traits.aggressive_level || 0.5) * 100).toFixed(0)}%
- 谨慎度: ${((randomAI.persona?.personality_traits.cautious_level || 0.5) * 100).toFixed(0)}%

当前游戏状态：
- 回合数: ${currentRound}
- 阶段: ${currentPhase === 'night' ? '夜晚' : currentPhase === 'day' ? '白天' : '投票'}
- 存活玩家: ${players.filter(p => p.is_alive).length}人

玩家刚才说: "${userInput}"

请根据你的人设特征，做出符合角色性格的回应。回应要简洁有力，不超过100字。`;

        const aiResponse = await aiService.chat([
          {
            id: `prompt-${Date.now()}`,
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString(),
          },
        ]);

        const aiSpeech: WerewolfSpeechRecord = {
          id: `ai-${Date.now()}`,
          session_id: sessionId,
          round_number: currentRound,
          phase: currentPhase,
          speaker_type: 'ai',
          speaker_id: randomAI.id,
          speaker_name: randomAI.name,
          role: null,
          content: aiResponse,
          emotion: null,
          target_player: null,
          vote_result: null,
          created_at: new Date().toISOString(),
        };

        setSpeeches(prev => [...prev, aiSpeech]);

        // 记录AI发言到数据库
        if (isRecording) {
          await werewolfApi.recordSpeech(aiSpeech);
        }
      }
    } catch (error) {
      console.error('AI回复失败:', error);
      toast({
        title: 'AI回复失败',
        description: '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleNextPhase = () => {
    if (currentPhase === 'night') {
      setCurrentPhase('day');
      const systemMessage: WerewolfSpeechRecord = {
        id: `system-${Date.now()}`,
        session_id: sessionId,
        round_number: currentRound,
        phase: 'day',
        speaker_type: 'ai',
        speaker_id: 'system',
        speaker_name: '系统',
        role: null,
        content: '天亮了，请开始发言讨论。',
        emotion: null,
        target_player: null,
        vote_result: null,
        created_at: new Date().toISOString(),
      };
      setSpeeches(prev => [...prev, systemMessage]);
    } else if (currentPhase === 'day') {
      setCurrentPhase('vote');
      const systemMessage: WerewolfSpeechRecord = {
        id: `system-${Date.now()}`,
        session_id: sessionId,
        round_number: currentRound,
        phase: 'vote',
        speaker_type: 'ai',
        speaker_id: 'system',
        speaker_name: '系统',
        role: null,
        content: '请开始投票。',
        emotion: null,
        target_player: null,
        vote_result: null,
        created_at: new Date().toISOString(),
      };
      setSpeeches(prev => [...prev, systemMessage]);
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentPhase('night');
      const systemMessage: WerewolfSpeechRecord = {
        id: `system-${Date.now()}`,
        session_id: sessionId,
        round_number: currentRound + 1,
        phase: 'night',
        speaker_type: 'ai',
        speaker_id: 'system',
        speaker_name: '系统',
        role: null,
        content: `第${currentRound + 1}回合开始，天黑请闭眼。`,
        emotion: null,
        target_player: null,
        vote_result: null,
        created_at: new Date().toISOString(),
      };
      setSpeeches(prev => [...prev, systemMessage]);
    }
  };

  const handleEndGame = () => {
    setGameStatus('finished');
    setShowLearningDialog(true);
  };

  const handleGeneratePersona = async () => {
    if (!sessionId) return;

    try {
      toast({
        title: '开始分析',
        description: '正在分析你的发言习惯...',
      });

      // 获取所有用户发言
      const userSpeeches = speeches.filter(s => s.speaker_type === 'user');

      if (userSpeeches.length < 5) {
        toast({
          title: '发言太少',
          description: '至少需要5条发言才能生成人设',
          variant: 'destructive',
        });
        return;
      }

      // 使用AI分析发言
      const analysisPrompt = `请分析以下狼人杀游戏中的发言记录，总结玩家的性格特征和行为模式：

${userSpeeches.map((s, i) => `${i + 1}. [${s.phase === 'night' ? '夜晚' : s.phase === 'day' ? '白天' : '投票'}] ${s.content}`).join('\n')}

请从以下维度分析（0-1之间的数值）：
1. 逻辑性（logical_level）：发言是否有条理，推理是否严密
2. 情绪化（emotional_level）：情绪表达是否丰富
3. 激进度（aggressive_level）：是否主动质疑和带节奏
4. 谨慎度（cautious_level）：是否谨慎保守
5. 信任度（trust_level）：是否容易相信他人

请以JSON格式返回分析结果：
{
  "name": "建议的人设名称",
  "description": "人设描述",
  "logical_level": 0.0-1.0,
  "emotional_level": 0.0-1.0,
  "aggressive_level": 0.0-1.0,
  "cautious_level": 0.0-1.0,
  "trust_level": 0.0-1.0,
  "key_phrases": ["关键短语1", "关键短语2"],
  "summary": "总体评价"
}`;

      const analysisResult = await aiService.chat([
        {
          id: `analysis-${Date.now()}`,
          role: 'user',
          content: analysisPrompt,
          timestamp: new Date().toISOString(),
        },
      ]);

      // 解析AI返回的JSON
      const analysis = JSON.parse(analysisResult);

      // 创建新人设
      const newPersona = await werewolfApi.createPersona({
        name: analysis.name || '我的游戏风格',
        type: 'learned',
        description: analysis.description || '基于游戏发言分析生成的人设',
        personality_traits: {
          logical_level: analysis.logical_level || 0.5,
          emotional_level: analysis.emotional_level || 0.5,
          aggressive_level: analysis.aggressive_level || 0.5,
          cautious_level: analysis.cautious_level || 0.5,
          trust_level: analysis.trust_level || 0.5,
        },
        speaking_style: {
          speech_length: 'medium',
          speech_frequency: 'medium',
          logic_pattern: 'inductive',
          emotion_expression: 'moderate',
        },
        behavior_patterns: {
          voting_tendency: 'adaptive',
          strategy_style: 'learned',
        },
        sample_speeches: userSpeeches.map(s => s.content),
        is_public: false,
      });

      if (newPersona) {
        // 创建学习记录
        await werewolfApi.createPersonaLearning({
          source_session_id: sessionId,
          target_user_id: 'user',
          generated_persona_id: newPersona.id,
          speech_count: userSpeeches.length,
          analysis_result: analysis,
          confidence_score: 0.8,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        toast({
          title: '人设生成成功',
          description: `已生成人设"${newPersona.name}"，可在人设库中查看`,
        });

        setShowLearningDialog(false);
      }
    } catch (error) {
      console.error('生成人设失败:', error);
      toast({
        title: '生成失败',
        description: '无法生成人设，请重试',
        variant: 'destructive',
      });
    }
  };

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'night':
        return <Moon className="w-5 h-5" />;
      case 'day':
        return <Sun className="w-5 h-5" />;
      case 'vote':
        return <Vote className="w-5 h-5" />;
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'night':
        return '夜晚';
      case 'day':
        return '白天';
      case 'vote':
        return '投票';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/werewolf')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {getPhaseIcon()}
            <span className="ml-2">第{currentRound}回合 - {getPhaseText()}</span>
          </Badge>
          <Button variant="outline" onClick={handleEndGame}>
            结束游戏
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 玩家列表 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              玩家列表
            </CardTitle>
            <CardDescription>{playerCount}人局</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.is_alive ? 'bg-background' : 'bg-muted opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={player.type === 'user' ? 'default' : 'secondary'}>
                      {player.position}号
                    </Badge>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  {!player.is_alive && (
                    <Badge variant="destructive">已出局</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 游戏区域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>游戏进行中</CardTitle>
            <CardDescription>
              {isRecording ? '正在记录发言，可用于生成人设' : '未记录发言'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 发言记录 */}
            <ScrollArea className="h-[400px] w-full rounded-md border p-4" ref={scrollRef}>
              <div className="space-y-4">
                {speeches.map((speech) => (
                  <div
                    key={speech.id}
                    className={`flex ${speech.speaker_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        speech.speaker_type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : speech.speaker_name === '系统'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{speech.speaker_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {speech.phase === 'night' ? '夜晚' : speech.phase === 'day' ? '白天' : '投票'}
                        </Badge>
                      </div>
                      <p className="text-sm">{speech.content}</p>
                    </div>
                  </div>
                ))}
                {isAIThinking && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">AI正在思考...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 输入区域 */}
            <div className="space-y-2">
              <Textarea
                placeholder="输入你的发言..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleNextPhase}>
                  进入下一阶段
                </Button>
                <Button onClick={handleSendMessage} disabled={!userInput.trim() || isAIThinking}>
                  <Send className="w-4 h-4 mr-2" />
                  发送
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 人设学习对话框 */}
      <Dialog open={showLearningDialog} onOpenChange={setShowLearningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              生成游戏人设
            </DialogTitle>
            <DialogDescription>
              根据本局游戏的发言记录，AI可以分析你的游戏风格并生成专属人设
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>本局游戏统计：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>总发言数: {speeches.filter(s => s.speaker_type === 'user').length} 条</li>
                <li>游戏回合: {currentRound} 回合</li>
                <li>参与玩家: {playerCount} 人</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGeneratePersona} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                生成人设
              </Button>
              <Button variant="outline" onClick={() => setShowLearningDialog(false)} className="flex-1">
                稍后再说
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
