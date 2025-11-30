import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Settings, Volume2 } from 'lucide-react';
import { tts } from '../../services/TTSService';

export const VoiceSettingsDialog = () => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = tts.getAvailableVoices();
            setVoices(availableVoices);

            // Try to find a default Chinese voice if none selected
            if (!selectedVoiceURI) {
                const zhVoice = availableVoices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
                if (zhVoice) setSelectedVoiceURI(zhVoice.voiceURI);
            }
        };

        loadVoices();
        // Some browsers load voices asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

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
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>语音设置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>选择语音 (TTS)</Label>
                        <Select value={selectedVoiceURI} onValueChange={handleVoiceChange}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="选择语音..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                                {voices.map((voice) => (
                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleTestVoice} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <Volume2 className="w-4 h-4 mr-2" />
                        测试语音
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
