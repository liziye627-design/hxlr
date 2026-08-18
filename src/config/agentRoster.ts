import type { AICompanion } from '@/types';
import { getOfficialCompanionPersona } from './officialCompanionPersonas';

export type AgentMode = 'chat' | 'werewolf' | 'script_murder' | 'mc';

export interface AgentShowcaseEntry {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  previewImage: string;
  modelName: string;
  type: AICompanion['type'];
  modes: AgentMode[];
  traits: string[];
  strengths: string[];
  weakness: string;
  openingLine: string;
  scoreSeed: {
    chemistry: number;
    deduction: number;
    clutch: number;
    ambience: number;
  };
}

const CREATED_AT = '2026-03-15T00:00:00.000Z';

export const AGENT_SHOWROOM: AgentShowcaseEntry[] = [
  {
    id: 'haru',
    slug: 'haru',
    name: 'Haru',
    title: 'Shotcaller',
    tagline: 'Fast reads, clean openings, steady table rhythm.',
    description: 'Built for opening rounds, pressure speeches, and carrying hesitant players into the game.',
    previewImage: '/agent-portraits/haru.png',
    modelName: 'haru',
    type: 'alpha',
    modes: ['chat', 'werewolf'],
    traits: ['Opening', 'Pressure', 'Tempo'],
    strengths: ['speech planning', 'vote framing', 'table control'],
    weakness: 'Can feel too direct in slow roleplay-heavy rooms.',
    openingLine: 'Lock the first two turns. I will help you frame the table before anyone drags the pace down.',
    scoreSeed: {
      chemistry: 86,
      deduction: 91,
      clutch: 90,
      ambience: 78,
    },
  },
  {
    id: 'hiyori',
    slug: 'hiyori',
    name: 'Hiyori',
    title: 'Soft Analyst',
    tagline: 'Low-noise reads for long conversations and layered rooms.',
    description: 'Best when you need emotional tracking, gentle reminders, and a calm teammate voice.',
    previewImage: '/agent-portraits/hiyori.png',
    modelName: 'hiyori',
    type: 'aqua',
    modes: ['chat', 'werewolf', 'script_murder'],
    traits: ['Calm', 'Empathy', 'Reading'],
    strengths: ['emotion tracking', 'conversation recall', 'soft coaching'],
    weakness: 'Less explosive when a room needs aggressive tempo swings.',
    openingLine: 'Feed me the tone of the room and I will tell you who is leaking pressure.',
    scoreSeed: {
      chemistry: 93,
      deduction: 84,
      clutch: 79,
      ambience: 92,
    },
  },
  {
    id: 'mao-pro',
    slug: 'mao',
    name: 'Mao Pro',
    title: 'Closer',
    tagline: 'High-confidence closing statements and swing-round finishes.',
    description: 'Made for endgame pushes, forced reveals, and turning scattered notes into a final call.',
    previewImage: '/agent-portraits/mao.png',
    modelName: 'mao_pro',
    type: 'alpha',
    modes: ['chat', 'werewolf'],
    traits: ['Closer', 'Burst', 'Resolve'],
    strengths: ['final calls', 'vote locking', 'confidence support'],
    weakness: 'Overcommits if the table is still too information-poor.',
    openingLine: 'Save me for the rounds that matter. I do my best work when the room starts tightening.',
    scoreSeed: {
      chemistry: 81,
      deduction: 88,
      clutch: 94,
      ambience: 72,
    },
  },
  {
    id: 'mark',
    slug: 'mark',
    name: 'Mark',
    title: 'Cold Reader',
    tagline: 'Quiet logic and dense post-game review support.',
    description: 'Best for analytical players who want a second brain instead of a hype partner.',
    previewImage: '/agent-portraits/mark.png',
    modelName: 'mark',
    type: 'shadow',
    modes: ['chat', 'werewolf', 'script_murder'],
    traits: ['Logic', 'Review', 'Patterns'],
    strengths: ['pattern spotting', 'post-game review', 'role deduction'],
    weakness: 'Feels dry if you want more theatrical energy.',
    openingLine: 'Drop the claims, timing, and vote order. I will reduce the room into something playable.',
    scoreSeed: {
      chemistry: 74,
      deduction: 95,
      clutch: 88,
      ambience: 70,
    },
  },
  {
    id: 'natori',
    slug: 'natori',
    name: 'Natori',
    title: 'Warm Lead',
    tagline: 'Quick chemistry and smooth party entry for new rooms.',
    description: 'Use when you want a friendlier teammate presence without losing the game plan.',
    previewImage: '/agent-portraits/natori.png',
    modelName: 'natori',
    type: 'rookie',
    modes: ['chat', 'script_murder'],
    traits: ['Warmth', 'Entry', 'Ease'],
    strengths: ['breaking ice', 'role immersion', 'player comfort'],
    weakness: 'Not the strongest closer when a room turns hostile.',
    openingLine: 'Let me handle the awkward first minute. You can focus on the room while I warm the table up.',
    scoreSeed: {
      chemistry: 95,
      deduction: 76,
      clutch: 73,
      ambience: 90,
    },
  },
  {
    id: 'ren',
    slug: 'ren',
    name: 'Ren',
    title: 'Main Companion',
    tagline: 'Balanced all-rounder for everyday co-play and quick consults.',
    description: 'The default party partner when you want one agent that can chat, guide, and queue with you.',
    previewImage: '/agent-portraits/ren.png',
    modelName: 'ren',
    type: 'aqua',
    modes: ['chat', 'werewolf', 'script_murder', 'mc'],
    traits: ['Reliable', 'Balanced', 'Support'],
    strengths: ['general co-play', 'room prep', 'light strategy'],
    weakness: 'Rarely the most specialized pick for a single mode.',
    openingLine: 'Pick the mode and I will stay on your side from warm-up to review.',
    scoreSeed: {
      chemistry: 90,
      deduction: 82,
      clutch: 84,
      ambience: 88,
    },
  },
  {
    id: 'rice',
    slug: 'rice',
    name: 'Rice',
    title: 'Story Reader',
    tagline: 'Line-by-line memory and clue board focus for narrative play.',
    description: 'Built for script murder sessions, clue sorting, and motive map reconstruction.',
    previewImage: '/agent-portraits/rice.png',
    modelName: 'rice',
    type: 'shadow',
    modes: ['chat', 'script_murder'],
    traits: ['Memory', 'Clues', 'Structure'],
    strengths: ['clue organization', 'motive mapping', 'scene replay'],
    weakness: 'Can over-structure casual party sessions.',
    openingLine: 'Bring me every name, clue, and contradiction. I will keep the case board clean for you.',
    scoreSeed: {
      chemistry: 80,
      deduction: 92,
      clutch: 77,
      ambience: 89,
    },
  },
  {
    id: 'shizuku',
    slug: 'shizuku',
    name: 'Shizuku',
    title: 'Role Actor',
    tagline: 'High-immersion scene presence for dramatic rooms.',
    description: 'Best when you want a companion that can hold tone, roleplay, and in-character pressure.',
    previewImage: '/agent-portraits/shizuku.png',
    modelName: 'shizuku',
    type: 'aqua',
    modes: ['chat', 'script_murder'],
    traits: ['Roleplay', 'Drama', 'Presence'],
    strengths: ['in-character talk', 'scene immersion', 'tone holding'],
    weakness: 'Less efficient for pure logic-first speed runs.',
    openingLine: 'If the room needs atmosphere, leave the scene tension to me.',
    scoreSeed: {
      chemistry: 88,
      deduction: 74,
      clutch: 75,
      ambience: 96,
    },
  },
  {
    id: 'wanko',
    slug: 'wanko',
    name: 'Wanko',
    title: 'Hype Bench',
    tagline: 'Fast reactions, clutch morale, and party momentum.',
    description: 'Use when you want a louder co-player that can keep the room active and lift weak turns.',
    previewImage: '/agent-portraits/wanko.png',
    modelName: 'wanko',
    type: 'rookie',
    modes: ['chat', 'werewolf', 'mc'],
    traits: ['Hype', 'Speed', 'Lift'],
    strengths: ['morale boosts', 'quick reads', 'pace recovery'],
    weakness: 'Can overshare if you need a colder surface.',
    openingLine: 'If the room starts dying, I can bring the energy back before the whole match flattens out.',
    scoreSeed: {
      chemistry: 91,
      deduction: 72,
      clutch: 83,
      ambience: 87,
    },
  },
];

