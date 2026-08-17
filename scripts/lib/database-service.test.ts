/**
 * Property-based tests for database-service
 * 
 * **Feature: local-script-import, Property 5: Duplicate detection prevents insertion**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createMockDatabaseService } from './database-service';
import type { StoryRecord, StoryData } from './types';

// Generate a valid StoryData object
const storyDataArb: fc.Arbitrary<StoryData> = fc.record({
  scriptId: fc.string({ minLength: 1, maxLength: 50 }),
  intro: fc.string({ minLength: 0, maxLength: 200 }),
  chapters: fc.integer({ min: 1, max: 10 }),
  estimatedTime: fc.constant('3-4小时'),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
  characters: fc.constant([]),
  clues: fc.constant([]),
  audioFiles: fc.constant([]),
  gameAssets: fc.constant({}),
});

// Generate a valid StoryRecord
const storyRecordArb: fc.Arbitrary<StoryRecord> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.constantFrom('horror', 'mystery', 'romance', 'comedy', 'thriller'),
  difficulty: fc.constantFrom('easy', 'normal', 'hard'),
  min_players: fc.integer({ min: 2, max: 10 }),
  max_players: fc.integer({ min: 2, max: 10 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  cover_url: fc.constant('https://images.unsplash.com/photo-test'),
  story_data: storyDataArb,
  is_premium: fc.boolean(),
});

describe('DatabaseService', () => {
  /**
   * **Feature: local-script-import, Property 5: Duplicate detection prevents insertion**
   * 
   * *For any* script title that already exists in the database, attempting to import
   * a folder with that title should result in the script being skipped (not inserted).
   * 
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Duplicate detection prevents insertion', () => {
    it('should detect existing titles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          async (existingTitles) => {
            const existingSet = new Set(existingTitles);
            const dbService = createMockDatabaseService(existingSet);

            // All existing titles should be detected
            for (const title of existingTitles) {
              const exists = await dbService.checkExists(title);
              expect(exists).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect non-existing titles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (existingTitles, newTitle) => {
            // Ensure newTitle is not in existingTitles
            fc.pre(!existingTitles.includes(newTitle));

            const existingSet = new Set(existingTitles);
            const dbService = createMockDatabaseService(existingSet);

            const exists = await dbService.checkExists(newTitle);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent insertion of duplicate titles', async () => {
      await fc.assert(
        fc.asyncProperty(storyRecordArb, async (story) => {
          const existingSet = new Set([story.title]);
          const dbService = createMockDatabaseService(existingSet);

          // Attempting to insert a story with existing title should throw
          await expect(dbService.insertStory(story)).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should allow insertion of new titles', async () => {
      await fc.assert(
        fc.asyncProperty(storyRecordArb, async (story) => {
          const dbService = createMockDatabaseService(new Set());

          // Inserting a new story should succeed
          await expect(dbService.insertStory(story)).resolves.not.toThrow();

          // After insertion, the title should exist
          const exists = await dbService.checkExists(story.title);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
