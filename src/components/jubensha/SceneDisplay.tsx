import { motion, AnimatePresence } from 'framer-motion';

interface Scene {
    id: string;
    name: string;
    description: string;
    backgroundUrl: string;
    atmosphere: string;
}

interface SceneDisplayProps {
    scene: Scene;
}

export function SceneDisplay({ scene }: SceneDisplayProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="relative h-64 overflow-hidden"
            >
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                    style={{
                        backgroundImage: `url(${scene.backgroundUrl || 'https://source.unsplash.com/random/1920x1080?mystery,dark'})`,
                    }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />

                {/* Atmospheric particles effect */}
                <div className="absolute inset-0 opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                {/* Scene Information */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-bold text-white drop-shadow-lg"
                    >
                        {scene.name}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-200 text-lg max-w-2xl drop-shadow-md"
                    >
                        {scene.description}
                    </motion.p>

                    {/* Atmosphere tag */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                    >
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-white text-sm font-medium">
                            {scene.atmosphere}
                        </span>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
