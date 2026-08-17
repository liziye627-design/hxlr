import { useEffect, useState } from 'react';
import { tts } from '../../services/TTSService';
import { motion, AnimatePresence } from 'framer-motion';

export const SubtitleOverlay = () => {
    const [subtitle, setSubtitle] = useState<{ text: string; playerId?: string } | null>(null);

    useEffect(() => {
        const unsubscribe = tts.subscribe((isPlaying, text, playerId) => {
            if (isPlaying && text) {
                setSubtitle({ text, playerId });
            } else {
                setSubtitle(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AnimatePresence>
            {subtitle && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4 pointer-events-none"
                >
                    <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-4 rounded-xl text-center shadow-2xl border border-white/10">
                        <p className="text-lg md:text-xl font-medium leading-relaxed tracking-wide">
                            {subtitle.text}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
