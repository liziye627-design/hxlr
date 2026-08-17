/**
 * Sound Manager for Werewolf Game
 * Manages game sound effects with volume control and mute functionality
 */

export type SoundEffect =
    | 'night-transition'
    | 'day-transition'
    | 'player-death'
    | 'voting'
    | 'skill-use'
    | 'game-start'
    | 'game-end'
    | 'sheriff-elected'
    | 'timer-tick';

interface SoundConfig {
    src: string;
    volume?: number;
    loop?: boolean;
}

const SOUND_EFFECTS: Record<SoundEffect, SoundConfig> = {
    'night-transition': { src: '/sounds/night-transition.mp3', volume: 0.7 },
    'day-transition': { src: '/sounds/day-transition.mp3', volume: 0.7 },
    'player-death': { src: '/sounds/player-death.mp3', volume: 0.6 },
    'voting': { src: '/sounds/voting.mp3', volume: 0.5 },
    'skill-use': { src: '/sounds/skill-use.mp3', volume: 0.6 },
    'game-start': { src: '/sounds/game-start.mp3', volume: 0.8 },
    'game-end': { src: '/sounds/game-end.mp3', volume: 0.8 },
    'sheriff-elected': { src: '/sounds/sheriff-elected.mp3', volume: 0.7 },
    'timer-tick': { src: '/sounds/timer-tick.mp3', volume: 0.3 },
};

class SoundManager {
    private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
    private masterVolume = 1.0;
    private isMuted = false;

    constructor() {
        this.preloadSounds();
    }

    /**
     * Preload all sound effects
     */
    private preloadSounds() {
        Object.entries(SOUND_EFFECTS).forEach(([key, config]) => {
            const audio = new Audio(config.src);
            audio.volume = (config.volume || 1.0) * this.masterVolume;
            audio.loop = config.loop || false;
            audio.preload = 'auto';

            // Handle loading errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${key}`);
            });

            this.sounds.set(key as SoundEffect, audio);
        });
    }

    /**
     * Play a sound effect
     */
    play(effect: SoundEffect) {
        if (this.isMuted) return;

        const audio = this.sounds.get(effect);
        if (!audio) {
            console.warn(`Sound effect not found: ${effect}`);
            return;
        }

        // Clone audio for overlapping sounds
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = audio.volume * this.masterVolume;

        clone.play().catch((error) => {
            console.warn(`Failed to play sound ${effect}:`, error);
        });
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        // Update all existing sounds
        this.sounds.forEach((audio, key) => {
            const config = SOUND_EFFECTS[key];
            audio.volume = (config.volume || 1.0) * this.masterVolume;
        });
    }

    /**
     * Get current volume
     */
    getVolume(): number {
        return this.masterVolume;
    }

    /**
     * Mute all sounds
     */
    mute() {
        this.isMuted = true;
    }

    /**
     * Unmute all sounds
     */
    unmute() {
        this.isMuted = false;
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Check if muted
     */
    isSoundMuted(): boolean {
        return this.isMuted;
    }

    /**
     * Stop all currently playing sounds
     */
    stopAll() {
        this.sounds.forEach((audio) => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export type for use in components
export type { SoundManager };
