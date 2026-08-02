import { describe, expect, test } from 'vitest';
import type { AICompanion } from '../src/types';
import { AGENT_SHOWROOM_INDEX, toAICompanion } from '../src/config/agentRoster';
import { aiService } from '../src/services/ai.ts';

type CompanionWithOfficialPersona = AICompanion & {
  officialPersona?: {
    officialName: string;
    assetType: string;
    sourceKind: string;
    sourceUrl: string;
    promptSeed: {
      role: string;
      visual: string[];
      behavior: string[];
      voice: string[];
    };
    compliance: {
      status: string;
      notes: string[];
    };
  };
};

describe('official companion persona registry', () => {
  test('maps supported live2d samples into prompt-ready official persona metadata', () => {
    const companion = toAICompanion(AGENT_SHOWROOM_INDEX.haru) as CompanionWithOfficialPersona;

    expect(companion.officialPersona).toMatchObject({
      officialName: 'Haru',
      assetType: 'live2d',
      sourceKind: 'live2d-sample',
      compliance: {
        status: 'review_required',
      },
    });
    expect(companion.officialPersona?.sourceUrl).toContain('live2d.com');
    expect(companion.officialPersona?.promptSeed.visual).toContain('bright anime heroine silhouette');
    expect(companion.officialPersona?.promptSeed.behavior).toContain('quick reads and upbeat table momentum');
  });

  test('injects official persona seed and usage constraints into the system prompt', () => {
    const companion = toAICompanion(AGENT_SHOWROOM_INDEX.haru);
    const prompt = aiService.generateSystemPrompt(companion);

    expect(prompt).toContain('Official persona seed');
    expect(prompt).toContain('Haru');
    expect(prompt).toContain('bright anime heroine silhouette');
    expect(prompt).toContain('quick reads and upbeat table momentum');
    expect(prompt).toContain('Usage constraints');
    expect(prompt).toContain('Live2D sample data');
  });
});
