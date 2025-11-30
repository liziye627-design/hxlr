import { useEffect, useState } from 'react';
import { CompanionCard } from '@/components/game/CompanionCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { companionApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { AICompanion, CompanionWithRelation } from '@/types';

export default function Companions() {
  const { user } = useUser();
  const { toast } = useToast();
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [userCompanions, setUserCompanions] = useState<CompanionWithRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [allCompanions, myCompanions] = await Promise.all([
        companionApi.getAllCompanions(),
        user ? companionApi.getUserCompanions(user.id) : Promise.resolve([]),
      ]);

      setCompanions(allCompanions);

      const companionsWithStatus = allCompanions.map((companion) => {
        const userCompanion = myCompanions.find((uc) => uc.id === companion.id);
        return {
          ...companion,
          intimacy: userCompanion?.intimacy || 0,
          games_played: userCompanion?.games_played || 0,
          unlocked: !!userCompanion,
        };
      });

      setUserCompanions(companionsWithStatus);
    } catch (error) {
      console.error('Failed to load companions:', error);
      toast({
        title: '加载失败',
        description: '无法加载AI伴侣数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (companionId: string) => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录才能解锁AI伴侣',
        variant: 'destructive',
      });
      return;
    }

    try {
      await companionApi.unlockCompanion(user.id, companionId);
      toast({
        title: '解锁成功',
        description: 'AI伴侣已解锁，快去开始游戏吧！',
      });
      loadData();
    } catch (error) {
      console.error('Failed to unlock companion:', error);
      toast({
        title: '解锁失败',
        description: '无法解锁AI伴侣，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleSelect = (companion: CompanionWithRelation) => {
    toast({
      title: `已选择 ${companion.name}`,
      description: '现在可以开始游戏了！',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
              <span className="gradient-text">AI伴侣中心</span>
            </h1>
            <p className="text-lg text-muted-foreground">选择你的游戏伙伴，开启精彩冒险</p>
          </div>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="all">全部伴侣</TabsTrigger>
              <TabsTrigger value="unlocked">我的伴侣</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {userCompanions.map((companion) => (
                  <CompanionCard
                    key={companion.id}
                    companion={companion}
                    onSelect={() => handleSelect(companion)}
                    onUnlock={() => handleUnlock(companion.id)}
                    showIntimacy
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="unlocked" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {userCompanions.filter((c) => c.unlocked).length > 0 ? (
                  userCompanions
                    .filter((c) => c.unlocked)
                    .map((companion) => (
                      <CompanionCard
                        key={companion.id}
                        companion={companion}
                        onSelect={() => handleSelect(companion)}
                        showIntimacy
                      />
                    ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">你还没有解锁任何AI伴侣</p>
                    <Button onClick={() => loadData()}>刷新</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Companion Types Info */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold mb-2">策略型</h3>
              <p className="text-sm text-muted-foreground">逻辑清晰，善于分析局势，制定最优策略</p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <span className="text-2xl">💫</span>
              </div>
              <h3 className="text-lg font-bold mb-2">社交型</h3>
              <p className="text-sm text-muted-foreground">
                热情活跃，善于调动气氛，增强团队凝聚力
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🌙</span>
              </div>
              <h3 className="text-lg font-bold mb-2">神秘型</h3>
              <p className="text-sm text-muted-foreground">
                沉着冷静，深思熟虑，关键时刻给出致命一击
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="text-lg font-bold mb-2">辅助型</h3>
              <p className="text-sm text-muted-foreground">
                热心肠，保护欲强，最适合新手玩家的贴心伙伴
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
