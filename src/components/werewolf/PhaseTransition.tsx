import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

interface PhaseTransitionProps {
    phase: string;
    message?: string;
    onComplete?: () => void;
}

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
    phase,
    message,
    onComplete,
}) => {
    const [showTransition, setShowTransition] = useState(false);
    const [transitionType, setTransitionType] = useState<'day' | 'night' | null>(null);

    useEffect(() => {
        if (phase === 'NIGHT') {
            setTransitionType('night');
            setShowTransition(true);
        } else if (phase === 'DAY_DISCUSS' || phase === 'DAY_RESULT') {
            setTransitionType('day');
            setShowTransition(true);
        }
    }, [phase]);

    useEffect(() => {
        if (showTransition) {
            // Auto-dismiss after a delay; compressed durations to tighten rhythm
            // Day: 0.9s, Night: 1.2s
            const duration = transitionType === 'day' ? 900 : 1200;
            const timer = setTimeout(() => {
                setShowTransition(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [showTransition, transitionType]);

    const handleExitComplete = () => {
        if (onComplete) onComplete();
    };

    return (
        <AnimatePresence onExitComplete={handleExitComplete}>
            {showTransition && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`fixed inset-0 z-40 flex items-center justify-center pointer-events-none backdrop-blur-sm
            ${transitionType === 'night' ? 'bg-slate-950/80' : 'bg-sky-100/80'}
          `}
                >
                    <div className="relative text-center">
                        {transitionType === 'night' && (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="flex flex-col items-center"
                            >
                                <Moon className="w-32 h-32 text-yellow-100 fill-yellow-100 drop-shadow-[0_0_30px_rgba(253,224,71,0.5)]" />
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl font-bold text-slate-200 mt-8 tracking-widest"
                                >
                                    夜幕降临
                                </motion.h2>
                                {message && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-xl text-slate-300 mt-4"
                                    >
                                        {message}
                                    </motion.p>
                                )}
                            </motion.div>
                        )}

                        {transitionType === 'day' && (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="flex flex-col items-center"
                            >
                                <Sun className="w-32 h-32 text-orange-500 fill-orange-500 drop-shadow-[0_0_50px_rgba(249,115,22,0.6)]" />
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl font-bold text-slate-800 mt-8 tracking-widest"
                                >
                                    旭日东升
                                </motion.h2>
                                {message && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-xl text-slate-600 mt-4"
                                    >
                                        {message}
                                    </motion.p>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
