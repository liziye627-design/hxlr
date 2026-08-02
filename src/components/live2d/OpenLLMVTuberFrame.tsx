import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VTuberBridgeService, ConnectionStatus, VTuberMode } from '../../services/VTuberBridgeService';
import { Mic, MicOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface OpenLLMVTuberFrameProps {
    // Base URL of the Open-LLM-VTuber web UI (default: http://127.0.0.1:12393)
    baseUrl?: string;
    className?: string;
    // 模式：dialogue（用户陪玩对话）或 tts（AI玩家TTS朗读）
    mode?: VTuberMode;
    // TTS 模式下要朗读的文字
    ttsText?: string;
    // 模型名称（用于切换不同AI玩家的形象）
    modelName?: string;
    // 回调事件
    onReady?: () => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onTextOutput?: (text: string) => void;
    onStatusChange?: (status: ConnectionStatus) => void;
    // 是否使用 iframe 模式（后备方案）
    useIframeMode?: boolean;
    // 显示控制按钮
    showControls?: boolean;
}

/**
 * Open-LLM-VTuber 集成组件
 * 
 * 支持两种模式：
 * 1. WebSocket 直连模式 - 直接与 VTuber 后端通信
 * 2. iframe 模式 - 嵌入完整的 VTuber 前端（后备方案）
 * 
 * Prerequisites:
 * 1. Clone Open-LLM-VTuber: git clone https://github.com/Open-LLM-VTuber/Open-LLM-VTuber.git
 * 2. Follow setup guide: https://open-llm-vtuber.github.io/docs/quick-start
 * 3. Run the server: uv run run_server.py
 * 4. Default URL: http://127.0.0.1:12393
 */
export const OpenLLMVTuberFrame: React.FC<OpenLLMVTuberFrameProps> = ({
    baseUrl = 'http://127.0.0.1:12393',
    className = '',
    mode = 'dialogue',
    ttsText,
    modelName,
    onReady,
    onSpeechStart,
    onSpeechEnd,
    onTextOutput,
    onStatusChange,
    useIframeMode = false,
    showControls = true,
}) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastTtsTextRef = useRef<string>('');
    const lastModelRef = useRef<string>('');

    // 初始化 WebSocket 连接
    useEffect(() => {
        if (useIframeMode) return;

        const initConnection = async () => {
            try {
                await VTuberBridgeService.connect(baseUrl);
                setError(null);
            } catch (err: unknown) {
                console.error('[VTuberFrame] Connection failed:', err);
                setError('连接 VTuber 服务失败');
            }
        };

        initConnection();

        // 订阅状态变化
        const unsubStatus = VTuberBridgeService.onStatusChange((newStatus) => {
            setStatus(newStatus);
            onStatusChange?.(newStatus);

            if (newStatus === 'connected') {
                onReady?.();
                setError(null);
            } else if (newStatus === 'error') {
                setError('WebSocket 连接错误');
            }
        });

        // 订阅文字输出
        const unsubText = VTuberBridgeService.onText((text) => {
            setCurrentText(text);
            onTextOutput?.(text);
        });

        // 订阅语音结束事件
        const unsubSpeechEnd = VTuberBridgeService.onSpeechEnd(() => {
            setIsSpeaking(false);
            onSpeechEnd?.();
        });

        return () => {
            unsubStatus();
            unsubText();
            unsubSpeechEnd();
        };
    }, [baseUrl, useIframeMode, onReady, onSpeechEnd, onTextOutput, onStatusChange]);

    // 设置模式
    useEffect(() => {
        if (!useIframeMode && status === 'connected') {
            VTuberBridgeService.setMode(mode);
        }
    }, [mode, status, useIframeMode]);

    // 处理 TTS 朗读文字变化
    useEffect(() => {
        if (!useIframeMode && status === 'connected' && mode === 'tts' && ttsText) {
            // 只有文字真正变化时才朗读（避免重复）
            if (ttsText !== lastTtsTextRef.current) {
                lastTtsTextRef.current = ttsText;
                setIsSpeaking(true);
                onSpeechStart?.();
                VTuberBridgeService.speak(ttsText);
            }
        }
    }, [ttsText, status, mode, useIframeMode, onSpeechStart]);

    // 处理模型切换
    useEffect(() => {
        if (!useIframeMode && status === 'connected' && modelName) {
            if (modelName !== lastModelRef.current) {
                lastModelRef.current = modelName;
                VTuberBridgeService.switchModel(modelName);
            }
        }
    }, [modelName, status, useIframeMode]);

    // 手动重连
    const handleReconnect = useCallback(async () => {
        setError(null);
        try {
            await VTuberBridgeService.connect(baseUrl);
        } catch (err) {
            console.error('[VTuberFrame] Reconnect failed:', err);
            setError('重新连接失败');
        }
    }, [baseUrl]);

    // 中断当前语音
    const handleInterrupt = useCallback(() => {
        VTuberBridgeService.interrupt();
        setIsSpeaking(false);
    }, []);

    // ============ iframe 模式渲染 ============
    if (useIframeMode) {
        return (
            <div className={`relative ${className}`}>
                <iframe
                    ref={iframeRef}
                    src={baseUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title="Open-LLM-VTuber"
                    allow="microphone; camera; autoplay"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />
                {/* Connection indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 font-mono">IFRAME</span>
                </div>
            </div>
        );
    }

    // ============ WebSocket 模式渲染 ============

    // 连接中状态
    if (status === 'connecting') {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <div className="text-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <div className="text-cyan-400 font-mono text-sm">
                        正在连接 VTuber 服务...
                    </div>
                </div>
            </div>
        );
    }

    // 断开连接或错误状态
    if (status === 'disconnected' || status === 'error') {
        return (
            <div className={`flex flex-col items-center justify-center gap-4 p-4 ${className}`}>
                <div className="text-red-400 text-2xl">⚠️</div>
                <div className="text-red-400 font-mono text-sm text-center">
                    {error || 'VTuber 服务未连接'}
                </div>
                <div className="text-gray-500 text-xs text-center max-w-[200px]">
                    请启动 Open-LLM-VTuber 服务：<br />
                    <code className="text-cyan-400">uv run run_server.py</code>
                </div>
                <button
                    onClick={handleReconnect}
                    className="px-3 py-1.5 bg-cyan-600/30 text-cyan-400 text-xs rounded-lg hover:bg-cyan-600/50 transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="w-3 h-3" />
                    重新连接
                </button>
            </div>
        );
    }

    // 已连接状态
    return (
        <div className={`relative flex flex-col ${className}`}>
            {/* VTuber 显示区域 - 使用 iframe 加载前端 */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-900/50 to-purple-900/30 rounded-lg overflow-hidden">
                <iframe
                    ref={iframeRef}
                    src={baseUrl}
                    className="w-full h-full border-0"
                    title="Open-LLM-VTuber"
                    allow="microphone; camera; autoplay"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />

                {/* 语音状态指示器 */}
                {isSpeaking && (
                    <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-green-500/80 rounded text-xs text-white">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        <span>正在说话...</span>
                    </div>
                )}

                {/* 当前文字显示（TTS模式） */}
                {mode === 'tts' && currentText && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="text-white text-sm leading-relaxed">
                            {currentText.slice(0, 100)}{currentText.length > 100 ? '...' : ''}
                        </div>
                    </div>
                )}
            </div>

            {/* 控制面板 */}
            {showControls && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {/* 连接状态 */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded text-xs">
                        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                            }`} />
                        <span className={`font-mono ${status === 'connected' ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {mode === 'dialogue' ? 'DIALOGUE' : 'TTS'}
                        </span>
                    </div>

                    {/* 静音按钮 */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors"
                        title={isMuted ? '取消静音' : '静音'}
                    >
                        {isMuted ? (
                            <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                        )}
                    </button>

                    {/* 麦克风按钮（对话模式） */}
                    {mode === 'dialogue' && (
                        <button
                            className="p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors"
                            title="麦克风"
                        >
                            <Mic className="w-4 h-4 text-cyan-400" />
                        </button>
                    )}

                    {/* 中断按钮（正在说话时） */}
                    {isSpeaking && (
                        <button
                            onClick={handleInterrupt}
                            className="p-1.5 bg-red-500/50 rounded hover:bg-red-500/70 transition-colors"
                            title="中断"
                        >
                            <MicOff className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OpenLLMVTuberFrame;
