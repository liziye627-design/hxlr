import { describe, expect, it } from 'vitest';
import { AGENT_SHOWROOM_INDEX } from '../src/config/agentRoster';
import { PARTNER_MODE_CARDS } from '../src/config/partnerHome';
import {
  buildFaceToFaceReply,
  buildFaceToFaceStageCopy,
} from '../src/config/faceToFaceChat.ts';

describe('face-to-face chat config', () => {
  it('turns the teammate entry into a direct face-to-face chat jump', () => {
    const teammateMode = PARTNER_MODE_CARDS.find((item) => item.id === 'teammate');

    expect(teammateMode?.path).toBe('/chat');
    expect(teammateMode?.cta).toBe('去面对面聊天');
  });

  it('builds a minimal chat shell around the selected digital human', () => {
    const stageCopy = buildFaceToFaceStageCopy(AGENT_SHOWROOM_INDEX.haru);

    expect(stageCopy.title).toContain('面对面聊天');
    expect(stageCopy.placeholder).toContain('Haru');
    expect(stageCopy.quickPrompts).toHaveLength(4);
    expect(stageCopy.quickPrompts[0]).toContain('开场');
  });

  it('keeps the reply style focused on live game help', () => {
    const reply = buildFaceToFaceReply(AGENT_SHOWROOM_INDEX.haru, '帮我准备狼人杀开场');

    expect(reply).toContain('Haru');
    expect(reply).toContain('第一轮');
  });
});
