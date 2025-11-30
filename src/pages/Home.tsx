import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, ScrollText, Binary, ArrowRight, ChevronDown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { companionApi } from '@/db/api';
import type { AICompanion } from '@/types';
import { motion } from 'framer-motion';

// Full Screen Section Component
function FullScreenSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`h-screen w-full snap-start relative flex items-center justify-center overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

export default function Home() {
  const { user } = useUser();
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    const data = await companionApi.getAllCompanions();
    setCompanions(data.slice(0, 4));
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPosition = containerRef.current.scrollTop;
      const windowHeight = window.innerHeight;
      const currentSection = Math.round(scrollPosition / windowHeight);
      setActiveSection(currentSection);
    }
  };

  const scrollToSection = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen w-full bg-[#030014] text-white overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
    >
      {/* Floating Navigation Dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSection === index
              ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
              : 'bg-white/20 hover:bg-white/50'
              }`}
          />
        ))}
      </div>

      {/* Section 1: Hero Portal */}
      <FullScreenSection className="bg-[#030014]">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        </div>

        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Badge className="mb-8 bg-white/5 text-white border-white/10 px-6 py-2 text-base backdrop-blur-md rounded-full">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              次世代 AI 游戏平台
            </Badge>

            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">
              NEXUS
            </h1>

            <p className="text-2xl md:text-3xl text-gray-400 mb-12 font-light tracking-wide">
              当 AI 遇见无限想象
            </p>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer"
              onClick={() => scrollToSection(1)}
            >
              <div className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors">
                <span className="text-sm uppercase tracking-widest">探索世界</span>
                <ChevronDown className="w-6 h-6" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </FullScreenSection>

      {/* Section 2: Werewolf World */}
      <FullScreenSection className="relative">
        <div className="absolute inset-0">
          <img
            src="/images/werewolf-bg-v2.png"
            alt="Werewolf"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030014] via-[#030014]/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-purple-600/20 text-purple-400 backdrop-blur-xl border border-purple-500/30">
                <Users className="w-12 h-12" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white">AI 狼人杀</h2>
            </div>

            <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
              踏入充满谎言与推理的村庄。拥有独特个性的 AI 玩家将与你一同伪装、推理、投票。你能活过今晚吗？
            </p>

            <div className="flex flex-wrap gap-4">
              <Badge variant="outline" className="text-lg py-2 px-4 border-purple-500/50 text-purple-300 bg-purple-500/10">实时语音</Badge>
              <Badge variant="outline" className="text-lg py-2 px-4 border-purple-500/50 text-purple-300 bg-purple-500/10">AI 逻辑推理</Badge>
              <Badge variant="outline" className="text-lg py-2 px-4 border-purple-500/50 text-purple-300 bg-purple-500/10">多人联机</Badge>
            </div>

            <Link to="/werewolf">
              <Button size="lg" className="mt-8 h-16 px-12 text-xl rounded-full bg-purple-600 hover:bg-purple-700 shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all hover:scale-105">
                进入游戏
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </FullScreenSection>

      {/* Section 3: Script Murder World */}
      <FullScreenSection className="relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2070&auto=format&fit=crop"
            alt="Script Murder"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#030014] via-[#030014]/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="hidden md:block" /> {/* Spacer */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 text-right"
          >
            <div className="flex items-center gap-4 justify-end">
              <h2 className="text-5xl md:text-7xl font-bold text-white">AI 剧本杀</h2>
              <div className="p-4 rounded-2xl bg-blue-600/20 text-blue-400 backdrop-blur-xl border border-blue-500/30">
                <ScrollText className="w-12 h-12" />
              </div>
            </div>

            <p className="text-xl text-gray-300 leading-relaxed ml-auto max-w-xl">
              沉浸在复杂的叙事中。上传任意剧本，看 AI 如何赋予角色生命。在时间耗尽前解开谜题，还原真相。
            </p>

            <div className="flex flex-wrap gap-4 justify-end">
              <Badge variant="outline" className="text-lg py-2 px-4 border-blue-500/50 text-blue-300 bg-blue-500/10">PDF 上传</Badge>
              <Badge variant="outline" className="text-lg py-2 px-4 border-blue-500/50 text-blue-300 bg-blue-500/10">动态剧情</Badge>
              <Badge variant="outline" className="text-lg py-2 px-4 border-blue-500/50 text-blue-300 bg-blue-500/10">角色扮演</Badge>
            </div>

            <Link to="/script-murder">
              <Button size="lg" className="mt-8 h-16 px-12 text-xl rounded-full bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all hover:scale-105">
                开始探案
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </FullScreenSection>

      {/* Section 4: Adventure World */}
      <FullScreenSection className="relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2070&auto=format&fit=crop"
            alt="Adventure"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030014] via-[#030014]/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-emerald-600/20 text-emerald-400 backdrop-blur-xl border border-emerald-500/30">
                <Binary className="w-12 h-12" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white">数字冒险</h2>
            </div>

            <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
              纯文本构建的无限开放世界。你的每一个选择都将重塑宇宙。没有边界，只有由大模型驱动的纯粹想象力。
            </p>

            <div className="flex flex-wrap gap-4">
              <Badge variant="outline" className="text-lg py-2 px-4 border-emerald-500/50 text-emerald-300 bg-emerald-500/10">开放世界</Badge>
              <Badge variant="outline" className="text-lg py-2 px-4 border-emerald-500/50 text-emerald-300 bg-emerald-500/10">交互式小说</Badge>
            </div>

            <Link to="/adventure">
              <Button size="lg" className="mt-8 h-16 px-12 text-xl rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30px_rgba(5,150,105,0.5)] transition-all hover:scale-105">
                开启旅程
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </FullScreenSection>

      {/* Section 5: Companions & Footer */}
      <FullScreenSection className="bg-[#030014] relative">
        <div className="container relative z-10 px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">你的 AI 伴侣</h2>
            <p className="text-xl text-gray-400">随时待命，永远忠诚</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
            {companions.map((companion, index) => (
              <motion.div
                key={companion.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                <img
                  src={companion.avatar_url || ''}
                  alt={companion.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white">{companion.name}</h3>
                  <p className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                    {companion.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/companions">
              <Button variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10">
                查看所有伴侣
              </Button>
            </Link>
          </div>

          <footer className="absolute bottom-8 left-0 right-0 text-center text-gray-600 text-sm">
            © 2024 NEXUS AI Gaming. All rights reserved.
          </footer>
        </div>
      </FullScreenSection>
    </div>
  );
}
