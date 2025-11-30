import { useCallback } from 'react';
import { soundManager, type SoundEffect } from '../services/SoundManager';

/**
 * Hook for using sound effects in components
 */
export function useSoundEffects() {
    const playSound = useCallback((effect: SoundEffect) => {
        soundManager.play(effect);
    }, []);

    const setVolume = useCallback((volume: number) => {
        soundManager.setVolume(volume);
    }, []);

    const toggleMute = useCallback(() => {
        return soundManager.toggleMute();
    }, []);

    const mute = useCallback(() => {
        soundManager.mute();
    }, []);

    const unmute = useCallback(() => {
        soundManager.unmute();
    }, []);

    return {
        playSound,
        setVolume,
        toggleMute,
        mute,
        unmute,
        getVolume: () => soundManager.getVolume(),
        isMuted: () => soundManager.isSoundMuted(),
    };
}
