import { describe, expect, it } from 'bun:test';
import { rankSearchResults } from './search-scoring.js';

describe('Interactive List Search Ranking', () => {
  describe('search result ranking', () => {
    it('should prioritize exact matches at the beginning of text', () => {
      // Arrange: Branches where one has exact match at start, other has it in middle
      const branches = [
        { name: 'master', date: '1 minute ago' },
        { name: 'chore/cypress-update-migration', date: '6 days ago' }, // "cypress" at position 6
        { name: 'cypress-test-env', date: '4 months ago' }, // "cypress" at position 0
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "cypress"
      const results = rankSearchResults(branches, 'cypress', searchFunction);

      // Assert: Match at beginning should rank first regardless of recency
      expect(results.length).toBeGreaterThan(0); // At least some cypress branches should match
      expect(results).toHaveLength(2); // Only cypress branches should match
      expect(results[0].item.name).toBe('cypress-test-env'); // Exact match at beginning (position 0)
      expect(results[1].item.name).toBe('chore/cypress-update-migration'); // Match at position 6
    });

    it('should still prioritize strong text matches when the difference is significant', () => {
      // Arrange: Branches where one has very strong text match despite being older
      const branches = [
        { name: 'some-feature', date: '1 day ago' },
        { name: 'test-automation', date: '1 month ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "test"
      const results = rankSearchResults(branches, 'test', searchFunction);

      // Assert: Strong text match should win over recency in this case
      expect(results).toHaveLength(1); // Only test-automation should match
      expect(results[0].item.name).toBe('test-automation');
    });

    it('should apply recency bonus when match positions are identical', () => {
      // Arrange: Branches with exact same match position
      const branches = [
        { name: 'api-feature-integration', date: '2 weeks ago' }, // "api" at position 0
        { name: 'api-bugfix-validation', date: '1 month ago' }, // "api" at position 0
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "api"
      const results = rankSearchResults(branches, 'api', searchFunction);

      // Assert: More recent branch should be ranked first when match positions are same
      expect(results).toHaveLength(2);
      expect(results[0].item.name).toBe('api-feature-integration'); // More recent, same position
      expect(results[1].item.name).toBe('api-bugfix-validation'); // Older, same position
    });

    it('should handle empty search term by returning original order', () => {
      // Arrange: Some branches
      const branches = [
        { name: 'master', date: '1 minute ago' },
        { name: 'develop', date: '1 day ago' },
        { name: 'feature/test', date: '1 week ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search with empty term
      const results = rankSearchResults(branches, '', searchFunction);

      // Assert: Should return all branches in original order
      expect(results).toHaveLength(3);
      expect(results[0].item.name).toBe('master');
      expect(results[1].item.name).toBe('develop');
      expect(results[2].item.name).toBe('feature/test');
    });

    it('should return empty array when no items match the search term', () => {
      // Arrange: Branches that don't match the search term
      const branches = [
        { name: 'master', date: '1 minute ago' },
        { name: 'develop', date: '1 day ago' },
        { name: 'feature/api', date: '1 week ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for something that doesn't match any branch
      const results = rankSearchResults(branches, 'wwwwww', searchFunction);

      // Assert: Should return empty array
      expect(results).toHaveLength(0);
    });

    it('should return empty array for random gibberish search terms', () => {
      // Arrange: Real branch names
      const branches = [
        { name: 'chore/cypress-update-migration', date: '6 days ago' },
        { name: 'feature/api-integration', date: '1 week ago' },
        { name: 'bugfix/validation-fix', date: '2 weeks ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for gibberish that doesn't match
      const results = rankSearchResults(branches, 'xyzabc123', searchFunction);

      // Assert: Should return empty array
      expect(results).toHaveLength(0);
    });

    it('should properly filter real branch names with test search', () => {
      // Arrange: Real branch names that match your scenario
      const branches = [
        { name: 'copilot/fix-2', date: '22 hours ago' },
        { name: 'main', date: '22 hours ago' },
        { name: 'copilot/fix-1', date: '24 hours ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "test" - none of these branches should match
      const results = rankSearchResults(branches, 'test', searchFunction);

      // Assert: Should return empty array since none contain "test"
      expect(results).toHaveLength(0);
    });
  });
});
