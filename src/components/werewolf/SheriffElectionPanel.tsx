import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Crown, CheckCircle } from 'lucide-react';
import type { WerewolfPlayer, GamePhase } from '../../types';

interface SheriffElectionPanelProps {
    phase: GamePhase;
    currentRound: number;
    candidates: string[];
    players: WerewolfPlayer[];
    currentPlayerId: string;
    hasApplied: boolean;
    onApply: () => void;
    onVote: (targetId: string) => void;
}

export const SheriffElectionPanel = ({
    phase,
    currentRound,
    candidates,
    players,
    currentPlayerId,
    hasApplied,
    onApply,
    onVote,
}: SheriffElectionPanelProps) => {
    // Show apply button during Day 1 discussion
    if (phase === 'DAY_DISCUSS' && currentRound === 1 && candidates.length < players.filter(p => p.is_alive).length) {
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        if (!currentPlayer || !currentPlayer.is_alive) return null;

        return (
            <Card className="bg-amber-900/20 border-amber-600/50 animate-in slide-in-from-right">
                <CardHeader className="py-3">
                    <CardTitle className="text-amber-300 text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        警长竞选
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!hasApplied ? (
                        <Button onClick={onApply} className="w-full bg-amber-600 hover:bg-amber-700">
                            <Crown className="w-4 h-4 mr-2" />
                            申请竞选警长
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-2 rounded">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">已申请竞选</span>
                        </div>
                    )}

                    {candidates.length > 0 && (
                        <div>
                            <h4 className="text-xs text-amber-200 mb-2">候选人列表 ({candidates.length})</h4>
                            <div className="space-y-1">
                                {candidates.map(id => {
                                    const player = players.find(p => p.id === id);
                                    if (!player) return null;
                                    return (
                                        <div key={id} className="flex items-center justify-between text-sm bg-slate-800/50 p-2 rounded">
                                            <span className="text-white">{player.position}: {player.name}</span>
                                            {player.type === 'ai' && (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0">AI</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Show discussion phase info
    if (phase === 'SHERIFF_ELECTION_DISCUSS') {
        return (
            <Card className="bg-amber-900/20 border-amber-600/50">
                <CardHeader className="py-3">
                    <CardTitle className="text-amber-300 text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        警长竞选 - 候选人发言
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-amber-200">候选人正在依次发言，请仔细聆听...</p>
                    <div className="mt-3 space-y-1">
                        {candidates.map(id => {
                            const player = players.find(p => p.id === id);
                            if (!player) return null;
                            return (
                                <div key={id} className="text-sm text-white bg-slate-800/30 p-2 rounded">
                                    {player.position}: {player.name}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show voting phase
    if (phase === 'SHERIFF_ELECTION_VOTE') {
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        if (!currentPlayer || !currentPlayer.is_alive) return null;

        return (
            <Card className="bg-amber-900/20 border-amber-600/50 animate-pulse">
                <CardHeader className="py-3">
                    <CardTitle className="text-amber-300 text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        警长竞选 - 投票
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-amber-200 mb-3">请选择你支持的候选人：</p>
                    {candidates.map(id => {
                        const player = players.find(p => p.id === id);
                        if (!player) return null;
                        return (
                            <Button
                                key={id}
                                onClick={() => onVote(id)}
                                className="w-full bg-amber-700 hover:bg-amber-800"
                                disabled={currentPlayer.hasVoted}
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                投票给 {player.position}号 {player.name}
                            </Button>
                        );
                    })}
                    {currentPlayer.hasVoted && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-2 rounded mt-3">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">已投票</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return null;
};
