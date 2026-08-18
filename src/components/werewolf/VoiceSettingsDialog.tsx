import { useEffect, useState } from 'react';
import { Settings, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { tts, type TTSBackendStatus } from '../../services/TTSService';

export const VoiceSettingsDialog = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<TTSBackendStatus | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = tts.getAvailableVoices();
      setVoices(availableVoices);

      if (!selectedVoiceURI) {
        const zhVoice = availableVoices.find((voice) => voice.lang.includes('zh') || voice.lang.includes('CN'));
        if (zhVoice) setSelectedVoiceURI(zhVoice.voiceURI);
      }
    };

    const loadBackendStatus = async () => {
      const status = await tts.getBackendStatus();
      setBackendStatus(status);
    };

    loadVoices();
    void loadBackendStatus();

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceURI]);

  const handleVoiceChange = (value: string) => {
    setSelectedVoiceURI(value);
    tts.setPreferredVoice(value);
  };

  const handleTestVoice = () => {
    tts.speak('这是一个测试语音。欢迎来到狼人杀游戏。', 'test-player');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="语音设置">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-700 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>语音设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
            <div className="font-medium text-white">当前引擎</div>
            <div className="mt-1">
              {backendStatus?.enabled
                ? `后端 TTS (${backendStatus.provider})，失败时回退浏览器语音`
                : '浏览器 TTS'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>浏览器语音回退</Label>
            <Select value={selectedVoiceURI} onValueChange={handleVoiceChange}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                <SelectValue placeholder="选择语音..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] border-slate-700 bg-slate-800 text-white">
                {voices.map((voice) => (
                  <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTestVoice} className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Volume2 className="mr-2 h-4 w-4" />
            测试语音
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
