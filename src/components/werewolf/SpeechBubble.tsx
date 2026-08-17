import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
    content: string;
    playerName: string;
    isVisible: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
    content,
    playerName,
    isVisible,
    position = 'top',
}) => {
    // 调整了定位逻辑，增加 gap 防止紧贴
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3',
    };

    // 优化：针对不同方向旋转 SVG 箭头
    const arrowRotation = {
        top: 'rotate-0 -bottom-2 left-1/2 -translate-x-1/2',
        bottom: 'rotate-180 -top-2 left-1/2 -translate-x-1/2',
        left: '-rotate-90 -right-2 top-1/2 -translate-y-1/2',
        right: 'rotate-90 -left-2 top-1/2 -translate-y-1/2',
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    // 增加 pointer-events-none 防止气泡遮挡下方点击操作，
                    // 但允许气泡内的文本被选中(pointer-events-auto)
                    className={`absolute ${positionClasses[position]} z-[100] w-max max-w-[260px] pointer-events-none`}
                >
                    <div className="relative pointer-events-auto">
                        {/* 主体内容 */}
                        <div className="bg-slate-800/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border border-slate-600/50">
                            {/* Player name */}
                            <div className="text-xs text-blue-400 font-bold mb-1 tracking-wide uppercase flex items-center gap-2">
                                {playerName}
                                {/* 加个小图标表示正在发言 */}
                                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            </div>

                            {/* Speech content: 增加最大高度和滚动 */}
                            <div className="text-sm text-slate-200 leading-relaxed font-medium max-h-[200px] overflow-y-auto scrollbar-hide">
                                {content}
                            </div>
                        </div>

                        {/* 优化后的 SVG 箭头 (带边框完美匹配) */}
                        <svg
                            className={`absolute ${arrowRotation[position]} w-4 h-3 text-slate-800/95 fill-current`}
                            viewBox="0 0 16 12" // 自定义 viewBox 适配三角形
                            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
                        >
                            {/* 两个 path，一个做边框，一个做填充，实现无缝衔接 */}
                            {/* 边框层 (颜色匹配 border-slate-600) */}
                            <path d="M0 0 L8 12 L16 0" stroke="#475569" strokeWidth="1.5" fill="none" className="opacity-50" />
                            {/* 填充层 (颜色匹配 bg-slate-800) */}
                            <path d="M1 0 L8 10 L15 0" fill="currentColor" stroke="none" />
                        </svg>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
