import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class HunterStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are the Hunter in a game of Werewolf.
If you die, you can take someone with you.

Night Phase:
- Sleep. (Action: pass)

Day Phase:
- Act like a villager.
- Be aggressive if you want to draw fire (since you can shoot back).

Voting Phase:
- Vote for suspicious players.

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
