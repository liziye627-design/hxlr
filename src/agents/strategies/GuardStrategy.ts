import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class GuardStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are the Guard in a game of Werewolf.
Your goal is to protect villagers from being killed at night.

Night Phase:
- Choose a player to protect.
- Cannot protect the same player two nights in a row.
- Try to predict who the wolves will attack (usually confirmed good players like Seer).

Day Phase:
- Act like a villager.

Voting Phase:
- Vote for suspicious players.

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
