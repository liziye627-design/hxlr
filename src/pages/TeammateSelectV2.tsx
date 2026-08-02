import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AGENT_SHOWROOM, type AgentShowcaseEntry } from '@/config/agentRoster';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { agentReviewApi } from '@/db/api';
import type { AgentLeaderboardEntry } from '@/types';
import { MessageCircle, Zap, Target, Users, Sparkles, ChevronRight, Star, Shield } from 'lucide-react';

// Particle System Component
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ['#7C3AED', '#A78BFA', '#F43F5E', '#00FFFF', '#00FF00'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 15, 35, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// Scanline Overlay
function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 opacity-[0.03]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 255, 255, 0.1) 2px,
          rgba(0, 255, 255, 0.1) 4px
        )`,
      }}
    />
  );
}

// Glitch Text Effect
function GlitchText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 animate-pulse text-cyan-400"
        style={{ clipPath: 'inset(0 0 50% 0)', transform: 'translate(-2px, 0)' }}
        aria-hidden="true"
      >
        {children}
      </span>
      <span
        className="absolute inset-0 animate-pulse text-rose-400"
        style={{ clipPath: 'inset(50% 0 0 0)', transform: 'translate(2px, 0)' }}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  );
}

// Stat Bar Component
function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="group">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-white/60">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}80`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

