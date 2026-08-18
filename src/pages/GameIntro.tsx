import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AGENT_SHOWROOM, type AgentShowcaseEntry } from '@/config/agentRoster';

// Floating particles component with enhanced effects
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: Math.random() * 12 + 8,
    color: ['#ff6b4a', '#4ecdc4', '#9d7aff', '#ffb347', '#ff6b9d', '#6bffc4'][Math.floor(Math.random() * 6)],
    shape: Math.random() > 0.8 ? 'square' : 'circle',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute opacity-15 ${p.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            background: p.color,
            animation: `floatUp ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Typing effect component
const TypingText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [text, started]);

  return (
    <span>
      {displayText}
      {displayText.length < text.length && started && <span className="animate-pulse">|</span>}
    </span>
  );
};

// Character type color mapping
const getCharacterColors = (type: AgentShowcaseEntry['type']) => {
  const colors = {
    alpha: { primary: '#ff6b4a', secondary: '#ff8a6d', glow: 'rgba(255,107,74,0.3)' },
    aqua: { primary: '#4ecdc4', secondary: '#7ee8e0', glow: 'rgba(78,205,196,0.3)' },
    shadow: { primary: '#9d7aff', secondary: '#b794ff', glow: 'rgba(157,122,255,0.3)' },
    rookie: { primary: '#ffb347', secondary: '#ffc970', glow: 'rgba(255,179,71,0.3)' },
  };
  return colors[type] || colors.aqua;
};

// Map agent ID to gallery image filename
const getGalleryImage = (agentId: string): string => {
  const imageMap: Record<string, string> = {
    'mao-pro': 'mao',
  };
  const imageName = imageMap[agentId] || agentId;
  return `/agent-gallery/${imageName}.png`;
};

// Animated character card with local images
const CharacterCard = ({
  agent,
  index,
  onSelect,
}: {
  agent: AgentShowcaseEntry;
  index: number;
  onSelect: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getCharacterColors(agent.type);
  const galleryImage = getGalleryImage(agent.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-2 rounded-[28px] blur-xl transition-opacity duration-500"
        style={{ background: colors.glow }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Card container */}
      <div
        className={`relative overflow-hidden rounded-2xl transition-all duration-400 ${
          isHovered ? 'scale-[1.02] shadow-2xl' : 'shadow-xl'
        }`}
        style={{
          boxShadow: isHovered ? `0 25px 50px -12px ${colors.glow}` : undefined,
        }}
      >
        {/* Gradient border */}
        <div
          className="absolute inset-0 p-[1px] rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          <div className="w-full h-full rounded-2xl bg-[#0d0d1a]" />
        </div>

        {/* Content */}
        <div className="relative p-4">
          {/* Character image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-black/30">
            <img
              src={galleryImage}
              alt={agent.name}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = agent.previewImage;
              }}
            />
            {/* Overlay gradient */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: `linear-gradient(to top, ${colors.primary}cc 0%, transparent 50%)`,
              }}
            />

            {/* Type badge */}
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: `${colors.primary}dd`,
                color: 'white',
              }}
            >
              {agent.type}
            </div>

            {/* Stats overlay on hover */}
            <motion.div
              className="absolute inset-x-0 bottom-0 p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2">
                {agent.traits.slice(0, 3).map((trait) => (
                  <span
                    key={trait}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white/90 backdrop-blur-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Info section */}
          <div className="relative">
            <h3 className="text-lg font-bold text-white mb-0.5">{agent.name}</h3>
            <p className="text-xs mb-2" style={{ color: colors.primary }}>
              {agent.title}
            </p>
            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
              {agent.tagline}
            </p>

            {/* Score indicators */}
            <div className="flex gap-3 mt-3">
              {[
                { label: '化学', value: agent.scoreSeed.chemistry },
                { label: '推理', value: agent.scoreSeed.deduction },
                { label: '关键', value: agent.scoreSeed.clutch },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 text-center">
                  <div className="text-xs text-white/40">{stat.label}</div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: colors.primary }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Game mode card
const GameModeCard = ({
  icon,
  title,
  description,
  color,
  path,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  path: string;
  delay: number;
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(path)}
    >
      <div
        className={`relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 ${
          isHovered ? 'scale-105 border-white/20' : ''
        }`}
        style={{
          boxShadow: isHovered ? `0 20px 40px ${color}22` : undefined,
        }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        <div className="relative">
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/50 mb-4">{description}</p>

          <div
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: isHovered ? color : 'rgba(255,255,255,0.6)' }}
          >
            <span>开始游戏</span>
            <motion.span animate={{ x: isHovered ? 5 : 0 }}>→</motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Animated counter
const AnimatedCounter = ({
  value,
  label,
  suffix = '',
}: {
  value: number;
  label: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const end = value;
          const duration = 2000;
          const increment = end / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white">
        {count}
        {suffix}
      </div>
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </div>
  );
};

// Main component
export default function GameIntro() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredAgents = AGENT_SHOWROOM.slice(0, 6);

  const gameModes = [
    {
      icon: '⛏️',
      title: 'Minecraft 探险',
      description: '与 AI 伙伴一起探索无限世界',
      color: '#4ecdc4',
      path: '/minecraft',
    },
    {
      icon: '🐺',
      title: '狼人杀',
      description: '经典社交推理，AI 角色身临其境',
      color: '#9d7aff',
      path: '/werewolf',
    },
    {
      icon: '🎭',
      title: '剧本杀',
      description: '沉浸式推理剧本，多结局体验',
      color: '#ff6b4a',
      path: '/script-murder',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden">
      {/* CSS Animations */}
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { transform: translateY(-50px) rotate(360deg); opacity: 0; }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
      `}</style>

      {/* Particles */}
      <FloatingParticles />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 25% ${25 + scrollY * 0.02}%, rgba(255,107,74,0.12), transparent 50%),
              radial-gradient(circle at 75% ${30 + scrollY * 0.03}%, rgba(78,205,196,0.12), transparent 50%),
              radial-gradient(circle at 50% ${70 - scrollY * 0.02}%, rgba(157,122,255,0.12), transparent 50%)
            `,
          }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <img
                src="/images/logo/aiverse-icon.svg"
                alt="AIverse"
                className="w-20 h-20 md:w-24 md:h-24"
              />
              <motion.div
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,107,74,0.4), rgba(78,205,196,0.4), rgba(157,122,255,0.4))',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
              <span className="text-lg">✨</span>
              <span className="text-sm text-white/60">Next Generation AI Gaming</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black mb-6"
          >
            <span className="bg-gradient-to-r from-[#ff6b4a] via-[#4ecdc4] to-[#9d7aff] bg-clip-text text-transparent animate-gradient">
              AI
            </span>
            <span className="text-white">verse</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-white/70 mb-3 font-light"
          >
            <TypingText text="你的 AI 伙伴正在等待" delay={500} />
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base text-white/40 max-w-xl mx-auto mb-10"
          >
            与智能 AI 伙伴一起探索游戏世界。从 Minecraft 探险到狼人杀对决，每一次冒险都充满惊喜。
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/partner')}
              className="relative px-10 py-4 rounded-full font-bold text-lg overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #ff6b4a, #ff8a6d)',
                boxShadow: '0 10px 40px rgba(255,107,74,0.3)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2 text-white">
                开始冒险
                <span className="text-xl">→</span>
              </span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ y: '100%' }}
                whileHover={{ y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="px-10 py-4 rounded-full font-bold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
            >
              挑选队友
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1 h-2 rounded-full bg-white/50"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl border border-white/10 bg-white/5">
            <AnimatedCounter value={9} label="AI 角色" suffix="+" />
            <AnimatedCounter value={3} label="游戏模式" />
            <AnimatedCounter value={100} label="智能程度" suffix="%" />
            <AnimatedCounter value={24} label="在线陪伴" suffix="h" />
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              <span className="text-white">认识你的 </span>
              <span className="bg-gradient-to-r from-[#ff6b4a] to-[#9d7aff] bg-clip-text text-transparent">
                AI 伙伴
              </span>
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              每个角色都有独特的性格、能力和互动方式
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredAgents.map((agent, index) => (
              <CharacterCard
                key={agent.id}
                agent={agent}
                index={index}
                onSelect={() => navigate('/partner')}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3 rounded-full border border-white/20 text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm"
            >
              查看全部 {AGENT_SHOWROOM.length} 位角色 →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Game Modes */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">选择你的冒险</h2>
            <p className="text-white/50">三大游戏模式，无限可能</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {gameModes.map((mode, i) => (
              <GameModeCard key={mode.title} {...mode} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              准备好开始了吗？
            </h2>
            <p className="text-lg text-white/50 mb-10">
              加入玩家社区，与你的 AI 伙伴一起探索无限可能
            </p>

            <button
              onClick={() => navigate('/partner')}
              className="relative px-14 py-5 rounded-full font-bold text-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4ecdc4, #9d7aff)',
                boxShadow: '0 10px 40px rgba(78,205,196,0.3)',
              }}
            >
              <span className="relative z-10 flex items-center gap-3 text-white">
                <span>立即开始</span>
                <span className="text-xl">🚀</span>
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo/aiverse-logo.svg"
              alt="AIverse"
              className="w-8 h-8"
            />
            <span className="text-xl font-black bg-gradient-to-r from-[#ff6b4a] to-[#9d7aff] bg-clip-text text-transparent">
              AIverse
            </span>
          </div>
          <p className="text-white/30 text-sm">Powered by Claude AI</p>
        </div>
      </footer>
    </div>
  );
}