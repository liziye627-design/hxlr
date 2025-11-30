import React from 'react';
import { motion } from 'framer-motion';

interface SeerCheckCardProps {
    playerName: string;
    playerPosition: number;
    isWerewolf: boolean;
    round: number;
    className?: string;
}

/**
 * 预言家查验结果卡片
 * 显示在玩家头像旁边，表明该玩家已被预言家查验过
 */
export const SeerCheckCard: React.FC<SeerCheckCardProps> = ({
    isWerewolf,
    round,
    className = "",
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`absolute z-50 ${className}`}
        >
            {/* 身份卡片 */}
            <div className={`
                relative px-3 py-2 rounded-lg shadow-2xl border-2 backdrop-blur-md
                ${isWerewolf
                    ? 'bg-red-950/95 border-red-500/70 text-red-200'
                    : 'bg-emerald-950/95 border-emerald-500/70 text-emerald-200'
                }
            `}>
                {/* 标签 */}
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
                    第{round}晚查验
                </div>

                {/* 身份信息 */}
                <div className="flex items-center gap-2">
                    {/* 身份图标 */}
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full
                        ${isWerewolf ? 'bg-red-500/30' : 'bg-emerald-500/30'}
                    `}>
                        {isWerewolf ? (
                            // 狼人图标
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C10.89 2 10 2.89 10 4C10 4.55 10.22 5.05 10.59 5.41L7.5 8.5L4 5L2 7L5.5 10.5L8.59 13.59C8.22 13.95 8 14.45 8 15C8 16.11 8.89 17 10 17C10.55 17 11.05 16.78 11.41 16.41L14 13.83L16.59 16.41C16.95 16.78 17.45 17 18 17C19.11 17 20 16.11 20 15C20 14.45 19.78 13.95 19.41 13.59L22 11L20 9L16.5 12.5L13.41 9.41C13.78 9.05 14 8.55 14 8C14 6.89 13.11 6 12 6C11.45 6 10.95 6.22 10.59 6.59L12 8L10 10L8 8L9.41 6.59C9.05 6.22 8.55 6 8 6C6.89 6 6 6.89 6 8C6 8.55 6.22 9.05 6.59 9.41L9 12L6.59 14.41C6.22 14.05 6 13.55 6 13C6 11.89 5.11 11 4 11C2.89 11 2 11.89 2 13C2 14.11 2.89 15 4 15C4.55 15 5.05 14.78 5.41 14.41L8 17L10.59 19.59C10.22 19.95 10 20.45 10 21C10 22.11 10.89 23 12 23C13.11 23 14 22.11 14 21C14 20.45 13.78 19.95 13.41 19.59L16 17L18.59 14.41C18.95 14.78 19.45 15 20 15C21.11 15 22 14.11 22 13C22 11.89 21.11 11 20 11C18.89 11 18 11.89 18 13C18 13.55 18.22 14.05 18.59 14.41L16 17L13.41 14.41C13.78 14.05 14 13.55 14 13C14 11.89 13.11 11 12 11C10.89 11 10 11.89 10 13C10 13.55 10.22 14.05 10.59 14.41L12 16L10 18L8 16L9.41 14.41C9.05 14.05 8.55 14 8 14C6.89 14 6 14.89 6 16C6 17.11 6.89 18 8 18C8.55 18 9.05 17.78 9.41 17.41L12 20L14.59 17.41C14.95 17.78 15.45 18 16 18C17.11 18 18 17.11 18 16C18 14.89 17.11 14 16 14C15.45 14 14.95 14.22 14.59 14.59L12 17.17L9.41 14.59C9.78 14.22 10 13.72 10 13.17Z" />
                            </svg>
                        ) : (
                            // 好人图标
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" />
                            </svg>
                        )}
                    </div>

                    {/* 身份文字 */}
                    <div className="flex flex-col">
                        <span className={`
                            text-xs font-extrabold
                            ${isWerewolf ? 'text-red-400' : 'text-emerald-400'}
                        `}>
                            {isWerewolf ? '查杀' : '金水'}
                        </span>
                    </div>
                </div>

                {/* 边角装饰 */}
                <div className={`
                    absolute -top-1 -left-1 w-2 h-2 rounded-full
                    ${isWerewolf ? 'bg-red-500' : 'bg-emerald-500'}
                    animate-ping
                `} />
                <div className={`
                    absolute -top-1 -left-1 w-2 h-2 rounded-full
                    ${isWerewolf ? 'bg-red-500' : 'bg-emerald-500'}
                `} />
            </div>
        </motion.div>
    );
};
