/**
 * VTuberBridgeService - Open-LLM-VTuber WebSocket 通信服务
 * 
 * 负责与 Open-LLM-VTuber 后端通信，支持两种模式：
 * 1. dialogue 模式：用户的陪玩，使用 LLM 生成对话
 * 2. tts 模式：其他 AI 玩家，只进行 TTS 朗读
 */

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type VTuberMode = 'dialogue' | 'tts';

interface VTuberMessage {
    type: string;
    text?: string;
    audio?: number[];
    model_info?: {
        name: string;
        url: string;
    };
    [key: string]: unknown;
}

type MessageCallback = (message: VTuberMessage) => void;
type StatusCallback = (status: ConnectionStatus) => void;
type AudioCallback = (audioData: string) => void;
type TextCallback = (text: string) => void;
type SpeechEndCallback = () => void;

class VTuberBridgeServiceClass {
    private ws: WebSocket | null = null;
    private baseUrl: string = 'ws://127.0.0.1:12393';
    private status: ConnectionStatus = 'disconnected';
    private mode: VTuberMode = 'dialogue';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    // Event callbacks
    private messageCallbacks: MessageCallback[] = [];
    private statusCallbacks: StatusCallback[] = [];
    private audioCallbacks: AudioCallback[] = [];
    private textCallbacks: TextCallback[] = [];
    private speechEndCallbacks: SpeechEndCallback[] = [];



    /**
     * 连接到 Open-LLM-VTuber WebSocket 服务
     */
    async connect(baseUrl?: string): Promise<void> {
        if (baseUrl) {
            // Convert http to ws
            this.baseUrl = baseUrl.replace(/^http/, 'ws');
        }

        return new Promise((resolve, reject) => {
            if (this.ws && this.status === 'connected') {
                resolve();
                return;
            }

            this.status = 'connecting';
            this.notifyStatusChange();

            // Open-LLM-VTuber uses /client-ws endpoint (see routes.py)
            const wsUrl = `${this.baseUrl}/client-ws`;
            console.log('[VTuberBridge] Connecting to:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('[VTuberBridge] Connected successfully');
                    this.status = 'connected';
                    this.reconnectAttempts = 0;
                    this.notifyStatusChange();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data: VTuberMessage = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.warn('[VTuberBridge] Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[VTuberBridge] WebSocket error:', error);
                    this.status = 'error';
                    this.notifyStatusChange();
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[VTuberBridge] Connection closed');
                    this.status = 'disconnected';
                    this.notifyStatusChange();
                    this.attemptReconnect();
                };
            } catch (error) {
                this.status = 'error';
                this.notifyStatusChange();
                reject(error);
            }
        });
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.status = 'disconnected';
        this.notifyStatusChange();
    }

    /**
     * 尝试重新连接
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[VTuberBridge] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`[VTuberBridge] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect().catch(console.error);
        }, delay);
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(data: VTuberMessage): void {
        console.log('[VTuberBridge] Received:', data.type);

        // Notify general listeners
        this.messageCallbacks.forEach(cb => cb(data));

        switch (data.type) {
            case 'audio':
                // Audio data received
                if (data.audio) {
                    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(data.audio as unknown as ArrayBuffer)));
                    this.audioCallbacks.forEach(cb => cb(audioBase64));
                }
                break;

            case 'full-text':
                // Complete text response
                if (data.text) {
                    this.textCallbacks.forEach(cb => cb(data.text as string));
                }
                break;

            case 'sentence':
                // Streaming text chunk
                if (data.text) {
                    this.textCallbacks.forEach(cb => cb(data.text as string));
                }
                break;

            case 'backend-synth-complete':
            case 'frontend-playback-complete':
                // Speech synthesis/playback complete
                this.speechEndCallbacks.forEach(cb => cb());
                break;

            case 'control':
                // Control messages
                console.log('[VTuberBridge] Control message:', data.text);
                break;

            case 'set-model-and-conf':
                // Model configuration
                console.log('[VTuberBridge] Model set:', data.model_info?.name);
                break;
        }
    }

    /**
     * 发送消息到 VTuber
     */
    private send(message: Record<string, unknown>): void {
        if (this.ws && this.status === 'connected') {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('[VTuberBridge] Cannot send - not connected');
        }
    }

    /**
     * 设置模式：对话模式 or TTS朗读模式
     */
    setMode(mode: VTuberMode): void {
        this.mode = mode;
        console.log('[VTuberBridge] Mode set to:', mode);
    }

    /**
     * 发送文字让 VTuber 朗读（TTS 模式）
     */
    speak(text: string): void {
        if (!text.trim()) return;

        console.log('[VTuberBridge] Speaking:', text.slice(0, 50) + '...');

        // Use text-input type to trigger speech
        // In TTS mode, we want the VTuber to just read the text, not generate a response
        if (this.mode === 'tts') {
            // For TTS-only, we send a special message that tells the backend
            // to just synthesize and play without LLM processing
            this.send({
                type: 'text-input',
                text: text,
                tts_only: true,  // Custom flag to indicate TTS-only mode
            });
        } else {
            // Dialogue mode - send as regular input for LLM processing
            this.send({
                type: 'text-input',
                text: text,
            });
        }
    }

    /**
     * 发送用户输入（对话模式）
     */
    sendUserInput(text: string): void {
        if (!text.trim()) return;

        console.log('[VTuberBridge] User input:', text.slice(0, 50) + '...');

        this.send({
            type: 'text-input',
            text: text,
        });
    }

    /**
     * 中断当前语音
     */
    interrupt(): void {
        console.log('[VTuberBridge] Interrupting...');
        this.send({
            type: 'interrupt-signal',
            text: '',
        });
    }

    /**
     * 切换 Live2D 模型
     */
    switchModel(modelName: string): void {
        console.log('[VTuberBridge] Switching model to:', modelName);
        this.send({
            type: 'switch-config',
            file: modelName,  // This might need adjustment based on actual API
        });
    }

    /**
     * 获取当前连接状态
     */
    getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * 检查是否已连接
     */
    isConnected(): boolean {
        return this.status === 'connected';
    }

    // ============ Event Subscription Methods ============

    private notifyStatusChange(): void {
        this.statusCallbacks.forEach(cb => cb(this.status));
    }

    onMessage(callback: MessageCallback): () => void {
        this.messageCallbacks.push(callback);
        return () => {
            this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
        };
    }

    onStatusChange(callback: StatusCallback): () => void {
        this.statusCallbacks.push(callback);
        return () => {
            this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
        };
    }

    onAudio(callback: AudioCallback): () => void {
        this.audioCallbacks.push(callback);
        return () => {
            this.audioCallbacks = this.audioCallbacks.filter(cb => cb !== callback);
        };
    }

    onText(callback: TextCallback): () => void {
        this.textCallbacks.push(callback);
        return () => {
            this.textCallbacks = this.textCallbacks.filter(cb => cb !== callback);
        };
    }

    onSpeechEnd(callback: SpeechEndCallback): () => void {
        this.speechEndCallbacks.push(callback);
        return () => {
            this.speechEndCallbacks = this.speechEndCallbacks.filter(cb => cb !== callback);
        };
    }
}

// Export singleton instance
export const VTuberBridgeService = new VTuberBridgeServiceClass();
export type { ConnectionStatus, VTuberMode, VTuberMessage };
