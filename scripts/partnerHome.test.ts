import { describe, expect, it } from 'vitest';
import { AGENT_SHOWROOM } from '../src/config/agentRoster';
import { PARTNER_MODE_CARDS, PARTNER_QUICK_JUMPS, buildPartnerRoster } from '../src/config/partnerHome';
import type { AgentLeaderboardEntry } from '../src/types';

function createLeaderboardEntry(
  agentId: string,
  score: number,
  reviewCount: number,
): AgentLeaderboardEntry {
  const agent = AGENT_SHOWROOM.find((entry) => entry.id === agentId);

  if (!agent) {
    throw new Error(`Unknown agent ${agentId}`);
  }

  return {
    agentId,
    agentName: agent.name,
    title: agent.title,
    previewImage: agent.previewImage,
    modelName: agent.modelName,
    reviewCount,
    averageOverall: score,
    averageChemistry: score,
    averageDeduction: score,
    averageClutch: score,
    trendScore: score,
    recentSuggestion: agent.openingLine,
    recommendedModes: agent.modes.filter(
      (mode): mode is 'werewolf' | 'script_murder' | 'chat' | 'mc' =>
        mode === 'werewolf' || mode === 'script_murder' || mode === 'chat' || mode === 'mc',
    ),
  };
}

describe('partner home config', () => {
  it('keeps the homepage entry surfaces in the intended order', () => {
    expect(PARTNER_MODE_CARDS.map((item) => item.id)).toEqual([
      'werewolf',
      'script_murder',
      'teammate',
    ]);

    expect(PARTNER_QUICK_JUMPS.map((item) => item.path)).toEqual([
      '/werewolf',
      '/script-murder',
      '/rankings',
    ]);
  });

  it('pins the selected agent first, then sorts the rest by trend score', () => {
    const roster = buildPartnerRoster(
      AGENT_SHOWROOM.slice(0, 4),
      [
        createLeaderboardEntry('hiyori', 4.7, 18),
        createLeaderboardEntry('mark', 4.9, 12),
        createLeaderboardEntry('mao-pro', 4.5, 20),
      ],
      'mao-pro',
    );

    expect(roster.map((item) => item.id)).toEqual(['mao-pro', 'mark', 'hiyori', 'haru']);
    expect(roster[0]?.isSelected).toBe(true);
    expect(roster[1]?.score).toBe(4.9);
  });
});
