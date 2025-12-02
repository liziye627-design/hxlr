import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Users, Clock, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Story } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/config/api';

export default function JubenshaLobby() {
    const navigate = useNavigate();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [, setUploading] = useState(false);
    const [scriptFile, setScriptFile] = useState<File | null>(null);

    useEffect(() => {
        (async () => {
            const fallbackScripts: Story[] = [
                { id: 'local_school_rules', title: '第二十二条校规', description: '一所神秘学校的诡异校规，隐藏着不为人知的秘密...', category: '悬疑', cover_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=600&fit=crop', min_players: 4, max_players: 7, story_data: { estimatedDuration: '90' } as any, is_premium: false, difficulty: 'normal', play_count: 0 } as any,
                { id: 'local_heist', title: '收获日', description: '一场精心策划的行动，每个人都有自己的目的...', category: '犯罪', cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop', min_players: 5, max_players: 7, story_data: { estimatedDuration: '90' } as any, is_premium: false, difficulty: 'hard', play_count: 0 } as any,
                { id: 'local_psychoboy', title: '病娇男孩的精分日记', description: '一本日记，记录着扭曲的爱与执念...', category: '恐怖', cover_url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop', min_players: 4, max_players: 7, story_data: { estimatedDuration: '60' } as any, is_premium: false, difficulty: 'normal', play_count: 0 } as any,
                { id: 'script_it_pennywise', title: '小丑回魂', description: '1989年德里镇，孩子们接连失踪。窝囊废俱乐部必须面对以恐惧为食的古老邪恶...', category: '恐怖', cover_url: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=600&fit=crop', min_players: 4, max_players: 6, story_data: { estimatedDuration: '120' } as any, is_premium: true, difficulty: 'insane', play_count: 0 } as any,
            ];

            // 直接使用本地剧本列表
            setStories(fallbackScripts);
            setLoading(false);
        })();
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                alert('仅支持 PDF、TXT、DOCX 格式');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('文件大小不能超过 10MB');
                return;
            }
            setScriptFile(file);
        }
    };

    const handleUploadScript = async () => {
        if (!scriptFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('script', scriptFile);
            const response = await fetch(`${API_BASE}/api/jubensha/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                navigate(`/script-murder/room/${data.roomId}`);
            } else {
                alert('上传失败：' + data.error);
            }
        } catch (error) {
            alert('上传失败：' + error);
        } finally {
            setUploading(false);
        }
    };

    const filteredStories = stories.filter(story =>
        story.title.includes(searchTerm) ||
        (story.description || '').includes(searchTerm) ||
        story.category.includes(searchTerm)
    );

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-500/80 text-white';
            case 'normal': return 'bg-blue-500/80 text-white';
            case 'hard': return 'bg-purple-500/80 text-white';
            case 'insane': return 'bg-red-500/80 text-white';
            default: return 'bg-gray-500/80 text-white';
        }
    };

    const getDifficultyText = (difficulty: string) => {
        const map: Record<string, string> = {
            beginner: '新手',
            normal: '进阶',
            hard: '烧脑',
            insane: '地狱'
        };
        return map[difficulty] || difficulty;
    };

    const fixedTitles = ['第二十二条校规', 'K系列-觉醒', '收获日', '病娇男孩的精分日记', '纸妻', '小丑回魂'];
    const params = 'q=80&auto=format&fit=crop&w=600&ixlib=rb-4.0.3';
    const fixedCovers = [
        '/source/script_covers/school_rules.jpg',
        '/source/script_covers/k_awake.jpg',
        '/source/script_covers/heist.jpg',
        '/source/script_covers/psychoboy.jpg',
        '/source/script_covers/paper_wife.jpg',
        '/source/script_covers/it_pennywise.jpg',
    ];
    const fixedByTitle: Record<string, string> = {
        '第二十二条校规': '/source/script_covers/school_rules.jpg',
        'K系列-觉醒': '/source/script_covers/k_awake.jpg',
        '收获日': '/source/script_covers/heist.jpg',
        '病娇男孩的精分日记': '/source/script_covers/psychoboy.jpg',
        '纸妻': '/source/script_covers/paper_wife.jpg',
        '小丑回魂': '/source/script_covers/it_pennywise.jpg',
    };

    return (
        <div className="min-h-screen bg-[#0a0a16] text-white overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-indigo-900/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-7xl font-bold mb-4 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient-x">
                                剧本杀宇宙
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                            探索无尽的故事，体验不一样的人生。AI 主持人将带你进入一个充满悬疑与推理的世界。
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="max-w-xl mx-auto relative"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500" />
                            <div className="relative bg-white/5 backdrop-blur-xl rounded-full border border-white/10 flex items-center p-2">
                                <Search className="w-5 h-5 text-gray-400 ml-3" />
                                <Input
                                    type="text"
                                    placeholder="搜索剧本、类型或关键词..."
                                    className="border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Scripts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
                    <AnimatePresence>
                        {filteredStories.map((story, index) => (
                            <motion.div
                                key={story.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="group cursor-pointer"
                                onClick={() => {
                                    // 特定剧本有专门的游戏页面
                                    if (story.id === 'script_it_pennywise') {
                                        navigate('/script-murder/it');
                                    } else if (story.id === 'local_school_rules') {
                                        navigate('/script-murder/school-rules');
                                    } else if (story.id === 'local_heist') {
                                        navigate('/script-murder/payday');
                                    } else if (story.id === 'local_psychoboy') {
                                        navigate('/script-murder/yandere');
                                    } else {
                                        navigate(`/script-murder/room/${story.id}`);
                                    }
                                }}
                            >
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-2xl ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-300">
                                    {(() => {
                                        const unsplashFallback = `https://images.unsplash.com/photo-1478720568477-152d9b164e26?${params}`;
                                        const titleSrc = fixedByTitle[story.title];
                                        const indexSrc = fixedCovers[index];
                                        const coverSrc = titleSrc || story.cover_url || indexSrc || unsplashFallback;
                                        const altText = story.title || fixedTitles[index] || '剧本封面';
                                        return (
                                            <img
                                                src={coverSrc}
                                                alt={altText}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => { e.currentTarget.src = unsplashFallback; }}
                                            />
                                        );
                                    })()}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                    {/* Top Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {story.is_premium && (
                                            <Badge className="bg-yellow-500/90 text-black border-0 backdrop-blur-sm">
                                                <Star className="w-3 h-3 mr-1 fill-current" /> VIP
                                            </Badge>
                                        )}
                                        <Badge className={`${getDifficultyColor(story.difficulty)} border-0 backdrop-blur-sm`}>
                                            {getDifficultyText(story.difficulty)}
                                        </Badge>
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-purple-300 transition-colors">
                                            {story.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{story.min_players}-{story.max_players}人</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{story.story_data?.estimatedDuration || '60'}分钟</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                                            {story.description || '暂无简介'}
                                        </p>
                                    </div>

                                    
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State / Upload Prompt */}
                {filteredStories.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-400 mb-8">没有找到相关剧本...</p>
                    </div>
                )}

                {/* Custom Upload Section - Compact Version */}
                <div className="flex justify-center mb-12">
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 h-auto gap-3 group"
                        onClick={() => navigate('/script-murder/upload')}
                    >
                        <div className="p-2 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                            <Upload className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold text-lg">上传自定义剧本</div>
                            <div className="text-xs text-gray-400">支持 PDF/Word 自动解析</div>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
}
