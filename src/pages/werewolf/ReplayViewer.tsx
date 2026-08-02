import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { getSocketServerUrl } from '@/lib/runtimeUrls';

interface ReplayEvent {
    timestamp: number;
    type: 'phase' | 'speech' | 'chat' | 'vote' | 'action' | 'death';
    payload: any;
}

interface ReplayData {
    roomId: string;
    roomName: string;
    startTime: number;
    endTime: number;
    players: Array<{
        id: string;
        name: string;
        role: string;
        position: number;
        avatar?: string;
    }>;
    events: ReplayEvent[];
    winner: 'werewolf' | 'villager' | null;
}

export default function ReplayViewer() {
    const { roomId } = useParams<{ roomId: string }>();
    const [replayData, setReplayData] = useState<ReplayData | null>(null);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 加载回放数据
    useEffect(() => {
        if (!roomId) return;

        const socket = io(getSocketServerUrl());
        socketRef.current = socket;

        socket.emit('get_replay_data', { roomId }, (response: any) => {
            if (response.success) {
                setReplayData(response.data);
            } else {
                console.error('Failed to load replay:', response.error);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    // 自动播放逻辑
    useEffect(() => {
        if (!isPlaying || !replayData) return;

        if (currentEventIndex >= replayData.events.length - 1) {
            setIsPlaying(false);
            return;
        }

        const currentEvent = replayData.events[currentEventIndex];
        const nextEvent = replayData.events[currentEventIndex + 1];

        if (nextEvent) {
            const delay = (nextEvent.timestamp - currentEvent.timestamp) / playbackSpeed;

            timerRef.current = setTimeout(() => {
                setCurrentEventIndex(prev => prev + 1);
            }, Math.max(100, delay)); // 最小间隔 100ms
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isPlaying, currentEventIndex, replayData, playbackSpeed]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSkipBack = () => {
        setCurrentEventIndex(Math.max(0, currentEventIndex - 1));
    };

    const handleSkipForward = () => {
        if (replayData) {
            setCurrentEventIndex(Math.min(replayData.events.length - 1, currentEventIndex + 1));
        }
    };

    const handleSliderChange = (value: number[]) => {
        setCurrentEventIndex(value[0]);
        setIsPlaying(false);
    };

    const handleDownload = () => {
        if (!replayData) return;

        const dataStr = JSON.stringify(replayData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `replay_${replayData.roomName}_${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const renderEvent = (event: ReplayEvent) => {
        switch (event.type) {
            case 'phase':
                return (
                    <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                        <div className="font-bold text-blue-300">阶段变化</div>
                        <div className="text-sm text-blue-200">
                            进入 {event.payload.phase} 阶段 (第 {event.payload.round} 回合)
                        </div>
                    </div>
                );

            case 'speech':
                return (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                        <div className="font-bold text-yellow-300">
                            {event.payload.playerName} 发言
                        </div>
                        <div className="text-sm text-yellow-100 mt-1">
                            {event.payload.content}
                        </div>
                    </div>
                );

            case 'chat':
                return (
                    <div className="p-3 bg-slate-700/50 border border-slate-600 rounded">
                        <div className="font-bold text-slate-300">
                            {event.payload.playerName} 聊天
                        </div>
                        <div className="text-sm text-slate-200 mt-1">
                            {event.payload.content}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="p-3 bg-slate-800 border border-slate-700 rounded">
                        <div className="text-xs text-slate-400">
                            {event.type}: {JSON.stringify(event.payload).slice(0, 100)}
                        </div>
                    </div>
                );
        }
    };

    if (!replayData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">加载回放数据中...</div>
            </div>
        );
    }

    const currentEvent = replayData.events[currentEventIndex];
    const progress = (currentEventIndex / (replayData.events.length - 1)) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <div>
                                <span className="text-2xl">🎬 回放：{replayData.roomName}</span>
                                {replayData.winner && (
                                    <span className={`ml-4 text-lg ${replayData.winner === 'werewolf' ? 'text-red-400' : 'text-green-400'}`}>
                                        胜者：{replayData.winner === 'werewolf' ? '狼人' : '村民'}
                                    </span>
                                )}
                            </div>
                            <Button onClick={handleDownload} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                下载
                            </Button>
                        </CardTitle>
                    </CardHeader>
                </Card>

                {/* Players Info */}
                <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-6 gap-4">
                            {replayData.players.map(player => (
                                <div key={player.id} className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto mb-2 flex items-center justify-center text-2xl">
                                        {player.avatar || '👤'}
                                    </div>
                                    <div className="text-white text-sm font-bold">{player.name}</div>
                                    <div className="text-slate-400 text-xs">{player.position}号位</div>
                                    <div className="text-yellow-400 text-xs mt-1">{player.role}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Playback Controls */}
                <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {/* Timeline */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>事件 {currentEventIndex + 1} / {replayData.events.length}</span>
                                    <span>{progress.toFixed(1)}%</span>
                                </div>
                                <Slider
                                    value={[currentEventIndex]}
                                    min={0}
                                    max={replayData.events.length - 1}
                                    step={1}
                                    onValueChange={handleSliderChange}
                                    className="w-full"
                                />
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-center gap-4">
                                <Button onClick={handleSkipBack} variant="outline" size="lg">
                                    <SkipBack className="w-5 h-5" />
                                </Button>

                                <Button onClick={handlePlayPause} variant="default" size="lg" className="w-24">
                                    {isPlaying ? (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            暂停
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            播放
                                        </>
                                    )}
                                </Button>

                                <Button onClick={handleSkipForward} variant="outline" size="lg">
                                    <SkipForward className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Playback Speed */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-slate-400 text-sm">播放速度:</span>
                                {[0.5, 1, 2, 4].map(speed => (
                                    <Button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        variant={playbackSpeed === speed ? 'default' : 'outline'}
                                        size="sm"
                                    >
                                        {speed}x
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Display */}
                <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">当前事件</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {currentEvent && renderEvent(currentEvent)}

                            <div className="text-xs text-slate-500 mt-2">
                                时间戳: {new Date(currentEvent.timestamp).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event History */}
                <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">事件历史</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {replayData.events.slice(0, currentEventIndex + 1).reverse().map((event, idx) => {
                                const originalIndex = currentEventIndex - idx;
                                return (
                                    <div
                                        key={originalIndex}
                                        className={`${originalIndex === currentEventIndex ? 'ring-2 ring-blue-500' : 'opacity-70'}`}
                                    >
                                        {renderEvent(event)}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
