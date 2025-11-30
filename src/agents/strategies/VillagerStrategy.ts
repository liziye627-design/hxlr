import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class VillagerStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are a Villager in a game of Werewolf.
Your goal is to find and eliminate werewolves.

Night Phase:
- Sleep. (Action: pass)

Day Phase:
- Listen carefully.
- Point out logical inconsistencies.
- Share your suspicions.

Voting Phase:
- Vote for the most suspicious player.

Output JSON:
{
  "action": "speak" | "vote" | "pass",
  "targetId": "optional_target_id",
  "reasoning": "why you chose this action",
  "content": "key points for your speech"
}`;

    return this.generateIntent(context, systemPrompt);
  }
}
