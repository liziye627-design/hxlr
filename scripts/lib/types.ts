/**
 * Type definitions for the local script import feature
 */

export interface ScriptFolder {
  path: string;
  name: string;
  hasHandbook: boolean;
  hasCharacters: boolean;
  hasClues: boolean;
  hasAudio: boolean;
  handbookPath?: string;
  characterPath?: string;
  cluePath?: string;
  audioPath?: string;
}

export interface ScriptMetadata {
  title: string;
  minPlayers: number;
  maxPlayers: number;
  category: 'horror' | 'mystery' | 'romance' | 'comedy' | 'thriller';
  difficulty: 'easy' | 'normal' | 'hard';
  description: string;
}

export interface Character {
  id: string;
  name: string;
  pdfPath: string;
  description: string;
}

export interface Clue {
  id: string;
  title: string;
  pdfPath: string;
  description: string;
}

export interface AudioFile {
  id: string;
  name: string;
  filePath: string;
  trigger: string;
}

export interface StoryData {
  scriptId: string;
  intro: string;
  chapters: number;
  estimatedTime: string;
  tags: string[];
  characters: Character[];
  clues: Clue[];
  audioFiles: AudioFile[];
  gameAssets: {
    handbookPath?: string;
    identityCardsPath?: string;
  };
}

export interface StoryRecord {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  min_players: number;
  max_players: number;
  description: string;
  cover_url: string;
  story_data: StoryData;
  is_premium: boolean;
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: Array<{ folder: string; error: string }>;
}
