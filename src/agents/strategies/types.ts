import { GameContext, ActionType } from '../types';

export interface StrategicIntent {
  action: ActionType;
  targetId?: string;
  content?: string; // Rough content or key points to cover
  skillParams?: any;
  reasoning: string;
}

export interface IRoleStrategy {
  getStrategicIntent(context: GameContext): Promise<StrategicIntent>;
}
