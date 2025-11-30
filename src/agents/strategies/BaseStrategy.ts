import { GameContext } from '../types';
import { IRoleStrategy, StrategicIntent } from './types';
import { DeepSeekModel } from '@/lib/DeepSeekModel';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export abstract class BaseStrategy implements IRoleStrategy {
  protected model: DeepSeekModel;

  constructor() {
    this.model = new DeepSeekModel({ temperature: 0.5 }); // Lower temp for strategy
  }

  abstract getStrategicIntent(context: GameContext): Promise<StrategicIntent>;

  protected async generateIntent(
    context: GameContext,
    systemPrompt: string,
  ): Promise<StrategicIntent> {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      [
        'user',
        'Current Game State:\nRound: {round}\nPhase: {phase}\nAlive Players: {alive_players}\n\nWhat is your strategic intent?',
      ],
    ]);

    const chain = prompt.pipe(this.model).pipe(new JsonOutputParser());

    try {
      const result = await chain.invoke({
        round: context.round,
        phase: context.phase,
        alive_players: context.alivePlayers.map((p) => `${p.position}:${p.name}`).join(', '),
      });
      return result as StrategicIntent;
    } catch (e) {
      console.error('Strategy generation failed', e);
      return { action: 'pass', reasoning: 'Error in strategy generation' };
    }
  }
}
