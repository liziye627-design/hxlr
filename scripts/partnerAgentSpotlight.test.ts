import { describe, expect, test } from 'vitest';
import { AGENT_SHOWROOM_INDEX, type AgentShowcaseEntry } from '../src/config/agentRoster';
import { getPartnerAgentSpotlight } from '../src/config/partnerHome';

describe('getPartnerAgentSpotlight', () => {
  test('returns a rich spotlight profile with a three-image deck', () => {
    const spotlight = getPartnerAgentSpotlight(AGENT_SHOWROOM_INDEX.haru);

    expect(spotlight.kicker).toBeTruthy();
    expect(spotlight.moodTags.length).toBeGreaterThanOrEqual(3);
    expect(spotlight.story).toHaveLength(3);
    expect(spotlight.story.some((line) => line.parts.some((part) => part.tone))).toBe(true);
    expect(spotlight.imageDeck).toHaveLength(3);
    expect(spotlight.imageDeck.map((image) => image.src)).toEqual([
      '/agent-portraits/haru.png',
      '/agent-gallery/haru.png',
      '/agent-portraits/haru.png',
    ]);
  });

  test('falls back to localized agent copy and slug-based images when no override exists', () => {
    const fallbackAgent: AgentShowcaseEntry = {
      ...AGENT_SHOWROOM_INDEX.haru,
      id: 'guest',
      slug: 'guest',
      name: 'Guest',
      title: '临时队友',
      tagline: '一张临时卡也应该能渲染完整资料。',
      openingLine: '先给我一个默认人设，我再陪你入场。',
    };

    const spotlight = getPartnerAgentSpotlight(fallbackAgent);

    expect(spotlight.title).toBe('临时队友');
    expect(spotlight.tagline).toBe('一张临时卡也应该能渲染完整资料。');
    expect(spotlight.openingLine).toBe('先给我一个默认人设，我再陪你入场。');
    expect(spotlight.imageDeck[1]?.src).toBe('/agent-gallery/guest.png');
    expect(spotlight.story[0]?.label).toBe('人物印象');
  });
});
