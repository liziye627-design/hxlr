/**
 * Property-based tests for defaults
 * 
 * Tests Properties 7 and 8 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDefaultCoverUrl, generateDescription } from './defaults';

describe('Defaults', () => {
  /**
   * **Feature: local-script-import, Property 7: Default cover URL validity**
   * 
   * *For any* script without a cover image, the assigned default cover URL should
   * be a valid Unsplash URL string starting with "https://images.unsplash.com/".
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 7: Default cover URL validity', () => {
    it('should return valid Unsplash URL for known categories', () => {
      const categories = ['horror', 'mystery', 'romance', 'comedy', 'thriller'];
      
      for (const category of categories) {
        const url = getDefaultCoverUrl(category);
        expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
      }
    });

    it('should return valid Unsplash URL for any category string', () => {
      fc.assert(
        fc.property(fc.string(), (category) => {
          const url = getDefaultCoverUrl(category);
          
          // URL should always start with Unsplash prefix
          expect(url.startsWith('https://images.unsplash.com/')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return non-empty URL for any input', () => {
      fc.assert(
        fc.property(fc.string(), (category) => {
          const url = getDefaultCoverUrl(category);
          
          expect(url.length).toBeGreaterThan(0);
          expect(url).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: local-script-import, Property 8: Description contains title**
   * 
   * *For any* generated script description, the description string should
   * contain the script title as a substring.
   * 
   * **Validates: Requirements 4.5**
   */
  describe('Property 8: Description contains title', () => {
    it('should include title in generated description', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const description = generateDescription(title);
            
            // Description should contain the title
            expect(description).toContain(title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate non-empty description', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const description = generateDescription(title);
            
            expect(description.length).toBeGreaterThan(0);
            expect(description.length).toBeGreaterThan(title.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate consistent description for same title', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const description1 = generateDescription(title);
            const description2 = generateDescription(title);
            
            // Same title should produce same description
            expect(description1).toBe(description2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
