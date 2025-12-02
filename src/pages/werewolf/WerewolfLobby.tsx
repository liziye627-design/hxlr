import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Sword, Shield } from 'lucide-react';

export default function WerewolfLobby() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [selectedMode, setSelectedMode] = useState<6 | 9 | 12>(6);
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleStartMultiplayerGame = async () => {
    const playerCount = selectedMode;
    const aiPersonas = Array.from({ length: playerCount - 1 }, () => 'ai');
    // 导航到联机房间并自动创建房间+补位AI
    navigate('/werewolf/multiplayer', {
      state: {
        mode: playerCount,
        aiPersonas,
        autoStart: true,
      },
    });
  };

  const handleCreateRoom = () => {
    if (!playerName.trim() || !roomName.trim()) {
      alert('请填写玩家名称和房间名称');
      return;
    }
    // 导航到联机房间，传递创建房间所需信息
    navigate('/werewolf/multiplayer', {
      state: {
        mode: selectedMode,
        playerName,
        roomName,
        isCreating: true,
      },
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      alert('请填写玩家名称和房间ID');
      return;
    }
    // 导航到联机房间，传递加入房间所需信息
    navigate('/werewolf/multiplayer', {
      state: {
        playerName,
        roomId,
        isJoining: true,
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#030014]">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src="/videos/video_1764412084943.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/80 via-[#030014]/60 to-[#030014]/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div
              key="select"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="text-center mb-16"
              >
                <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/20 px-4 py-1 backdrop-blur-md">
                  AI Powered Werewolf
                </Badge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-900/50 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  暗夜狼踪
                </h1>
                <p className="text-xl text-purple-200/60 mt-4 font-light tracking-widest">
                  谎言与推理的艺术 · AI 实时博弈
                </p>
              </motion.div>

              <div className="w-full max-w-2xl space-y-6">
                {/* AI 快速对局 */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="group relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-6 hover:border-purple-500/50 transition-colors duration-300"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">AI 快速对局</h3>
                      <p className="text-gray-400 text-sm">与AI玩家对战，即开即玩</p>
                    </div>
                    <Button
                      onClick={handleStartMultiplayerGame}
                      className="h-11 px-8 bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                    >
                      立即开始
                    </Button>
                  </div>
                </motion.div>

                {/* 创建联机房间 */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="group relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-6 hover:border-blue-500/50 transition-colors duration-300"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">创建联机房间</h3>
                      <p className="text-gray-400 text-sm">邀请好友加入，真人对战</p>
                    </div>
                    <Button
                      onClick={() => setMode('create')}
                      className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    >
                      创建房间
                    </Button>
                  </div>
                </motion.div>

                {/* 加入房间 */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="group relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-6 hover:border-green-500/50 transition-colors duration-300"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">加入现有房间</h3>
                      <p className="text-gray-400 text-sm">输入房间ID，加入好友的游戏</p>
                    </div>
                    <Button
                      onClick={() => setMode('join')}
                      className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                      加入房间
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md mx-auto"
            >
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center text-white">创建房间</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">玩家昵称</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="输入你的名字"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">房间名称</label>
                    <Input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="给房间起个名字"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">游戏模式</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[6, 9, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSelectedMode(num as 6 | 9 | 12)}
                          className={`relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${selectedMode === num
                            ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                          <span className="text-2xl font-bold">{num}人</span>
                          <span className="text-xs opacity-70">
                            {num === 6 ? '新手场' : num === 9 ? '进阶场' : '标准场'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      onClick={() => setMode('select')}
                      variant="outline"
                      className="flex-1 h-12 border-white/10 text-white hover:bg-white/10 hover:text-white bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回
                    </Button>
                    <Button
                      onClick={handleCreateRoom}
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                    >
                      <Sword className="w-4 h-4 mr-2" />
                      创建并进入
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md mx-auto"
            >
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center text-white">加入房间</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-300">玩家昵称</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="输入你的名字"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-300">房间 ID</label>
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="输入房间 ID"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 font-mono"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      onClick={() => setMode('select')}
                      variant="outline"
                      className="flex-1 h-12 border-white/10 text-white hover:bg-white/10 hover:text-white bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回
                    </Button>
                    <Button
                      onClick={handleJoinRoom}
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      加入房间
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
