import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    FileText,
    Users,
    Search,
    Volume2,
    VolumeX,
    Download,
    Maximize2
} from 'lucide-react';
import type { ScriptConfig } from '@/server/scriptmurder/types';

interface ScriptViewerProps {
    scriptConfig: ScriptConfig;
    assignedCharacter?: string;
    onClose?: () => void;
}

export function ScriptViewer({ scriptConfig, assignedCharacter, onClose }: ScriptViewerProps) {
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('characters');
    const [isMuted, setIsMuted] = useState(false);

    const openPdf = (pdfPath: string) => {
        setSelectedPdf(pdfPath);
    };

    const closePdf = () => {
        setSelectedPdf(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div>
                    <h2 className="text-xl font-bold">{scriptConfig.intro.slice(0, 30)}...</h2>
                    <div className="flex gap-2 mt-2">
                        {scriptConfig.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    {scriptConfig.audioFiles && scriptConfig.audioFiles.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                    )}
                    {onClose && (
                        <Button variant="ghost" onClick={onClose}>
                            关闭
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
                {/* Left Panel - Navigation */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="characters">
                                    <Users className="w-4 h-4 mr-2" />
                                    角色
                                </TabsTrigger>
                                <TabsTrigger value="clues">
                                    <Search className="w-4 h-4 mr-2" />
                                    线索
                                </TabsTrigger>
                                <TabsTrigger value="assets">
                                    <FileText className="w-4 h-4 mr-2" />
                                    资料
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="characters" className="mt-4">
                                <ScrollArea className="h-[calc(100vh-280px)]">
                                    <div className="space-y-2">
                                        {scriptConfig.characters.map((char) => (
                                            <Card
                                                key={char.id}
                                                className={`cursor-pointer transition-all hover:shadow-md ${assignedCharacter === char.id ? 'ring-2 ring-primary' : ''
                                                    }`}
                                                onClick={() => openPdf(char.pdfPath)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2">
                                                        <Users className="w-4 h-4 mt-1 text-primary" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold truncate">{char.name}</h4>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {char.description}
                                                            </p>
                                                            {assignedCharacter === char.id && (
                                                                <Badge className="mt-1" variant="default">
                                                                    你的角色
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="clues" className="mt-4">
                                <ScrollArea className="h-[calc(100vh-280px)]">
                                    <div className="space-y-2">
                                        {scriptConfig.clues.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                暂无线索资料
                                            </p>
                                        ) : (
                                            scriptConfig.clues.map((clue) => (
                                                <Card
                                                    key={clue.id}
                                                    className="cursor-pointer transition-all hover:shadow-md"
                                                    onClick={() => clue.pdfPath && openPdf(clue.pdfPath)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-start gap-2">
                                                            <Search className="w-4 h-4 mt-1 text-primary" />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold truncate">{clue.title}</h4>
                                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                                    {clue.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="assets" className="mt-4">
                                <ScrollArea className="h-[calc(100vh-280px)]">
                                    <div className="space-y-2">
                                        {scriptConfig.gameAssets?.handbookPath && (
                                            <Card
                                                className="cursor-pointer transition-all hover:shadow-md"
                                                onClick={() => openPdf(scriptConfig.gameAssets!.handbookPath!)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 mt-1 text-primary" />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">组织者手册</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                游戏流程和规则说明
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                        {scriptConfig.gameAssets?.identityCardsPath && (
                                            <Card
                                                className="cursor-pointer transition-all hover:shadow-md"
                                                onClick={() => openPdf(scriptConfig.gameAssets!.identityCardsPath!)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 mt-1 text-primary" />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">身份牌</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                角色身份卡片
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                        {scriptConfig.gameAssets?.mapPath && (
                                            <Card
                                                className="cursor-pointer transition-all hover:shadow-md"
                                                onClick={() => openPdf(scriptConfig.gameAssets!.mapPath!)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 mt-1 text-primary" />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">地图</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                场景平面图
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Right Panel - PDF Viewer */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-0 h-full">
                        {selectedPdf ? (
                            <div className="relative h-full flex flex-col">
                                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                                    <h3 className="font-medium text-sm truncate flex-1">
                                        {selectedPdf.split('/').pop()?.replace('.pdf', '')}
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(selectedPdf, '_blank')}
                                        >
                                            <Maximize2 className="w-4 h-4 mr-2" />
                                            全屏
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={closePdf}
                                        >
                                            关闭
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <embed
                                        src={selectedPdf}
                                        type="application/pdf"
                                        width="100%"
                                        height="100%"
                                        className="border-0"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">请从左侧选择角色、线索或资料查看</p>
                                    <p className="text-sm mt-2">点击卡片可查看详细内容</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
