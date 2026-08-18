import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Achievement popup notification
interface AchievementProps {
  title: string;
  description: string;
  icon: string;
  show: boolean;
  onClose: () => void;
}

export function AchievementPopup({ title, description, icon, show, onClose }: AchievementProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed top-24 right-6 z-50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl"
            >
              {icon}
            </motion.div>
            <div>
              <div className="text-xs text-yellow-400/80 uppercase tracking-wider mb-1">Achievement Unlocked</div>
              <div className="font-bold text-white">{title}</div>
              <div className="text-sm text-white/60">{description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Level up animation
export function LevelUpEffect({ level, show }: { level: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-white mb-2"
            >
              Level Up!
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            >
              Lv. {level}
            </motion.div>
          </div>

          {/* Particle effects */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: 0,
                scale: [1, 0],
              }}
              transition={{ duration: 1, delay: i * 0.05 }}
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
              style={{
                background: ['#ff6b4a', '#4ecdc4', '#9d7aff', '#ffb347'][i % 4],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loading spinner with game theme
export function GameLoader({ text = 'Loading...' }: { text?: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border-4 border-transparent border-t-[#ff6b4a] border-r-[#4ecdc4] rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 border-4 border-transparent border-b-[#9d7aff] border-l-[#ffb347] rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center text-xl">🎮</div>
      </div>
      <span className="text-white/60 text-sm">{text}{dots}</span>
    </div>
  );
}

// Confetti effect
export function ConfettiEffect({ active }: { active: boolean }) {
  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: ['#ff6b4a', '#4ecdc4', '#9d7aff', '#ffb347', '#ff6b9d'][i % 5],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: -20, x: `${piece.x}vw`, rotate: 0, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: Math.random() * 720 - 360,
                opacity: 0,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn',
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ background: piece.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Glowing text effect
export function GlowingText({ children, color = '#ff6b4a' }: { children: React.ReactNode; color?: string }) {
  return (
    <motion.span
      animate={{
        textShadow: [
          `0 0 10px ${color}40`,
          `0 0 20px ${color}60`,
          `0 0 10px ${color}40`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ color }}
    >
      {children}
    </motion.span>
  );
}

// Progress bar with animation
export function AnimatedProgress({
  value,
  max = 100,
  color = '#ff6b4a',
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}) {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-white/60">{label}</span>
          <span className="text-white/80">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: color }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Tooltip component
export function GameTooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 border border-white/20 rounded-lg text-sm text-white whitespace-nowrap"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Animated button with effects
export function GameButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#ff6b4a] to-[#ff8a6d] text-white shadow-lg shadow-[#ff6b4a]/30',
    secondary: 'bg-white/10 border border-white/20 text-white',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative px-6 py-3 rounded-xl font-medium transition-colors ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </motion.button>
  );
}

// Card flip animation wrapper
export function FlipCard({
  front,
  back,
  isFlipped,
  onFlip,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  onFlip?: () => void;
}) {
  return (
    <div
      className="cursor-pointer perspective-1000"
      onClick={onFlip}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full"
        >
          {front}
        </div>
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full"
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

// Stagger children animation wrapper
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
}) {
  return (
    <div>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}