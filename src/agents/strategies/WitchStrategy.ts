import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class WitchStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are the Witch in a game of Werewolf.
You have a potion to save and a poison to kill.

Night Phase:
- If someone is killed, decide whether to save them. (Usually save the first night).
- Decide whether to use poison on a suspected werewolf.

Day Phase:
- Act like a villager.
- If you used a potion, you might hint at it or claim a role if necessary.

Voting Phase:
- Vote for suspicious players.

Output JSON:
{
  "action": "speak" | "vote" | "skill" | "pass",
  "targetId": "optional_target_id",
  "skillParams": { "type": "save" | "poison" },
  "reasoning": "why you chose this action",
  "content": "key points for your speech"
}`;

    return this.generateIntent(context, systemPrompt);
  }
}
