import { motion } from 'framer-motion';

interface SpeechWaveProps {
    isSpeaking: boolean;
    className?: string;
}

export const SpeechWave = ({ isSpeaking, className = '' }: SpeechWaveProps) => {
    if (!isSpeaking) return null;

    return (
        <div className={`flex items-center justify-center gap-1 h-4 ${className}`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-green-400 rounded-full"
                    animate={{
                        height: [4, 12, 4],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};
