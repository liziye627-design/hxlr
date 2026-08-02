import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AGENT_SHOWROOM } from '../src/config/agentRoster';

const vtuberRoot = path.resolve(process.cwd(), 'Open-LLM-VTuber');
const charactersDir = path.join(vtuberRoot, 'characters');
const avatarsDir = path.join(vtuberRoot, 'avatars');
const modelDictPath = path.join(vtuberRoot, 'model_dict.json');

describe('avatar stage vtuber coverage', () => {
  it('provides a switchable vtuber character config for every showroom agent', () => {
    const missingConfigs = AGENT_SHOWROOM.filter((agent) => {
      const configPath = path.join(charactersDir, `${agent.modelName}.yaml`);
      return !fs.existsSync(configPath);
    }).map((agent) => agent.modelName);

    expect(missingConfigs).toEqual([]);
  });

  it('keeps avatar assets and live2d model entries aligned with the showroom roster', () => {
    const modelDict = JSON.parse(fs.readFileSync(modelDictPath, 'utf8')) as Array<{ name: string }>;
    const knownModels = new Set(modelDict.map((entry) => entry.name));

    const missingAssets = AGENT_SHOWROOM.filter((agent) => {
      const avatarName = path.basename(agent.previewImage);
      return !fs.existsSync(path.join(avatarsDir, avatarName)) || !knownModels.has(agent.modelName);
    }).map((agent) => agent.id);

    expect(missingAssets).toEqual([]);
  });
});
