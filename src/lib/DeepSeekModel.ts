import { SimpleChatModel, BaseChatModelParams } from '@langchain/core/language_models/chat_models';
import { BaseMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { aiService } from '@/services/ai';

export interface DeepSeekModelParams extends BaseChatModelParams {
  temperature?: number;
}

export class DeepSeekModel extends SimpleChatModel {
  temperature: number;

  constructor(fields?: DeepSeekModelParams) {
    super(fields ?? {});
    this.temperature = fields?.temperature ?? 0.7;
  }

  _llmType(): string {
    return 'deepseek';
  }

  async _call(messages: BaseMessage[]): Promise<string> {
    const chatMessages = messages.map((m) => {
      let role: 'user' | 'assistant' | 'system' = 'user';
      if (m instanceof AIMessage) role = 'assistant';
      else if (m instanceof SystemMessage) role = 'system';

      return {
        id: Date.now().toString(),
        role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        timestamp: new Date().toISOString(),
      };
    });

    const response = await aiService.chat(chatMessages);
    return response;
  }
}
