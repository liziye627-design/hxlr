import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Volume2, VolumeX, Settings, Send, Users, MessageSquareText, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { tts } from '@/services/TTSService';
import { API_BASE } from '@/config/api';

// --- Interfaces ---
interface Character {
    id: string;
    name: string;
    avatar: string;
    description: string;
    isPlayer?: boolean; // To distinguish the current player from other players/AIs
}

interface Message {
    id: string;
    senderId: string; // Use senderId to link to Character or 'player'/'narrator'
    senderType: 'player' | 'character' | 'narrator'; // 'character' for AI, 'narrator' for system
    content: string;
    timestamp: number;
}

interface Scene {
    id: string;
    name: string;
    description: string;
    background: string;
    bgm: string;
}

// --- Main Game Room Component ---
export default function JubenshaGameRoom() {
    const { roomId } = useParams<{ roomId: string }>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [isBGMPlaying, setIsBGMPlaying] = useState(true);
    const [characters, setCharacters] = useState<Character[]>([]); // All characters in the game
    const [playerCharacter, setPlayerCharacter] = useState<Character | null>(null); // The current player's character info
    const [targetCharacterId, setTargetCharacterId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/jubensha/rooms/${roomId}`);
                const data = await res.json();
                const room = data?.room;
                if (room) {
                    // Load characters from the script config AND from room players (AI players)
                    const scriptChars: Character[] = (room.characters || []).map((c: any) => ({
                        id: c.id || c.name,
                        name: c.name,
                        avatar: c.avatar || '/avatars/default-ai.png',
                        description: c.description || '',
                    }));

                    // Also include AI players that have joined the room
                    const aiPlayerChars: Character[] = (room.players || [])
                        .filter((p: any) => p.isAI && p.type === 'ai')
                        .map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            avatar: '/avatars/default-ai.png',
                            description: `AI角色: ${p.name}`,
                        }));

                    // Combine and deduplicate by name
                    const allChars = [...scriptChars, ...aiPlayerChars];
                    const uniqueChars = allChars.filter((char, index, self) =>
                        index === self.findIndex(c => c.name === char.name)
                    );

                    setCharacters(uniqueChars);
                    setPlayerCharacter({ id: 'player1', name: '玩家', avatar: '/avatars/player.png', description: '你，故事的主角。', isPlayer: true });
                    setCurrentScene(room.initial_scene || null);
                }
            } catch (e) {
                console.error('Failed to load room details:', e);
            }
        })();

        const playerId = `player_${Date.now()}`;
        const wsProto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsBase = (import.meta as any)?.env?.VITE_JUBENSHA_WS_URL || `${wsProto}//${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:${(import.meta as any)?.env?.VITE_SOCKET_PORT || 3001}`;
        const ws = new WebSocket(`${wsBase}/jubensha/${roomId}/${playerId}`);

        ws.onopen = () => {
            console.log('Connected to game room');
            // Send a message to identify the player or request initial state
            ws.send(JSON.stringify({ type: 'player_join', roomId: roomId, playerId: 'player1' }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WS message:', data);

            if (data.type === 'message') {
                const senderName = data.sender || data.senderId;
                const senderType = data.senderType === 'ai' ? 'character' : data.senderType;
                const char = characters.find(c => c.name === senderName);
                addMessage({
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    senderId: char?.id || senderName || 'narrator',
                    senderType: senderType || 'narrator',
                    content: data.content,
                    timestamp: Date.now(),
                });
            } else if (data.type === 'scene_change') {
                setCurrentScene(data.scene);
                addMessage({
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    senderId: 'narrator',
                    senderType: 'narrator',
                    content: `场景切换至：${data.scene.name} - ${data.scene.description}`,
                    timestamp: Date.now(),
                });
            } else if (data.type === 'agent_response') {
                const response = data.content || data; // Handle if wrapped or direct
                // Agent response structure: { type: 'dialogue', content: '...', metadata: { characterId: '...' } }

                if (response.type === 'dialogue') {
                    const charId = response.metadata?.characterId;
                    const char = characters.find(c => c.id === charId);

                    addMessage({
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                        senderId: charId || 'unknown_agent',
                        senderType: 'character',
                        content: response.content,
                        timestamp: Date.now(),
                    });
                } else if (response.type === 'narration') {
                    addMessage({
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                        senderId: 'narrator',
                        senderType: 'narrator',
                        content: response.content,
                        timestamp: Date.now(),
                    });
                }
            } else if (data.type === 'game_state') {
                // Initial game state or full state update
                if (data.scene) setCurrentScene(data.scene);
                if (data.messages) setMessages(data.messages);
                if (data.characters) setCharacters(data.characters);
            }
        };

        ws.onclose = () => console.log('Disconnected from game room');
        ws.onerror = (error) => console.error('WebSocket error:', error);

        wsRef.current = ws;
        return () => ws.close();
    }, [roomId]);

    useEffect(() => {
        if (currentScene && audioRef.current) {
            audioRef.current.src = currentScene.bgm;
            if (isBGMPlaying) {
                audioRef.current.play().catch(e => console.error("Error playing BGM:", e));
            }
        }
    }, [currentScene, isBGMPlaying]);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const handleSend = () => {
        if (!inputText.trim() || !playerCharacter) return;

        const message: Message = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            senderId: playerCharacter.id,
            senderType: 'player',
            content: inputText,
            timestamp: Date.now()
        };

        addMessage(message);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (targetCharacterId) {
                // Send as script_action for AI interaction
                wsRef.current.send(JSON.stringify({
                    type: 'script_action',
                    roomId: roomId,
                    action: {
                        type: 'ask_character',
                        characterId: targetCharacterId,
                        message: inputText
                    }
                }));
            } else {
                // Regular chat
                wsRef.current.send(JSON.stringify({
                    type: 'message',
                    senderId: playerCharacter.id,
                    senderType: 'player',
                    content: inputText,
                    targetId: undefined
                }));
            }
        }

        setInputText('');
    };

    const toggleBGM = () => {
        setIsBGMPlaying(!isBGMPlaying);
        if (audioRef.current) {
            isBGMPlaying ? audioRef.current.pause() : audioRef.current.play().catch(e => console.error("Error playing BGM:", e));
        }
    };

    const getCharacterById = (id: string) => {
        return characters.find(char => char.id === id);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            {/* 顶部栏 */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {currentScene && (
                        <div>
                            <h2 className="font-bold text-lg text-gray-800">{currentScene.name}</h2>
                            <p className="text-sm text-gray-500">{currentScene.description}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={toggleBGM} className="text-gray-600 hover:text-purple-600">
                                    {isBGMPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isBGMPlaying ? '关闭背景音乐' : '开启背景音乐'}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Dialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                                            <Users className="w-5 h-5" />
                                        </Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>查看玩家与角色</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>游戏角色</DialogTitle>
                                    <DialogDescription>
                                        当前游戏中的所有玩家和AI角色。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {characters.map(char => (
                                        <div key={char.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                                            <Avatar className="w-10 h-10 border-2 border-purple-500">
                                                <AvatarImage src={char.avatar} alt={char.name} />
                                                <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-gray-800">{char.name} {char.isPlayer && "(你)"}</p>
                                                <p className="text-sm text-gray-500">{char.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>游戏设置</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* 场景卡片 */}
            {currentScene && (
                <AnimatePresence>
                    <motion.div
                        key={currentScene.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mx-4 mt-4 rounded-lg overflow-hidden shadow-lg relative z-0"
                    >
                        <div
                            className="h-36 md:h-48 bg-cover bg-center relative flex items-end p-4"
                            style={{ backgroundImage: `url(${currentScene.background})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="relative text-white">
                                <h3 className="text-xl md:text-2xl font-bold">{currentScene.name}</h3>
                                <p className="text-sm md:text-base opacity-90">{currentScene.description}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* 聊天区域 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            characters={characters}
                            playerCharacterId={playerCharacter?.id || ''}
                        />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-md z-10">
                {/* 选择交流对象 */}
                {characters.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto custom-scrollbar">
                        <span className="text-xs text-gray-500 whitespace-nowrap">向谁提问：</span>
                        <button
                            className={`px-3 py-1 rounded-full text-xs border ${!targetCharacterId ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                            onClick={() => setTargetCharacterId(null)}
                        >
                            所有人
                        </button>
                        {characters.filter(c => !c.isPlayer).map((char) => (
                            <button
                                key={char.id}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${targetCharacterId === char.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                onClick={() => setTargetCharacterId(char.id)}
                                title={char.name}
                            >
                                <img src={char.avatar} alt={char.name} className="w-5 h-5 rounded-full" />
                                <span className="whitespace-nowrap">{char.name}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入消息..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        disabled={!playerCharacter} // Disable if player character not set
                    />
                    <Button
                        onClick={handleSend}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                        size="icon"
                        disabled={!inputText.trim() || !playerCharacter}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-xs text-gray-700 hover:bg-gray-100" onClick={() => setInputText('你昨晚在哪里？')}>
                        你昨晚在哪里？
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs text-gray-700 hover:bg-gray-100" onClick={() => setInputText('你看到了什么？')}>
                        你看到了什么？
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs text-gray-700 hover:bg-gray-100" onClick={() => setInputText('你在说谎！')}>
                        你在说谎！
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs text-gray-700 hover:bg-gray-100" onClick={() => setInputText('请详细说明。')}>
                        请详细说明。
                    </Button>
                </div>
            </div>

            <audio ref={audioRef} loop />
        </div>
    );
}

// --- Chat Bubble Component ---
interface ChatBubbleProps {
    message: Message;
    characters: Character[];
    playerCharacterId: string;
}

function ChatBubble({ message, characters, playerCharacterId }: ChatBubbleProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const spokenRef = useRef(false);

    const senderCharacter = characters.find(char => char.id === message.senderId) || characters.find(char => char.name === message.senderId);
    const isPlayer = message.senderId === playerCharacterId && message.senderType === 'player';
    const isNarrator = message.senderType === 'narrator';
    const isCharacterAI = message.senderType === 'character';

    useEffect(() => {
        if (isCharacterAI || isNarrator) {
            setIsTyping(true);
            let i = 0;
            const timer = setInterval(() => {
                setDisplayedText(message.content.slice(0, i));
                i++;
                if (i > message.content.length) {
                    clearInterval(timer);
                    setIsTyping(false);
                }
            }, 30);
            if (!spokenRef.current) {
                const pid = isNarrator ? 'narrator' : message.senderId;
                try {
                    tts.speak(message.content, pid);
                } catch { }
                spokenRef.current = true;
            }
            return () => clearInterval(timer);
        } else {
            setDisplayedText(message.content);
            setIsTyping(false);
        }
    }, [message, isCharacterAI, isNarrator]);

    if (isNarrator) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center my-3"
            >
                <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm max-w-md text-center shadow-sm flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">旁白:</span>
                    <p className="whitespace-pre-wrap">
                        {displayedText}
                        {isTyping && <span className="animate-pulse">▊</span>}
                    </p>
                </div>
            </motion.div>
        );
    }

    const senderName = isPlayer ? (senderCharacter?.name || '你') : (senderCharacter?.name || '未知');
    const senderAvatar = isPlayer ? (senderCharacter?.avatar || '/avatars/player.png') : (senderCharacter?.avatar || '/avatars/default-ai.png');

    return (
        <motion.div
            initial={{ opacity: 0, x: isPlayer ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} gap-3 items-start`}
        >
            {!isPlayer && (
                <Avatar className={`w-10 h-10 flex-shrink-0 ${isTyping ? 'animate-pulse border-2 border-purple-400' : ''}`}>
                    <AvatarImage src={senderAvatar} alt={senderName} />
                    <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}

            <div className={`max-w-[70%] flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                <span className={`text-xs text-gray-500 mb-1 px-2 ${isPlayer ? 'text-right' : 'text-left'}`}>
                    {senderName}
                </span>

                <div className={`px-4 py-2 rounded-2xl shadow-md ${isPlayer
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">
                        {displayedText}
                        {isTyping && <span className="animate-pulse">▊</span>}
                    </p>
                </div>

                <span className="text-xs text-gray-400 mt-1 px-2">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {isPlayer && (
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-purple-500">
                    <AvatarImage src={senderAvatar} alt={senderName} />
                    <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
        </motion.div>
    );
}
