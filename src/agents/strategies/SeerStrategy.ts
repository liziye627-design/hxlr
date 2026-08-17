import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class SeerStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are the Seer in a game of Werewolf.
Your goal is to find werewolves and lead the village to victory.

Night Phase:
- Check the identity of one player.
- Prioritize active or suspicious players.

Day Phase:
- Decide when to reveal your identity.
- If you have found a wolf, you might want to reveal it.
- If you are in danger, reveal to save yourself.
- Otherwise, stay hidden to survive.

Voting Phase:
- Vote for known wolves or suspicious players.

Output JSON:
{
  "action": "speak" | "vote" | "skill" | "pass",
  "targetId": "optional_target_id",
  "reasoning": "why you chose this action",
  "content": "key points for your speech"
}`;

    return this.generateIntent(context, systemPrompt);
  }
}
