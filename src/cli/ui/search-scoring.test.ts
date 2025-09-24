import { describe, expect, it } from 'bun:test';
import {
  calculateRelevanceScore,
  rankSearchResults,
} from './search-scoring.js';

describe('Search Scoring', () => {
  describe('calculateRelevanceScore', () => {
    it('should give exact matches at beginning the best score (0)', () => {
      const score = calculateRelevanceScore('chore: some task', 'chore');
      expect(score).toBe(0); // Perfect match at beginning
    });

    it('should give exact matches later in text higher scores', () => {
      const score1 = calculateRelevanceScore('chore: some task', 'chore');
      const score2 = calculateRelevanceScore('some chore task', 'chore');

      expect(score1).toBeLessThan(score2); // Lower score is better
      expect(score1).toBe(0); // Match at beginning
      expect(score2).toBe(5); // Match at position 5
    });

    it('should handle fuzzy character matching with higher scores', () => {
      const exactScore = calculateRelevanceScore('fix: something', 'fix');
      const fuzzyScore = calculateRelevanceScore(
        'fix/DW16-4233-delete',
        'fixDW164'
      );

      expect(exactScore).toBeLessThan(fuzzyScore); // Exact should be better (lower score)
      expect(fuzzyScore).toBeGreaterThanOrEqual(1000); // Fuzzy matches get 1000+ scores
    });

    it('should handle scattered character matching with highest scores', () => {
      const exactScore = calculateRelevanceScore('feat: something', 'feat');
      const contiguousScore = calculateRelevanceScore(
        'fix/DW16-4233',
        'fixDW16'
      );
      const scatteredScore = calculateRelevanceScore(
        'feature-api-integration',
        'featapi'
      );

      expect(exactScore).toBeLessThan(contiguousScore); // Exact < contiguous
      expect(contiguousScore).toBeLessThan(scatteredScore); // Contiguous < scattered
      expect(scatteredScore).toBeGreaterThanOrEqual(2000); // Scattered matches get 2000+ scores
    });

    it('should return Infinity for no matches', () => {
      const score = calculateRelevanceScore('completely different', 'xyz');
      expect(score).toBe(Infinity);
    });
  });

  describe('rankSearchResults', () => {
    it('should rank exact matches higher than fuzzy matches', () => {
      const items = [
        { text: 'some other text with scattered letters f-e-a-t' },
        { text: 'feat: implement feature' },
        { text: 'random text' },
      ];

      const results = rankSearchResults(items, 'feat', (item) => item.text);

      // feat: implement feature should rank first (exact match)
      expect(results[0].item.text).toBe('feat: implement feature');
      expect(results).toHaveLength(2); // Only matching items should be included
    });

    it('should order exact matches by position in text', () => {
      const items = [
        { text: 'something chore task' }, // "chore" at position 10
        { text: 'chore: update deps' }, // "chore" at position 0
        { text: 'other chore work' }, // "chore" at position 6
      ];

      const results = rankSearchResults(items, 'chore', (item) => item.text);

      // Should be ordered by position of "chore" in text (0, 6, 10)
      expect(results[0].item.text).toBe('chore: update deps'); // Position 0
      expect(results[1].item.text).toBe('other chore work'); // Position 6
      expect(results[2].item.text).toBe('something chore task'); // Position 10
    });

    it('should apply recency bonus for items with same text match position', () => {
      const items = [
        { text: 'chore: task A' }, // index 0 (most recent, "chore" at position 0)
        { text: 'chore: task B' }, // index 1 ("chore" at position 0)
        { text: 'chore: task C' }, // index 2 (oldest, "chore" at position 0)
      ];

      const results = rankSearchResults(items, 'chore', (item) => item.text);

      // All have same base score (0), so recency should determine order
      expect(results[0].item.text).toBe('chore: task A'); // Most recent
      expect(results[1].item.text).toBe('chore: task B');
      expect(results[2].item.text).toBe('chore: task C'); // Oldest
    });

    it('should return empty array when no items match', () => {
      const items = [
        { text: 'completely different' },
        { text: 'no matches here' },
      ];

      const results = rankSearchResults(items, 'xyz', (item) => item.text);

      expect(results).toHaveLength(0);
    });

    it('should include fuzzy matches but rank them lower than exact matches', () => {
      const items = [
        { text: 'fix/DW164-delete' }, // Fuzzy match for "fixDW164" after removing separators
        { text: 'fixDW164: something' }, // Exact match
      ];

      const results = rankSearchResults(items, 'fixDW164', (item) => item.text);

      expect(results).toHaveLength(2);
      // Exact match should rank first (lower score)
      expect(results[0].item.text).toBe('fixDW164: something');
      expect(results[1].item.text).toBe('fix/DW164-delete');
    });

    it('should rank different match types correctly (exact > contiguous > scattered)', () => {
      const items = [
        { text: 'feature-api-integration' }, // Scattered match for "feat"
        { text: 'feat: implement feature' }, // Exact match for "feat"
        { text: 'fix/feature-api-test' }, // Scattered match for "feat"
      ];

      const results = rankSearchResults(items, 'feat', (item) => item.text);

      expect(results).toHaveLength(3);
      // Exact match should rank first
      expect(results[0].item.text).toBe('feat: implement feature');
      // Scattered matches should rank lower, with better position winning
      expect(results[1].item.text).toBe('feature-api-integration'); // "feat" at position 0
      expect(results[2].item.text).toBe('fix/feature-api-test'); // "feat" at position 4
    });

    it('should only include items that match the search term', () => {
      const items = [
        { text: 'chore: some task' }, // Exact match
        { text: 'completely unrelated' }, // No match
      ];

      const results = rankSearchResults(items, 'chore', (item) => item.text);

      // Should only include the match
      expect(results).toHaveLength(1);
      expect(results[0].item.text).toBe('chore: some task');
    });
  });
});
