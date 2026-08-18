import { getVoiceProfile } from '../config/aiPlayerModels';
import { getApiUrl } from '@/lib/runtimeUrls';

type TTSListener = (isPlaying: boolean, text?: string, playerId?: string) => void;
type TTSEngineMode = 'auto' | 'backend' | 'browser';

export interface TTSBackendStatus {
  enabled: boolean;
  provider: string;
  endpoint: string | null;
  model: string;
  fallback: 'browser';
}

export class TTSService {
  private static instance: TTSService;
  private synthesis: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceMap: Map<string, SpeechSynthesisVoice> = new Map();
  private pitchMap: Map<string, number> = new Map();
  private rateMap: Map<string, number> = new Map();
  private listeners: TTSListener[] = [];
  private preferredVoiceURI: string | null = null;
  private engineMode: TTSEngineMode = 'auto';
  private backendStatusCache: TTSBackendStatus | null = null;
  private backendStatusPromise: Promise<TTSBackendStatus> | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentAbortController: AbortController | null = null;

  private constructor() {
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.loadVoices();
    if (this.synthesis && this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private getApiBaseUrl(): string {
    return getApiUrl('').replace(/\/$/, '');
  }

  private loadVoices() {
    if (!this.synthesis) {
      this.voices = [];
      return;
    }

    this.voices = this.synthesis.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setPreferredVoice(voiceURI: string) {
    this.preferredVoiceURI = voiceURI;
  }

  public setEngineMode(mode: TTSEngineMode) {
    this.engineMode = mode;
  }

  public getEngineMode(): TTSEngineMode {
    return this.engineMode;
  }

  public async getBackendStatus(force = false): Promise<TTSBackendStatus> {
    if (!force && this.backendStatusCache) return this.backendStatusCache;
    if (!force && this.backendStatusPromise) return this.backendStatusPromise;

    this.backendStatusPromise = fetch(`${this.getApiBaseUrl()}/api/tts/status`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`tts_status_${response.status}`);
        }

        const payload = (await response.json()) as TTSBackendStatus;
        this.backendStatusCache = payload;
        return payload;
      })
      .catch(() => {
        const fallback: TTSBackendStatus = {
          enabled: false,
          provider: 'browser',
          endpoint: null,
          model: 'tts-1',
          fallback: 'browser',
        };
        this.backendStatusCache = fallback;
        return fallback;
      })
      .finally(() => {
        this.backendStatusPromise = null;
      });

    return this.backendStatusPromise;
  }

  public subscribe(listener: TTSListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(isPlaying: boolean, text?: string, playerId?: string) {
    this.listeners.forEach((listener) => listener(isPlaying, text, playerId));
  }

  private getVoicePool(): SpeechSynthesisVoice[] {
    const chineseVoices = this.voices.filter((voice) => voice.lang.includes('zh') || voice.lang.includes('CN'));
    return chineseVoices.length > 0 ? chineseVoices : this.voices;
  }

  private getVoiceForPlayer(playerId: string): SpeechSynthesisVoice | null {
    if (this.preferredVoiceURI) {
      const preferred = this.voices.find((voice) => voice.voiceURI === this.preferredVoiceURI);
      if (preferred) return preferred;
    }

    if (this.voiceMap.has(playerId)) {
      return this.voiceMap.get(playerId) || null;
    }

    const voicesToUse = this.getVoicePool();
    if (voicesToUse.length === 0) return null;

    const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const voice = voicesToUse[hash % voicesToUse.length];
    const pitch = 0.95 + (hash % 3) / 20;
    const rate = 1.0;

    this.voiceMap.set(playerId, voice);
    this.pitchMap.set(playerId, pitch);
    this.rateMap.set(playerId, rate);

    return voice;
  }

  private hash(text: string): number {
    return text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }

  private getRoleVoice(role?: string): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number } {
    const pool = this.getVoicePool();
    if (!role || pool.length === 0) {
      return { voice: pool[0] || null, pitch: 1.0, rate: 1.0 };
    }

    const base = pool[Math.abs(this.hash(role)) % pool.length];
    const presets: Record<string, { pitch: number; rate: number }> = {
      villager: { pitch: 1.0, rate: 1.0 },
      werewolf: { pitch: 0.9, rate: 1.05 },
      seer: { pitch: 1.15, rate: 1.0 },
      witch: { pitch: 1.1, rate: 0.95 },
      guard: { pitch: 0.95, rate: 0.95 },
      hunter: { pitch: 0.85, rate: 1.0 },
      sheriff: { pitch: 1.05, rate: 1.0 },
    };

    const preset = presets[role] || { pitch: 1.0, rate: 1.0 };
    return { voice: base || null, pitch: preset.pitch, rate: preset.rate };
  }

