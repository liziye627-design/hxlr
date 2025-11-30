import { RoleType, IAgent } from './types';
import { WerewolfPersona } from '@/types';
import { GameAgent } from './GameAgent';
import { WerewolfStrategy } from './strategies/WerewolfStrategy';
import { VillagerStrategy } from './strategies/VillagerStrategy';
import { SeerStrategy } from './strategies/SeerStrategy';
import { WitchStrategy } from './strategies/WitchStrategy';
import { HunterStrategy } from './strategies/HunterStrategy';
import { GuardStrategy } from './strategies/GuardStrategy';

export class AgentFactory {
  static createAgent(id: string, name: string, role: RoleType, persona: WerewolfPersona): IAgent {
    let strategy;
    switch (role) {
      case 'werewolf':
        strategy = new WerewolfStrategy();
        break;
      case 'villager':
        strategy = new VillagerStrategy();
        break;
      case 'seer':
        strategy = new SeerStrategy();
        break;
      case 'witch':
        strategy = new WitchStrategy();
        break;
      case 'hunter':
        strategy = new HunterStrategy();
        break;
      case 'guard':
        strategy = new GuardStrategy();
        break;
      default:
        strategy = new VillagerStrategy();
        break;
    }
    return new GameAgent(id, name, role, persona, strategy);
  }
}
