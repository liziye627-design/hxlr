import { useEffect, useState } from 'react';
import { GameCard } from '@/components/game/GameCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { companionApi } from '@/db/api';
import type { AICompanion } from '@/types';

export default function Home() {
  const { user, isVIP } = useUser();
  const [companions, setCompanions] = useState<AICompanion[]>([]);

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    const data = await companionApi.getAllCompanions();
    setCompanions(data.slice(0, 3));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg-hero py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 gradient-bg-primary border-0 text-lg px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              次元阅关
            </Badge>
            <h1 className="text-5xl xl:text-6xl font-bold mb-6">
              <span className="gradient-text">AI游戏伴侣</span>
              <br />
              随时开启冒险之旅
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              与AI伴侣一起体验狼人杀、剧本杀、数字冒险等多种游戏模式
              <br />
              无需等待，秒速配齐，随时开局
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gradient-bg-primary border-0 text-lg px-8 hover:opacity-90">
                <Zap className="w-5 h-5 mr-2" />
                立即开始
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Users className="w-5 h-5 mr-2" />
                了解更多
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </section>

      {/* User Stats */}
      {user && (
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="flex items-center gap-3 px-6 py-3 bg-card rounded-xl border">
                <Trophy className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">等级</p>
                  <p className="text-xl font-bold">Lv.{user.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-card rounded-xl border">
                <Sparkles className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">经验值</p>
                  <p className="text-xl font-bold">{user.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-card rounded-xl border">
                <Zap className="w-6 h-6 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">游戏币</p>
                  <p className="text-xl font-bold">{user.coins}</p>
                </div>
              </div>
              {isVIP && (
                <div className="flex items-center gap-3 px-6 py-3 gradient-bg-primary rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                  <div className="text-primary-foreground">
                    <p className="text-sm">VIP会员</p>
                    <p className="text-xl font-bold">已激活</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Game Modes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl xl:text-4xl font-bold mb-4">
              <span className="gradient-text">游戏模式</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              多种游戏模式，总有一款适合你
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <GameCard
              id="werewolf"
              title="AI狼人杀"
              description="经典狼人杀游戏，与AI伴侣一起推理、投票、找出真相"
              image="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400"
              players="8-12人"
              duration="20-30分钟"
              difficulty="中等"
              link="/werewolf"
            />
            <GameCard
              id="script-murder"
              title="AI剧本杀"
              description="沉浸式剧本体验，AI主持引导，多种故事等你探索"
              image="https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400"
              players="2-6人"
              duration="30-60分钟"
              difficulty="简单-困难"
              link="/script-murder"
            />
            <GameCard
              id="adventure"
              title="数字冒险"
              description="文本冒险游戏，通过对话推动故事发展，体验不同结局"
              image="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400"
              players="1-4人"
              duration="15-45分钟"
              difficulty="简单"
              link="/adventure"
            />
          </div>
        </div>
      </section>

      {/* AI Companions Preview */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl xl:text-4xl font-bold mb-4">
              <span className="gradient-text">AI伴侣</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              不同性格的AI伴侣，陪你一起游戏
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {companions.map((companion) => (
              <div
                key={companion.id}
                className="bg-card rounded-2xl p-6 border hover:shadow-primary transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={companion.avatar_url || ''}
                    alt={companion.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{companion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companion.personality?.style}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {companion.description}
                </p>
                {companion.personality && (
                  <div className="flex flex-wrap gap-2">
                    {companion.personality.traits.map((trait, index) => (
                      <Badge key={index} variant="outline">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button size="lg" variant="outline" asChild>
              <a href="/companions">查看全部伴侣</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl xl:text-4xl font-bold mb-4">
              <span className="gradient-text">核心特色</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg-primary flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">秒速开局</h3>
              <p className="text-muted-foreground">
                无需等待真人玩家，AI伴侣随时待命
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg-secondary flex items-center justify-center">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">智能配合</h3>
              <p className="text-muted-foreground">
                AI伴侣策略稳定，避免猪队友问题
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg-primary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">个性化体验</h3>
              <p className="text-muted-foreground">
                AI伴侣学习你的游戏风格，越玩越默契
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg-secondary flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">社交融合</h3>
              <p className="text-muted-foreground">
                游戏数据转化为匹配信号，结识真人玩家
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