// Character Card Component
function CharacterCard({
  agent,
  index,
  isSelected,
  onSelect,
  onChat,
  leaderboardEntry,
}: {
  agent: AgentShowcaseEntry;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onChat: () => void;
  leaderboardEntry: AgentLeaderboardEntry | null;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const accentColors: Record<string, { primary: string; secondary: string; glow: string }> = {
    alpha: { primary: '#F43F5E', secondary: '#FB7185', glow: 'rgba(244, 63, 94, 0.4)' },
    aqua: { primary: '#00FFFF', secondary: '#67E8F9', glow: 'rgba(0, 255, 255, 0.4)' },
    shadow: { primary: '#A78BFA', secondary: '#C4B5FD', glow: 'rgba(167, 139, 250, 0.4)' },
    rookie: { primary: '#4ADE80', secondary: '#86EFAC', glow: 'rgba(74, 222, 128, 0.4)' },
  };

  const colors = accentColors[agent.type] || accentColors.alpha;
  const rating = leaderboardEntry?.averageOverall ?? agent.scoreSeed.chemistry / 20;

  return (
    <div
      className="group relative"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effect */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}20)`,
          opacity: isHovered || isSelected ? 1 : 0,
        }}
      />

      {/* Card Container */}
      <div
        className={`relative h-[480px] w-full cursor-pointer transition-transform duration-700 ease-out ${
          isHovered ? 'scale-[1.02]' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Neon Border */}
          <div
            className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
            style={{
              border: `2px solid ${colors.primary}`,
              boxShadow: `inset 0 0 30px ${colors.glow}, 0 0 30px ${colors.glow}`,
              opacity: isHovered || isSelected ? 0.6 : 0,
            }}
          />

          {/* Character Image */}
          <div className="relative h-[55%] overflow-hidden">
            <img
              src={agent.previewImage}
              alt={agent.name}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, transparent 30%, rgba(15, 15, 35, 0.9) 100%, ${colors.primary}10)`,
              }}
            />

            {/* Rating Badge */}
            <div
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-3 py-1.5 backdrop-blur-md"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}20)`,
                border: `1px solid ${colors.primary}60`,
              }}
            >
              <Star className="h-3 w-3" style={{ color: colors.primary }} />
              <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
            </div>

            {/* Type Badge */}
            <div
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
              style={{
                background: `${colors.primary}20`,
                border: `1px solid ${colors.primary}40`,
                color: colors.primary,
              }}
            >
              {agent.type}
            </div>
          </div>

          {/* Character Info */}
          <div className="relative h-[45%] p-5">
            {/* Animated Line */}
            <div
              className="absolute left-0 top-0 h-0.5 w-0 transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, transparent)`,
                width: isHovered ? '100%' : '0%',
              }}
            />

            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
              {agent.title}
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: "'Russo One', sans-serif" }}>
              {agent.name}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-white/60">{agent.tagline}</p>

            {/* Stats Preview */}
            <div className="grid grid-cols-2 gap-3">
              <StatBar label="Chemistry" value={agent.scoreSeed.chemistry} color={colors.primary} delay={0} />
              <StatBar label="Deduction" value={agent.scoreSeed.deduction} color={colors.secondary} delay={100} />
            </div>

            {/* Flip Hint */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-xs text-white/30">Click to flip</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] p-5"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">{agent.title}</div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Russo One', sans-serif" }}>
                {agent.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                isSelected
                  ? 'bg-white/10 text-white ring-1 ring-white/20'
                  : 'bg-gradient-to-r from-violet-600 to-rose-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
              }`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          </div>

          {/* Full Stats */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <StatBar label="Chemistry" value={agent.scoreSeed.chemistry} color="#00FFFF" delay={0} />
            <StatBar label="Deduction" value={agent.scoreSeed.deduction} color="#A78BFA" delay={50} />
            <StatBar label="Clutch" value={agent.scoreSeed.clutch} color="#F43F5E" delay={100} />
            <StatBar label="Ambience" value={agent.scoreSeed.ambience} color="#4ADE80" delay={150} />
          </div>

          {/* Traits */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Traits</div>
            <div className="flex flex-wrap gap-2">
              {agent.traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Opening Line */}
          <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">Opening</div>
            <p className="text-sm italic text-white/70">"{agent.openingLine}"</p>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-5 left-5 right-5 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChat();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-rose-500 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/25"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Start Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function TeammateSelectV2() {
  const navigate = useNavigate();
  const { selectedAgentId, setSelectedAgentId } = useAgentSelection();
  const [filter, setFilter] = useState<'all' | 'alpha' | 'aqua' | 'shadow' | 'rookie'>('all');
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardEntry[]>([]);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await agentReviewApi.getLeaderboard();
      setLeaderboard(entries);
    };
    void loadLeaderboard();
  }, []);

  const filteredAgents = filter === 'all' ? AGENT_SHOWROOM : AGENT_SHOWROOM.filter((a) => a.type === filter);

  const getLeaderboardEntry = useCallback(
    (agentId: string): AgentLeaderboardEntry | null => {
      return leaderboard.find((entry) => entry.agentId === agentId) ?? null;
    },
    [leaderboard]
  );

  const handleSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const handleChat = (agentId: string) => {
    setSelectedAgentId(agentId);
    navigate('/chat/room');
  };

  const filterOptions = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'alpha', label: 'Alpha', icon: Target },
    { key: 'aqua', label: 'Aqua', icon: Sparkles },
    { key: 'shadow', label: 'Shadow', icon: Zap },
    { key: 'rookie', label: 'Rookie', icon: Shield },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f23]">
      {/* Background Effects */}
      <ParticleBackground />
      <ScanlineOverlay />

      {/* Gradient Overlays */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #F43F5E 0%, transparent 70%)' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-rose-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Russo One', sans-serif" }}>
                  NEXUS
                </h1>
                <p className="text-xs text-white/40">Game Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                {filteredAgents.length} Characters
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative px-6 py-12 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
              <Sparkles className="h-4 w-4" />
              <span>Choose Your Ally</span>
            </div>

            <h2 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl" style={{ fontFamily: "'Russo One', sans-serif" }}>
              Select Your{' '}
              <GlitchText className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
                Teammate
              </GlitchText>
            </h2>

            <p className="mx-auto max-w-xl text-lg text-white/50">
              Each companion has unique abilities. Find your perfect match for any game mode.
            </p>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="sticky top-0 z-30 border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap justify-center gap-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                const isActive = filter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    onMouseEnter={() => setHoveredFilter(option.key)}
                    onMouseLeave={() => setHoveredFilter(null)}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/25'
                        : 'border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Character Grid */}
        <section className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAgents.map((agent, index) => (
                <CharacterCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={() => handleSelect(agent.id)}
                  onChat={() => handleChat(agent.id)}
                  leaderboardEntry={getLeaderboardEntry(agent.id)}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredAgents.length === 0 && (
              <div className="py-20 text-center">
                <div className="mb-4 text-6xl opacity-20">🎮</div>
                <p className="text-lg text-white/40">No characters found in this category</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black/20 px-6 py-6 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-sm text-white/30">
              Click cards to flip and see details. Select a companion to start your journey.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}