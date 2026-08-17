import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GodNarratorProps {
    message: string;
    isVisible: boolean;
    onComplete?: () => void;
}

export const GodNarrator: React.FC<GodNarratorProps> = ({
    message,
    isVisible,
    onComplete,
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const onCompleteRef = React.useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (isVisible && message) {
            setDisplayedText('');
            setIsTyping(true);
            let currentIndex = 0;

            const intervalId = setInterval(() => {
                if (currentIndex < message.length) {
                    setDisplayedText((prev) => prev + message[currentIndex]);
                    currentIndex++;
                } else {
                    clearInterval(intervalId);
                    setIsTyping(false);
                    if (onCompleteRef.current) {
                        setTimeout(onCompleteRef.current, 2000); // Wait 2 seconds after typing finishes
                    }
                }
            }, 200); // Typing speed

            return () => clearInterval(intervalId);
        } else {
            setDisplayedText('');
        }
    }, [message, isVisible]); // Removed onComplete from dependencies

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
                >
                    <div className="bg-black/80 backdrop-blur-md border-y-2 border-amber-500/50 px-12 py-4 shadow-2xl min-w-[300px] text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-serif text-amber-100 tracking-widest"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                        >
                            {displayedText}
                            {isTyping && (
                                <span className="animate-pulse ml-1">|</span>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
