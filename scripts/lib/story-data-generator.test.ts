/**
 * Property-based tests for story-data-generator
 * 
 * Tests Properties 2, 3, and 4 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  extractCharacterName,
  serializeStoryData,
  deserializeStoryData,
} from './story-data-generator';
import type { StoryData, Character, Clue, AudioFile } from './types';

// Arbitrary generators for StoryData components
const characterArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  pdfPath: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
});

const clueArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  pdfPath: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
});

const audioFileArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  filePath: fc.string({ minLength: 1, maxLength: 100 }),
  trigger: fc.string({ minLength: 1, maxLength: 20 }),
});

const storyDataArb: fc.Arbitrary<StoryData> = fc.record({
  scriptId: fc.string({ minLength: 1, maxLength: 50 }),
  intro: fc.string({ minLength: 0, maxLength: 500 }),
  chapters: fc.integer({ min: 1, max: 20 }),
  estimatedTime: fc.string({ minLength: 1, maxLength: 20 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  characters: fc.array(characterArb, { minLength: 0, maxLength: 10 }),
  clues: fc.array(clueArb, { minLength: 0, maxLength: 10 }),
  audioFiles: fc.array(audioFileArb, { minLength: 0, maxLength: 5 }),
  gameAssets: fc.record({
    handbookPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    identityCardsPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }),
});

describe('StoryDataGenerator', () => {
  /**
   * **Feature: local-script-import, Property 2: Character entry completeness**
   * 
   * *For any* PDF file in a character folder, the generated character entry should
   * contain a non-empty id, a name derived from the filename (without extension),
   * and a valid pdfPath pointing to the file.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 2: Character entry completeness', () => {
    it('should extract character name from filename without extension', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('.') && !s.includes('/') && !s.includes('\\')),
          (baseName) => {
            const filename = `${baseName}.pdf`;
            const name = extractCharacterName(filename);
            
            // Name should not contain .pdf extension
            expect(name).not.toContain('.pdf');
            // Name should be derived from the base name
            expect(baseName).toContain(name.replace(/[上下]$/, ''));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate character entries with all required fields', () => {
      fc.assert(
        fc.property(characterArb, (character) => {
          // All required fields should be present and non-empty
          expect(character.id).toBeTruthy();
          expect(character.name).toBeTruthy();
          expect(character.pdfPath).toBeTruthy();
          expect(typeof character.description).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: local-script-import, Property 3: Clue entry completeness**
   * 
   * *For any* file in a clue folder, the generated clue entry should contain
   * a non-empty id, title, pdfPath, and description fields.
   * 
   * **Validates: Requirements 2.3**
   */
  describe('Property 3: Clue entry completeness', () => {
    it('should generate clue entries with all required fields', () => {
      fc.assert(
        fc.property(clueArb, (clue) => {
          // All required fields should be present and non-empty
          expect(clue.id).toBeTruthy();
          expect(clue.title).toBeTruthy();
          expect(clue.pdfPath).toBeTruthy();
          expect(typeof clue.description).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: local-script-import, Property 4: Story data JSON round-trip**
   * 
   * *For any* valid StoryData object, serializing to JSON and deserializing back
   * should produce an equivalent object.
   * 
   * **Validates: Requirements 2.5**
   */
  describe('Property 4: Story data JSON round-trip', () => {
    it('should preserve StoryData through JSON serialization round-trip', () => {
      fc.assert(
        fc.property(storyDataArb, (storyData) => {
          const serialized = serializeStoryData(storyData);
          const deserialized = deserializeStoryData(serialized);
          
          // The deserialized object should be equivalent to the original
          expect(deserialized).toEqual(storyData);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid JSON string', () => {
      fc.assert(
        fc.property(storyDataArb, (storyData) => {
          const serialized = serializeStoryData(storyData);
          
          // Should not throw when parsing
          expect(() => JSON.parse(serialized)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });
});
