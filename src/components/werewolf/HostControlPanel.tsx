import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Crown, Pause, Play, SkipForward, Users } from 'lucide-react';
import type { WerewolfPlayer } from '../../types';

interface HostControlPanelProps {
    isHost: boolean;
    isPaused: boolean;
    currentSpeakerId: string | null;
    currentPlayerId: string;
    players: WerewolfPlayer[];
    onPause: () => void;
    onResume: () => void;
    onForceSkip: () => void;
}

export const HostControlPanel = ({
    isHost,
    isPaused,
    currentSpeakerId,
    currentPlayerId,
    players,
    onPause,
    onResume,
    onForceSkip,
}: HostControlPanelProps) => {
    if (!isHost) return null;

    const currentSpeaker = currentSpeakerId ? players.find(p => p.id === currentSpeakerId) : null;

    return (
        <Card className="bg-purple-900/20 border-purple-600/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-purple-300 text-sm flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    主持人控制面板
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Game Control Buttons */}
                <div className="space-y-2">
                    {isPaused ? (
                        <Button onClick={onResume} variant="default" className="w-full bg-green-600 hover:bg-green-700">
                            <Play className="w-4 h-4 mr-2" />
                            恢复游戏
                        </Button>
                    ) : (
                        <Button onClick={onPause} variant="secondary" className="w-full">
                            <Pause className="w-4 h-4 mr-2" />
                            暂停游戏
                        </Button>
                    )}

                    {/* Force Skip Button (only when someone is speaking) */}
                    {currentSpeakerId && currentSpeaker && (
                        <div className="space-y-2 pt-2 border-t border-purple-700">
                            <div className="text-xs text-purple-300">
                                当前发言: {currentSpeaker.position}号 {currentSpeaker.name}
                            </div>
                            <Button onClick={onForceSkip} variant="destructive" className="w-full">
                                <SkipForward className="w-4 h-4 mr-2" />
                                强制跳过发言
                            </Button>
                        </div>
                    )}
                </div>

                {/* Player List */}
                <div className="pt-3 border-t border-purple-700">
                    <h4 className="text-xs text-purple-300 mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        玩家列表 ({players.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {players.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-slate-800/30 p-1.5 rounded">
                                <span className={!p.is_alive ? 'line-through opacity-50 text-slate-400' : 'text-white'}>
                                    {p.position}: {p.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    {p.type === 'ai' && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-400 text-purple-300">
                                            AI
                                        </Badge>
                                    )}
                                    {p.id === currentPlayerId && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-400 text-blue-300">
                                            YOU
                                        </Badge>
                                    )}
                                    {!p.is_alive && (
                                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                            出局
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Indicator */}
                {isPaused && (
                    <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded text-center">
                        <p className="text-xs text-yellow-300">⏸️ 游戏已暂停</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