export const AGENT_SHOWROOM_INDEX = Object.fromEntries(
  AGENT_SHOWROOM.map((agent) => [agent.id, agent]),
) as Record<string, AgentShowcaseEntry>;

export function findAgentShowcase(agentId?: string | null): AgentShowcaseEntry | null {
  if (!agentId) return null;
  return AGENT_SHOWROOM_INDEX[agentId] ?? null;
}

export function getAgentModesLabel(agent: AgentShowcaseEntry) {
  return agent.modes
    .map((mode) => {
      if (mode === 'script_murder') return 'Script Murder';
      if (mode === 'mc') return 'MC';
      return mode.charAt(0).toUpperCase() + mode.slice(1);
    })
    .join(' / ');
}

export function toAICompanion(agent: AgentShowcaseEntry): AICompanion {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    description: agent.description,
    avatar_url: agent.previewImage,
    officialPersona: getOfficialCompanionPersona(agent.id),
    personality: {
      traits: agent.traits,
      style: agent.title,
    },
    skills: {
      strengths: agent.strengths,
      weakness: agent.weakness,
    },
    unlock_level: 1,
    created_at: CREATED_AT,
  };
}

export function getAgentCompanions(): AICompanion[] {
  return AGENT_SHOWROOM.map(toAICompanion);
}
