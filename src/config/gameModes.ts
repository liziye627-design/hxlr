export type GameModeId = 'werewolf' | 'script_murder' | 'adventure';
export type CompanionCarryMode = 'with_agent' | 'solo';

export interface GameModeMeta {
  id: GameModeId;
  title: string;
  shortTitle: string;
  path: string;
  description: string;
}

export const GAME_MODES: GameModeMeta[] = [
  {
    id: 'werewolf',
    title: '狼人杀',
    shortTitle: '狼人杀',
    path: '/werewolf',
    description: '实时发言、投票盘逻辑。',
  },
  {
    id: 'script_murder',
    title: '剧本杀',
    shortTitle: '剧本杀',
    path: '/script-murder',
    description: '进房搜证、理线索、做复盘。',
  },
  {
    id: 'adventure',
    title: 'Minecraft',
    shortTitle: 'MC',
    path: '/minecraft',
    description: '稳定开局、带陪玩进世界、记录每局过程。',
  },
];

export const GAME_MODE_INDEX = Object.fromEntries(
  GAME_MODES.map((mode) => [mode.id, mode]),
) as Record<GameModeId, GameModeMeta>;

export function getGameModeMeta(modeId: GameModeId) {
  return GAME_MODE_INDEX[modeId];
}
