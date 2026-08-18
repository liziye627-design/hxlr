import fetch from 'node-fetch';

/**
 * OpenLLMBridge
 * Bridge service to communicate with the Python Open-LLM-VTuber application.
 * Default Open-LLM-VTuber API runs on port 12393 or 8000.
 */

interface OpenLLMConfig {
    baseUrl: string;
    modelName?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class OpenLLMBridge {
    private baseUrl: string;

    constructor(config: OpenLLMConfig = { baseUrl: 'http://127.0.0.1:12393' }) {
        this.baseUrl = config.baseUrl;
    }

    /**
     * Check if the Open-LLM-VTuber backend is online
     */
    async isOnline(): Promise<boolean> {
        try {
            // Check list (often exposed by simple LLM servers)
            const response = await fetch(`${this.baseUrl}/v1/models`, { method: 'GET' });
            return response.ok;
        } catch (e) {
            console.warn('OpenLLMBridge: Backend offline', e);
            return false;
        }
    }

    /**
     * Generate speech/response from Open-LLM-VTuber
     * This hits the standard OpenAI-compatible endpoint that Open-LLM-VTuber usually exposes.
     */
    async generateResponse(messages: ChatMessage[]): Promise<string> {
        if (!await this.isOnline()) {
            throw new Error('Open-LLM-VTuber backend is not connected');
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    stream: false, // We'll handle full response for now
                    // Open-LLM-VTuber specific params can go here
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`API Error: ${response.status} ${err}`);
            }

            const data = (await response.json()) as ChatResponse;
            return data.choices[0]?.message?.content || '';

        } catch (error) {
            console.error('OpenLLMBridge: Generation failed', error);
            throw error;
        }
    }

    /**
     * Trigger TTS & Motion on the Python Backend directly (If supported by custom endpoint)
     * Sometimes we just want to send text to be spoken/acted out without LLM generation.
     */
    async speak(text: string, characterId?: string): Promise<boolean> {
        if (!await this.isOnline()) return false;

        try {
            // Assuming a custom endpoint for direct speech/action
            // Adjust based on specific Open-LLM-VTuber API implementation
            await fetch(`${this.baseUrl}/run/speak`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    character_id: characterId
                })
            });
            return true;
        } catch (error) {
            console.error('OpenLLMBridge: Speak execution failed', error);
            return false;
        }
    }
}

// Singleton instance
export const openLLMTuber = new OpenLLMBridge({
    baseUrl: process.env.OPEN_LLM_VTUBER_URL || 'http://127.0.0.1:12393'
});
