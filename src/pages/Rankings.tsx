import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Heart, Users } from 'lucide-react';
import { rankingApi } from '@/db/api';
import type { Ranking } from '@/types';

export default function Rankings() {
  const [powerRankings, setPowerRankings] = useState<Ranking[]>([]);
  const [charmRankings, setCharmRankings] = useState<Ranking[]>([]);
  const [cooperationRankings, setCooperationRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const season = '2025-S1';
      const [power, charm, cooperation] = await Promise.all([
        rankingApi.getRankings('power', season),
        rankingApi.getRankings('charm', season),
        rankingApi.getRankings('cooperation', season),
      ]);

      setPowerRankings(power);
      setCharmRankings(charm);
      setCooperationRankings(cooperation);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-yellow-500 border-0">🥇 第1名</Badge>;
    }
    if (rank === 2) {
      return <Badge className="bg-gray-400 border-0">🥈 第2名</Badge>;
    }
    if (rank === 3) {
      return <Badge className="bg-orange-600 border-0">🥉 第3名</Badge>;
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const RankingList = ({
    rankings,
    icon: Icon,
    color,
  }: {
    rankings: Ranking[];
    icon: any;
    color: string;
  }) => (
    <div className="space-y-3">
      {rankings.length > 0 ? (
        rankings.map((ranking, index) => (
          <Card key={ranking.id} className="hover:shadow-primary transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankBadge(index + 1)}</div>
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={
                      (ranking as any).user?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranking.user_id}`
                    }
                    alt="avatar"
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-bold">
                      {(ranking as any).user?.nickname || `玩家${ranking.user_id.slice(0, 6)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lv.{(ranking as any).user?.level || 1}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-lg">{ranking.score}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">暂无排行数据</div>
      )}
    </div>
  );

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
              <span className="gradient-text">排行榜</span>
            </h1>
            <p className="text-lg text-muted-foreground">展示最优秀的玩家，争夺荣耀榜首</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center p-6 gradient-bg-primary">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
              <h3 className="text-xl font-bold text-primary-foreground mb-1">战斗力榜</h3>
              <p className="text-sm text-primary-foreground/80">游戏胜率与表现</p>
            </Card>
            <Card className="text-center p-6 gradient-bg-secondary">
              <Heart className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
              <h3 className="text-xl font-bold text-primary-foreground mb-1">魅力榜</h3>
              <p className="text-sm text-primary-foreground/80">社交互动与人气</p>
            </Card>
            <Card className="text-center p-6 gradient-bg-primary">
              <Users className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
              <h3 className="text-xl font-bold text-primary-foreground mb-1">配合榜</h3>
              <p className="text-sm text-primary-foreground/80">团队协作能力</p>
            </Card>
          </div>

          <Tabs defaultValue="power" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="power">
                <Zap className="w-4 h-4 mr-2" />
                战斗力
              </TabsTrigger>
              <TabsTrigger value="charm">
                <Heart className="w-4 h-4 mr-2" />
                魅力
              </TabsTrigger>
              <TabsTrigger value="cooperation">
                <Users className="w-4 h-4 mr-2" />
                配合
              </TabsTrigger>
            </TabsList>

            <TabsContent value="power" className="mt-6">
              <RankingList rankings={powerRankings} icon={Zap} color="bg-primary/10 text-primary" />
            </TabsContent>

            <TabsContent value="charm" className="mt-6">
              <RankingList
                rankings={charmRankings}
                icon={Heart}
                color="bg-destructive/10 text-destructive"
              />
            </TabsContent>

            <TabsContent value="cooperation" className="mt-6">
              <RankingList
                rankings={cooperationRankings}
                icon={Users}
                color="bg-accent/10 text-accent"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
