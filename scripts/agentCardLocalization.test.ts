import { describe, expect, it } from 'vitest';
import { AGENT_SHOWROOM } from '../src/config/agentRoster';
import {
  getLocalizedAgentModesLabel,
  getLocalizedAgentTraits,
  getPartnerAgentCopy,
} from '../src/config/partnerHome';

describe('agent card localization helpers', () => {
  it('returns localized copy for known agents', () => {
    const haru = AGENT_SHOWROOM.find((agent) => agent.id === 'haru');

    if (!haru) {
      throw new Error('Haru missing from showroom');
    }

    const copy = getPartnerAgentCopy(haru);

    expect(copy.title).toBe('开局指挥');
    expect(copy.tagline).toContain('开场快');
    expect(copy.openingLine).toContain('第一轮');
  });

  it('localizes traits and supported modes for display cards', () => {
    const ren = AGENT_SHOWROOM.find((agent) => agent.id === 'ren');

    if (!ren) {
      throw new Error('Ren missing from showroom');
    }

    expect(getLocalizedAgentTraits(ren)).toEqual(['可靠', '均衡', '辅助']);
    expect(getLocalizedAgentModesLabel(ren)).toBe('聊天 / 狼人杀 / 剧本杀 / 冒险');
  });

  it('uses generated portrait assets instead of atlas textures for previews', () => {
    expect(AGENT_SHOWROOM.every((agent) => agent.previewImage.startsWith('/agent-portraits/'))).toBe(true);
  });
});