  private cleanupAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }

  private async speakWithBackend(text: string, playerId: string, opts?: { role?: string }) {
    const status = await this.getBackendStatus();
    if (!status.enabled) return false;

    const isUserCompanion = playerId === 'user' || playerId === 'test-player';
    const voiceProfile = getVoiceProfile(playerId, isUserCompanion);
    const controller = new AbortController();
    this.currentAbortController = controller;

    const response = await fetch(`${this.getApiBaseUrl()}/api/tts/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        playerId,
        role: opts?.role,
        voiceStyle: voiceProfile.style,
        locale: voiceProfile.locale,
      }),
    });

    if (response.status === 204) return false;
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `tts_backend_${response.status}`);
    }

    const blob = await response.blob();
    if (!blob.size) return false;

    this.cleanupAudio();

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);

    this.currentAudio = audio;
    this.currentAudioUrl = objectUrl;

    audio.onplay = () => this.notify(true, text, playerId);
    audio.onended = () => {
      this.cleanupAudio();
      this.notify(false, text, playerId);
    };
    audio.onerror = () => {
      this.cleanupAudio();
      this.notify(false, text, playerId);
    };

    await audio.play();
    return true;
  }

  private speakWithBrowser(text: string, playerId: string, opts?: { role?: string }) {
    if (!this.synthesis) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    let voice: SpeechSynthesisVoice | null = null;
    let pitchFromMap: number | undefined;
    let rateFromMap: number | undefined;

    if (opts?.role) {
      const roleVoice = this.getRoleVoice(opts.role);
      voice = roleVoice.voice;
      pitchFromMap = roleVoice.pitch;
      rateFromMap = roleVoice.rate;
    } else {
      voice = this.getVoiceForPlayer(playerId);
      pitchFromMap = this.pitchMap.get(playerId) ?? undefined;
      rateFromMap = this.rateMap.get(playerId) ?? undefined;
    }

    if (voice) {
      utterance.voice = voice;
    }

    if (typeof pitchFromMap === 'number') utterance.pitch = pitchFromMap;
    utterance.rate = typeof rateFromMap === 'number' ? rateFromMap : 1.0;

    utterance.onstart = () => this.notify(true, text, playerId);
    utterance.onend = () => this.notify(false, text, playerId);
    utterance.onerror = () => this.notify(false, text, playerId);

    this.synthesis.speak(utterance);
  }

  private async speakInternal(text: string, playerId: string, opts?: { role?: string }) {
    this.stop();

    const shouldTryBackend = this.engineMode !== 'browser';
    if (shouldTryBackend) {
      try {
        const usedBackend = await this.speakWithBackend(text, playerId, opts);
        if (usedBackend) return;
      } catch (error) {
        console.warn('[TTSService] backend TTS failed, falling back to browser TTS', error);
      }
    }

    if (this.engineMode === 'backend') {
      return;
    }

    this.speakWithBrowser(text, playerId, opts);
  }

  public speak(text: string, playerId: string, opts?: { role?: string }) {
    void this.speakInternal(text, playerId, opts);
  }

  public stop() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    this.cleanupAudio();
    this.synthesis?.cancel();
    this.notify(false);
  }
}

export const tts = TTSService.getInstance();
