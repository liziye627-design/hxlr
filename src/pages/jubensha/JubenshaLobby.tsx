import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Users, Clock, Play, Search, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storyApi } from '@/db/api';
import type { Story } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function JubenshaLobby() {
    const navigate = useNavigate();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [scriptFile, setScriptFile] = useState<File | null>(null);

    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            const data = await storyApi.getAllStories();
            setStories(data);
        } catch (error) {
            console.error('Failed to load stories:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const response = await fetch('http://localhost:3001/api/jubensha/upload-script', {
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
                                onClick={() => navigate(`/script-murder/room/${story.id}`)} // Assuming direct room entry for now, or detail page
                            >
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-2xl ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-300">
                                    <img
                                        src={story.cover_url || `https://source.unsplash.com/random/400x600?mystery,${index}`}
                                        alt={story.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
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

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-100">
                                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                                        </div>
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
                        onClick={() => navigate('/scriptmurder/upload')}
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
