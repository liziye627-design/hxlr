/**
 * Script Scanner
 * 
 * Scans directories to find valid script folders containing
 * handbooks, character scripts, clues, and audio files.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ScriptFolder } from './types';

// Folder name patterns for detection
const HANDBOOK_PATTERNS = ['主持人手册', '组织者手册', 'handbook', '手册'];
const CHARACTER_PATTERNS = ['角色剧本', '剧本', 'characters', '角色'];
const CLUE_PATTERNS = ['线索', '线索卡', 'clues'];
const AUDIO_PATTERNS = ['音频', 'audio', '音乐', 'bgm'];

/**
 * Check if a folder name matches any of the given patterns
 */
function matchesPattern(folderName: string, patterns: string[]): boolean {
  const lowerName = folderName.toLowerCase();
  return patterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
}

/**
 * Find a subfolder matching the given patterns
 */
function findSubfolder(basePath: string, patterns: string[]): string | undefined {
  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && matchesPattern(entry.name, patterns)) {
        return path.join(basePath, entry.name);
      }
    }
  } catch {
    // Ignore read errors
  }
  return undefined;
}

/**
 * Check if a folder is a valid script folder by looking for characteristic subfolders
 */
export async function isValidScriptFolder(folderPath: string): Promise<boolean> {
  try {
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) return false;

    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const subfolders = entries.filter(e => e.isDirectory()).map(e => e.name);

    // A valid script folder should have at least one of: handbook, characters, or clues
    const hasHandbook = subfolders.some(name => matchesPattern(name, HANDBOOK_PATTERNS));
    const hasCharacters = subfolders.some(name => matchesPattern(name, CHARACTER_PATTERNS));
    const hasClues = subfolders.some(name => matchesPattern(name, CLUE_PATTERNS));

    return hasHandbook || hasCharacters || hasClues;
  } catch {
    return false;
  }
}

/**
 * Analyze a script folder and return its structure
 */
export function analyzeScriptFolder(folderPath: string): ScriptFolder {
  const name = path.basename(folderPath);
  
  const handbookPath = findSubfolder(folderPath, HANDBOOK_PATTERNS);
  const characterPath = findSubfolder(folderPath, CHARACTER_PATTERNS);
  const cluePath = findSubfolder(folderPath, CLUE_PATTERNS);
  const audioPath = findSubfolder(folderPath, AUDIO_PATTERNS);

  return {
    path: folderPath,
    name,
    hasHandbook: !!handbookPath,
    hasCharacters: !!characterPath,
    hasClues: !!cluePath,
    hasAudio: !!audioPath,
    handbookPath,
    characterPath,
    cluePath,
    audioPath,
  };
}

/**
 * Scan the root directory for script folders
 */
export async function scanRootDirectory(rootPath: string): Promise<ScriptFolder[]> {
  const scriptFolders: ScriptFolder[] = [];

  try {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      // Skip common non-script directories
      const skipDirs = ['node_modules', '.git', 'dist', 'src', 'public', '.kiro', '.trae', 'docs', 'rules', 'supabase', 'scripts'];
      if (skipDirs.includes(entry.name)) continue;

      const folderPath = path.join(rootPath, entry.name);
      
      if (await isValidScriptFolder(folderPath)) {
        const scriptFolder = analyzeScriptFolder(folderPath);
        scriptFolders.push(scriptFolder);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${rootPath}:`, error);
  }

  return scriptFolders;
}

/**
 * Get all PDF files in a directory
 */
export function getPdfFiles(dirPath: string): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
      .map(e => path.join(dirPath, e.name));
  } catch {
    return [];
  }
}

/**
 * Get all audio files in a directory
 */
export function getAudioFiles(dirPath: string): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    return entries
      .filter(e => e.isFile() && audioExtensions.some(ext => e.name.toLowerCase().endsWith(ext)))
      .map(e => path.join(dirPath, e.name));
  } catch {
    return [];
  }
}
