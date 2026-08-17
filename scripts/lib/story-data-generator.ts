/**
 * Story Data Generator
 * 
 * Generates the story_data JSON structure from script folder contents.
 */

import * as path from 'path';
import type { ScriptFolder, ScriptMetadata, StoryData, Character, Clue, AudioFile } from './types';
import { getPdfFiles, getAudioFiles } from './script-scanner';

/**
 * Generate a URL-safe ID from a name
 */
function generateId(prefix: string, name: string): string {
  const safeName = name
    .replace(/\s+/g, '_')
    .replace(/[^\w\u4e00-\u9fa5]/g, '')
    .toLowerCase();
  return `${prefix}_${safeName}_${Date.now().toString(36)}`;
}

/**
 * Extract character name from PDF filename
 * Removes .pdf extension and common suffixes like "上", "下"
 */
export function extractCharacterName(filename: string): string {
  let name = path.basename(filename, '.pdf');
  // Remove common suffixes for multi-part character scripts
  name = name.replace(/[上下]$/, '').trim();
  return name;
}

/**
 * Extract characters from a character folder
 */
export function extractCharacters(characterFolderPath: string, scriptBasePath: string): Character[] {
  const pdfFiles = getPdfFiles(characterFolderPath);
  const characters: Character[] = [];
  const seenNames = new Set<string>();

  for (const pdfPath of pdfFiles) {
    const name = extractCharacterName(pdfPath);
    
    // Skip duplicates (e.g., 吕思琦上.pdf and 吕思琦下.pdf)
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const relativePath = path.relative(scriptBasePath, pdfPath).replace(/\\/g, '/');
    
    characters.push({
      id: generateId('char', name),
      name,
      pdfPath: `/${relativePath}`,
      description: `角色：${name}`,
    });
  }

  return characters;
}

/**
 * Extract clues from a clue folder
 */
export function extractClues(clueFolderPath: string, scriptBasePath: string): Clue[] {
  const pdfFiles = getPdfFiles(clueFolderPath);
  const clues: Clue[] = [];

  for (const pdfPath of pdfFiles) {
    const title = path.basename(pdfPath, '.pdf');
    const relativePath = path.relative(scriptBasePath, pdfPath).replace(/\\/g, '/');

    clues.push({
      id: generateId('clue', title),
      title,
      pdfPath: `/${relativePath}`,
      description: `线索：${title}`,
    });
  }

  return clues;
}

/**
 * Extract audio files from an audio folder
 */
export function extractAudioFiles(audioFolderPath: string, scriptBasePath: string): AudioFile[] {
  const audioFilePaths = getAudioFiles(audioFolderPath);
  const audioFiles: AudioFile[] = [];

  for (const filePath of audioFilePaths) {
    const name = path.basename(filePath, path.extname(filePath));
    const relativePath = path.relative(scriptBasePath, filePath).replace(/\\/g, '/');

    audioFiles.push({
      id: generateId('audio', name),
      name,
      filePath: `/${relativePath}`,
      trigger: 'manual', // Default trigger
    });
  }

  return audioFiles;
}

/**
 * Find the handbook PDF path
 */
function findHandbookPath(handbookFolderPath: string, scriptBasePath: string): string | undefined {
  const pdfFiles = getPdfFiles(handbookFolderPath);
  if (pdfFiles.length > 0) {
    const relativePath = path.relative(scriptBasePath, pdfFiles[0]).replace(/\\/g, '/');
    return `/${relativePath}`;
  }
  return undefined;
}

/**
 * Generate the complete story_data JSON structure
 */
export function generateStoryData(folder: ScriptFolder, metadata: ScriptMetadata): StoryData {
  const scriptId = metadata.title
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .toLowerCase();

  const characters = folder.characterPath 
    ? extractCharacters(folder.characterPath, folder.path)
    : [];

  const clues = folder.cluePath
    ? extractClues(folder.cluePath, folder.path)
    : [];

  const audioFiles = folder.audioPath
    ? extractAudioFiles(folder.audioPath, folder.path)
    : [];

  const handbookPath = folder.handbookPath
    ? findHandbookPath(folder.handbookPath, folder.path)
    : undefined;

  // Estimate game time based on character count
  const estimatedHours = Math.max(2, Math.min(6, characters.length));
  const estimatedTime = `${estimatedHours}-${estimatedHours + 1}小时`;

  // Generate tags based on category
  const categoryTags: Record<string, string[]> = {
    horror: ['恐怖', '悬疑', '心理'],
    mystery: ['推理', '悬疑', '解谜'],
    romance: ['情感', '心理', '悬疑'],
    comedy: ['欢乐', '轻松', '搞笑'],
    thriller: ['惊悚', '悬疑', '推理'],
  };

  return {
    scriptId,
    intro: `欢迎体验《${metadata.title}》，一场精彩的剧本杀之旅即将开始...`,
    chapters: Math.max(1, characters.length),
    estimatedTime,
    tags: categoryTags[metadata.category] || ['悬疑'],
    characters,
    clues,
    audioFiles,
    gameAssets: {
      handbookPath,
    },
  };
}

/**
 * Serialize StoryData to JSON string
 */
export function serializeStoryData(storyData: StoryData): string {
  return JSON.stringify(storyData);
}

/**
 * Deserialize JSON string to StoryData
 */
export function deserializeStoryData(json: string): StoryData {
  return JSON.parse(json) as StoryData;
}
