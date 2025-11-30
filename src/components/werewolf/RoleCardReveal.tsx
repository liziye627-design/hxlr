import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface RoleCardRevealProps {
    role: string;
    playerName: string;
    onClose: () => void;
    isVisible: boolean;
    autoFlip?: boolean;
}

const getRoleInfo = (role: string) => {
    const roleData: Record<string, { name: string; color: string; emoji: string; description: string }> = {
        werewolf: {
            name: '狼人',
            color: 'from-red-600 to-red-800',
            emoji: '🐺',
            description: '夜晚睁眼，与狼人同伴商议击杀一名玩家'
        },
        villager: {
            name: '村民',
            color: 'from-green-600 to-green-800',
            emoji: '👨',
            description: '平民身份，白天靠推理找出狼人'
        },
        seer: {
            name: '预言家',
            color: 'from-blue-600 to-blue-800',
            emoji: '🔮',
            description: '每晚可以查验一名玩家的身份'
        },
        witch: {
            name: '女巫',
            color: 'from-purple-600 to-purple-800',
            emoji: '🧙‍♀️',
            description: '拥有一瓶解药和一瓶毒药'
        },
        hunter: {
            name: '猎人',
            color: 'from-orange-600 to-orange-800',
            emoji: '🏹',
            description: '死亡时可以开枪带走一名玩家'
        },
        guard: {
            name: '守卫',
            color: 'from-cyan-600 to-cyan-800',
            emoji: '🛡️',
            description: '每晚可以守护一名玩家'
        },
    };
    return roleData[role] || { name: '未知', color: 'from-gray-600 to-gray-800', emoji: '❓', description: '未知角色' };
};

export const RoleCardReveal: React.FC<RoleCardRevealProps> = ({
    role,
    playerName,
    onClose,
    isVisible,
    autoFlip = true,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const roleInfo = getRoleInfo(role);

    const handleCardClick = () => {
        if (!isFlipped) {
            setIsFlipped(true);
            // Play flip sound
            setTimeout(() => {
                // Auto close after 5 seconds
                // setTimeout(onClose, 5000);
            }, 800);
        }
    };

    React.useEffect(() => {
        if (isVisible && autoFlip && !isFlipped) {
            const t = setTimeout(() => setIsFlipped(true), 300);
            return () => clearTimeout(t);
        }
    }, [isVisible, autoFlip, isFlipped]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={(e: React.MouseEvent) => {
                        if (e.target === e.currentTarget && isFlipped) {
                            onClose();
                        }
                    }}
                >
                    <div className="relative max-w-md w-full">
                        {/* Close button */}
                        {isFlipped && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 }}
                                className="absolute -top-12 right-0 z-10"
                            >
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    size="icon"
                                    className="bg-white/10 hover:bg-white/20 text-white rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Instruction text */}
                        {!isFlipped && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-6 text-white"
                            >
                                <h2 className="text-2xl font-bold mb-2">{playerName}</h2>
                                <p className="text-lg text-slate-300">
                                    点击卡牌查看你的身份
                                </p>
                            </motion.div>
                        )}

                        {/* Card container with 3D flip effect */}
                        <div
                            className="perspective-1000 cursor-pointer"
                            onClick={handleCardClick}
                        >
                            <motion.div
                                className="relative w-full aspect-[2/3] preserve-3d"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {/* Card back */}
                                <div
                                    className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1">
                                        <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-6xl mb-4">🎴</div>
                                                <div className="text-white text-xl font-bold">狼人杀</div>
                                                <div className="text-slate-400 text-sm mt-2">Identity Card</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card front (role reveal) */}
                                <div
                                    className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                    }}
                                >
                                    <div className={`w-full h-full bg-gradient-to-br ${roleInfo.color} p-6 flex flex-col justify-between`}>
                                        <div className="text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: isFlipped ? 1 : 0 }}
                                                transition={{ delay: 0.5, type: "spring" }}
                                                className="text-8xl mb-4"
                                            >
                                                {roleInfo.emoji}
                                            </motion.div>
                                            <motion.h3
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                                                transition={{ delay: 0.7 }}
                                                className="text-4xl font-bold text-white mb-2"
                                            >
                                                {roleInfo.name}
                                            </motion.h3>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isFlipped ? 1 : 0 }}
                                            transition={{ delay: 0.9 }}
                                            className="bg-black/30 backdrop-blur-sm rounded-lg p-4"
                                        >
                                            <p className="text-white text-center text-sm leading-relaxed">
                                                {roleInfo.description}
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isFlipped ? 1 : 0 }}
                                            transition={{ delay: 1.1 }}
                                            className="text-center text-white/60 text-xs"
                                        >
                                            请记住你的身份，点击关闭继续游戏
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Pulse animation hint */}
                        {!isFlipped && (
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 rounded-2xl border-4 border-white/30 pointer-events-none"
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
