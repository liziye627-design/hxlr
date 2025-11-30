/**
 * Database Service
 * 
 * Handles Supabase operations for checking duplicates and inserting stories.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StoryRecord, StoryData } from './types';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client using environment variables
 */
export function initializeSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Get the Supabase client, initializing if necessary
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Check if a story with the given title already exists in the database
 */
export async function checkExists(title: string): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('stories')
    .select('id')
    .eq('title', title)
    .maybeSingle();

  if (error) {
    console.error(`Error checking for existing story "${title}":`, error);
    throw error;
  }

  return data !== null;
}

/**
 * Insert a new story into the database
 */
export async function insertStory(story: StoryRecord): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('stories')
    .insert({
      id: story.id,
      title: story.title,
      category: story.category,
      difficulty: story.difficulty,
      min_players: story.min_players,
      max_players: story.max_players,
      description: story.description,
      cover_url: story.cover_url,
      story_data: story.story_data,
      is_premium: story.is_premium,
    });

  if (error) {
    console.error(`Error inserting story "${story.title}":`, error);
    throw error;
  }
}

/**
 * Database service interface for testing/mocking
 */
export interface DatabaseService {
  checkExists(title: string): Promise<boolean>;
  insertStory(story: StoryRecord): Promise<void>;
}

/**
 * Create a database service instance
 */
export function createDatabaseService(): DatabaseService {
  return {
    checkExists,
    insertStory,
  };
}

/**
 * Create a mock database service for testing
 */
export function createMockDatabaseService(existingTitles: Set<string> = new Set()): DatabaseService {
  const insertedStories: StoryRecord[] = [];

  return {
    async checkExists(title: string): Promise<boolean> {
      return existingTitles.has(title);
    },
    async insertStory(story: StoryRecord): Promise<void> {
      if (existingTitles.has(story.title)) {
        throw new Error(`Story "${story.title}" already exists`);
      }
      existingTitles.add(story.title);
      insertedStories.push(story);
    },
  };
}
