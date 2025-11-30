import { useState, useCallback } from 'react';

interface Speech {
    id: string;
    playerId: string;
    playerName: string;
    content: string;
    timestamp: number;
}

interface ActiveSpeech {
    playerId: string;
    playerName: string;
    content: string;
}

export const usePlayerSpeeches = () => {
    const [activeSpeeches, setActiveSpeeches] = useState<Map<string, ActiveSpeech>>(new Map());
    const [speechHistory, setSpeechHistory] = useState<Speech[]>([]);

    // Display duration for speech bubbles (in milliseconds)
    const SPEECH_DISPLAY_DURATION = 5000; // 5 seconds

    const addSpeech = useCallback((playerId: string, playerName: string, content: string) => {
        const speechId = `${playerId}_${Date.now()}`;

        // Add to history
        setSpeechHistory(prev => [...prev, {
            id: speechId,
            playerId,
            playerName,
            content,
            timestamp: Date.now(),
        }]);

        // Add to active speeches
        setActiveSpeeches(prev => {
            const next = new Map(prev);
            next.set(playerId, { playerId, playerName, content });
            return next;
        });

        // Auto-remove after duration
        setTimeout(() => {
            setActiveSpeeches(prev => {
                const next = new Map(prev);
                next.delete(playerId);
                return next;
            });
        }, SPEECH_DISPLAY_DURATION);
    }, []);

    const clearSpeech = useCallback((playerId: string) => {
        setActiveSpeeches(prev => {
            const next = new Map(prev);
            next.delete(playerId);
            return next;
        });
    }, []);

    const clearAllSpeeches = useCallback(() => {
        setActiveSpeeches(new Map());
    }, []);

    return {
        activeSpeeches,
        speechHistory,
        addSpeech,
        clearSpeech,
        clearAllSpeeches,
    };
};
