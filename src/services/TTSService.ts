export class TTSService {
    private static instance: TTSService;
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private voiceMap: Map<string, SpeechSynthesisVoice> = new Map();
    private pitchMap: Map<string, number> = new Map();
    private rateMap: Map<string, number> = new Map();
    private listeners: ((isPlaying: boolean, text?: string, playerId?: string) => void)[] = [];
    private preferredVoiceURI: string | null = null;

    private constructor() {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    public static getInstance(): TTSService {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }

    private loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log('Loaded voices:', this.voices.length);
    }

    public getAvailableVoices(): SpeechSynthesisVoice[] {
        return this.voices;
    }

    public setPreferredVoice(voiceURI: string) {
        this.preferredVoiceURI = voiceURI;
    }

    public subscribe(listener: (isPlaying: boolean, text?: string, playerId?: string) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    private notify(isPlaying: boolean, text?: string, playerId?: string) {
        this.listeners.forEach(l => l(isPlaying, text, playerId));
    }

    private getVoicePool(): SpeechSynthesisVoice[] {
        const chineseVoices = this.voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'))
        return chineseVoices.length > 0 ? chineseVoices : this.voices
    }

    private getVoiceForPlayer(playerId: string): SpeechSynthesisVoice | null {
        // If preferred voice is set, try to use it
        if (this.preferredVoiceURI) {
            const preferred = this.voices.find(v => v.voiceURI === this.preferredVoiceURI);
            if (preferred) return preferred;
        }

        if (this.voiceMap.has(playerId)) {
            return this.voiceMap.get(playerId) || null;
        }

        const voicesToUse = this.getVoicePool();

        if (voicesToUse.length === 0) return null;

        // Deterministic assignment based on playerId hash
        const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const voiceIndex = hash % voicesToUse.length;
        const voice = voicesToUse[voiceIndex];

        const pitch = 0.95 + (hash % 3) / 20;
        const rate = 1.0;

        this.voiceMap.set(playerId, voice);
        this.pitchMap.set(playerId, pitch);
        this.rateMap.set(playerId, rate);

        return voice;
    }

    private hash(text: string): number {
        return text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    }

    private getRoleVoice(role?: string): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number } {
        const pool = this.getVoicePool()
        if (!role || pool.length === 0) return { voice: pool[0] || null, pitch: 1.0, rate: 1.0 }
        const idx = Math.abs(this.hash(role)) % pool.length
        const base = pool[idx]
        const presets: Record<string, { pitch: number; rate: number }> = {
            villager: { pitch: 1.0, rate: 1.0 },
            werewolf: { pitch: 0.9, rate: 1.05 },
            seer: { pitch: 1.15, rate: 1.0 },
            witch: { pitch: 1.1, rate: 0.95 },
            guard: { pitch: 0.95, rate: 0.95 },
            hunter: { pitch: 0.85, rate: 1.0 },
            sheriff: { pitch: 1.05, rate: 1.0 },
        }
        const pr = presets[role] || { pitch: 1.0, rate: 1.0 }
        return { voice: base || null, pitch: pr.pitch, rate: pr.rate }
    }

    public speak(text: string, playerId: string, opts?: { role?: string }) {
        console.log(`[TTS] speak() called: playerId=${playerId}, text="${text.substring(0, 30)}...", role=${opts?.role}`);
        console.log(`[TTS] Available voices: ${this.voices.length}, synthesis paused: ${this.synthesis.paused}, speaking: ${this.synthesis.speaking}`);
        
        // 确保语音列表已加载
        if (this.voices.length === 0) {
            this.loadVoices();
            console.log(`[TTS] Reloaded voices: ${this.voices.length}`);
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        let voice: SpeechSynthesisVoice | null = null
        let pitchFromMap: number | undefined
        let rateFromMap: number | undefined

        if (opts?.role) {
            const rv = this.getRoleVoice(opts.role)
            voice = rv.voice
            pitchFromMap = rv.pitch
            rateFromMap = rv.rate
        } else {
            voice = this.getVoiceForPlayer(playerId);
            pitchFromMap = this.pitchMap.get(playerId) ?? undefined
            rateFromMap = this.rateMap.get(playerId) ?? undefined
        }

        if (voice) {
            utterance.voice = voice;
            console.log(`[TTS] Using voice: ${voice.name} (${voice.lang})`);
        } else {
            console.log(`[TTS] No voice selected, using default`);
        }

        if (typeof pitchFromMap === 'number') utterance.pitch = pitchFromMap
        utterance.rate = typeof rateFromMap === 'number' ? rateFromMap : 1.0

        utterance.onstart = () => {
            console.log(`[TTS] Started speaking: "${text.substring(0, 20)}..."`);
            this.notify(true, text, playerId);
        };
        utterance.onend = () => {
            console.log(`[TTS] Finished speaking`);
            this.notify(false, text, playerId);
        };
        utterance.onerror = (event) => {
            console.error(`[TTS] Error:`, event.error);
            this.notify(false, text, playerId);
        };

        // 取消之前的语音（避免队列堆积）
        // this.synthesis.cancel();
        
        this.synthesis.speak(utterance);
        console.log(`[TTS] Queued for speaking, pending: ${this.synthesis.pending}`);
    }

    public stop() {
        this.synthesis.cancel();
        this.notify(false);
    }
}

export const tts = TTSService.getInstance();
