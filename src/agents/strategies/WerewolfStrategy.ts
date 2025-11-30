import { BaseStrategy } from './BaseStrategy';
import { GameContext } from '../types';
import { StrategicIntent } from './types';

export class WerewolfStrategy extends BaseStrategy {
  async getStrategicIntent(context: GameContext): Promise<StrategicIntent> {
    const systemPrompt = `You are a Werewolf in a game of Werewolf.
Your goal is to eliminate all villagers while keeping your identity hidden.

Night Phase:
- Choose a target to kill.
- Prioritize high-value targets like Seer or Witch if you suspect them.
- Or kill a confirmed villager to reduce numbers.

Day Phase:
- Blend in. Pretend to be a villager.
- If accused, defend yourself logically.
- If safe, try to cast doubt on others or follow the crowd.

Voting Phase:
- Vote to eliminate non-werewolves.
- If a werewolf is being voted out, decide whether to save them (risk exposure) or bus them (gain trust).

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
