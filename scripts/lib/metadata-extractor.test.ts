/**
 * Property-based tests for metadata-extractor
 * 
 * **Feature: local-script-import, Property 1: Player count parsing consistency**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  extractTitleFromFolderName,
  parsePlayerCount,
  inferCategory,
  inferDifficulty,
} from './metadata-extractor';

describe('MetadataExtractor', () => {
  /**
   * **Feature: local-script-import, Property 1: Player count parsing consistency**
   * 
   * *For any* folder name containing a player count pattern like "(N人)" or "(N人开放)",
   * parsing the player count should extract the correct integer N as both min and max players.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 1: Player count parsing consistency', () => {
    it('should extract correct player count from (N人) pattern', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (playerCount, prefix) => {
            const folderName = `${prefix}（${playerCount}人）`;
            const result = parsePlayerCount(folderName);
            
            expect(result.min).toBe(playerCount);
            expect(result.max).toBe(playerCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract correct player count from (N人开放) pattern', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (playerCount, prefix) => {
            const folderName = `${prefix}（${playerCount}人开放）`;
            const result = parsePlayerCount(folderName);
            
            expect(result.min).toBe(playerCount);
            expect(result.max).toBe(playerCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return default values when no pattern found', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !/[（(]\d+人/.test(s)),
          (folderName) => {
            const result = parsePlayerCount(folderName);
            
            expect(result.min).toBe(4);
            expect(result.max).toBe(8);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('extractTitleFromFolderName', () => {
    it('should remove leading numbers and separators', () => {
      expect(extractTitleFromFolderName('367-第二十二条校规（7人开放）')).toBe('第二十二条校规');
      expect(extractTitleFromFolderName('5210 K系列-觉醒')).toBe('K系列-觉醒');
    });

    it('should remove watermark indicators', () => {
      expect(extractTitleFromFolderName('病娇男孩的精分日记（无水印）')).toBe('病娇男孩的精分日记');
    });

    it('should return original name if no patterns match', () => {
      expect(extractTitleFromFolderName('简单剧本')).toBe('简单剧本');
    });
  });

  describe('inferCategory', () => {
    it('should detect horror category', () => {
      expect(inferCategory('第二十二条校规')).toBe('horror');
      expect(inferCategory('恐怖之夜')).toBe('horror');
    });

    it('should detect romance category', () => {
      expect(inferCategory('病娇男孩的精分日记')).toBe('romance');
    });

    it('should default to mystery', () => {
      expect(inferCategory('K系列-觉醒')).toBe('mystery');
    });
  });

  describe('inferDifficulty', () => {
    it('should default to normal', () => {
      expect(inferDifficulty('普通剧本')).toBe('normal');
    });

    it('should detect hard difficulty', () => {
      expect(inferDifficulty('高难度剧本')).toBe('hard');
    });

    it('should detect easy difficulty', () => {
      expect(inferDifficulty('新手入门剧本')).toBe('easy');
    });
  });
});
