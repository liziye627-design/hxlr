import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Plus, LogIn, Users, ArrowLeft, Sword, Shield, Moon } from 'lucide-react';

export default function WerewolfLobby() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('玩家1');
  const [roomId, setRoomId] = useState('');
  const [selectedMode, setSelectedMode] = useState<6 | 9 | 12>(6);

  const handleCreateRoom = () => {
    if (!playerName.trim() || !roomName.trim()) {
      alert('请输入玩家名和房间名');
      return;
    }

    navigate('/werewolf/game', {
      state: {
        action: 'create',
        playerName,
        roomName,
        mode: selectedMode,
      },
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      alert('请输入玩家名和房间ID');
      return;
    }

    navigate('/werewolf/game', {
      state: {
        action: 'join',
        playerName,
        roomId,
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
        <img
          src="/images/werewolf-bg-v2.png"
          alt="Background"
          className="w-full h-full object-cover opacity-30"
        />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                {/* Create Room Card */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  onClick={() => setMode('create')}
                  className="group cursor-pointer relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-8 hover:border-purple-500/50 transition-colors duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                      <Plus className="w-10 h-10 text-purple-300" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">创建房间</h2>
                      <p className="text-gray-400 text-sm">建立新的游戏对局，邀请好友或 AI 玩家加入</p>
                    </div>
                  </div>
                </motion.div>

                {/* Join Room Card */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  onClick={() => setMode('join')}
                  className="group cursor-pointer relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-8 hover:border-blue-500/50 transition-colors duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                      <LogIn className="w-10 h-10 text-blue-300" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">加入房间</h2>
                      <p className="text-gray-400 text-sm">输入房间 ID，快速加入正在进行的对局</p>
                    </div>
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
