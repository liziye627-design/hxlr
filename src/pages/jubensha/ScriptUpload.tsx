import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, BookOpen, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function ScriptUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scriptName, setScriptName] = useState('');
  const [playerCount, setPlayerCount] = useState(6);
  const [characterScripts, setCharacterScripts] = useState<UploadedFile[]>([]);
  const [dmHandbook, setDmHandbook] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:${(import.meta as any)?.env?.VITE_SOCKET_PORT || 3001}`;

  const handleCharacterFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map(file => ({ file, status: 'pending', progress: 0 }));
    setCharacterScripts(prev => [...prev, ...newFiles]);
  };

  const handleDmFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDmHandbook({ file, status: 'pending', progress: 0 });
  };

  const removeCharacterScript = (index: number) => {
    setCharacterScripts(prev => prev.filter((_, i) => i !== index));
  };

  const removeDmHandbook = () => setDmHandbook(null);

  const validateUpload = (): boolean => {
    if (!scriptName.trim()) {
      toast({ title: '缺少信息', description: '请输入剧本名称', variant: 'destructive' });
      return false;
    }
    if (characterScripts.length === 0) {
      toast({ title: '缺少文件', description: '请至少上传一个角色剧本', variant: 'destructive' });
      return false;
    }
    if (!dmHandbook) {
      toast({ title: '缺少文件', description: '请上传主持人手册', variant: 'destructive' });
      return false;
    }
    if (characterScripts.length !== playerCount) {
      toast({
        title: '文件数量不匹配',
        description: `玩家人数设置为${playerCount}人，但上传了${characterScripts.length}个角色剧本`,
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateUpload() || !dmHandbook) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('scriptName', scriptName);
      form.append('playerCount', String(playerCount));
      form.append('dmHandbook', dmHandbook.file);
      characterScripts.forEach((item, index) => {
        form.append(`characterScript_${index}`, item.file);
      });
      const res = await fetch(`${API_BASE}/api/jubensha/upload`, { method: 'POST', body: form });
      const json = await res.json();
      if (json?.success && json?.script?.id) {
        toast({ title: '上传成功', description: `剧本《${scriptName}》已成功上传并解析` });
        navigate(`/script-murder/room/${json.script.id}`);
      } else {
        throw new Error(json?.error || '上传失败');
      }
    } catch (e: any) {
      toast({ title: '上传失败', description: e?.message || '请稍后重试', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">上传自定义剧本</h1>
        <p className="text-muted-foreground">上传您的剧本文件，AI将自动解析并创建游戏房间</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>设置剧本的基础信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scriptName">剧本名称</Label>
              <Input id="scriptName" placeholder="例如：第二十二条校规" value={scriptName} onChange={(e) => setScriptName(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="playerCount">玩家人数</Label>
              <Input id="playerCount" type="number" min={4} max={12} value={playerCount} onChange={(e) => setPlayerCount(parseInt(e.target.value) || 6)} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">请上传对应数量的角色剧本</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              角色剧本
            </CardTitle>
            <CardDescription>上传每个角色的剧本文件（支持 PDF 格式）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="characterScripts" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">点击选择角色剧本文件</p>
                  <p className="text-xs text-muted-foreground">支持同时选择多个 PDF 文件</p>
                </div>
              </Label>
              <Input id="characterScripts" type="file" accept=".pdf" multiple onChange={handleCharacterFiles} className="hidden" />
            </div>

            {characterScripts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>已上传的角色剧本 ({characterScripts.length})</Label>
                  <Badge variant={characterScripts.length === playerCount ? 'default' : 'secondary'}>
                    {characterScripts.length} / {playerCount}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {characterScripts.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeCharacterScript(index)} disabled={isUploading}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {characterScripts.length !== playerCount && characterScripts.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>角色剧本数量（{characterScripts.length}）与玩家人数（{playerCount}）不匹配</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              主持人手册
            </CardTitle>
            <CardDescription>上传主持人手册文件（包含剧本真相、流程等）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dmHandbook ? (
              <div>
                <Label htmlFor="dmHandbook" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">点击选择主持人手册</p>
                    <p className="text-xs text-muted-foreground">支持 PDF 格式</p>
                  </div>
                </Label>
                <Input id="dmHandbook" type="file" accept=".pdf" onChange={handleDmFile} className="hidden" />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{dmHandbook.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(dmHandbook.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <Button variant="ghost" size="sm" onClick={removeDmHandbook} disabled={isUploading}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button size="lg" onClick={handleSubmit} disabled={isUploading || !scriptName || characterScripts.length === 0 || !dmHandbook} className="flex-1">
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                上传并解析剧本
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">上传说明：</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>角色剧本：每个角色一个PDF文件，数量需与玩家人数一致</li>
              <li>主持人手册：包含剧本真相、NPC设定、游戏流程等</li>
              <li>AI将自动解析剧本内容，提取角色信息、场景、线索等</li>
              <li>解析完成后将自动创建游戏房间</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
