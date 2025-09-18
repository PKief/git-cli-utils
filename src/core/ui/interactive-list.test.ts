import { describe, expect, it } from 'bun:test';

// Import the calculateRelevanceScore function that's used internally
// We'll test the search ranking logic directly rather than through the interactive list

// Replicate the internal scoring logic to test it
function calculateRelevanceScore(text: string, searchTerm: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  let score = 0;

  // 1. Exact phrase match (highest priority)
  if (normalizedText.includes(normalizedSearch)) {
    score += 1000;

    // Bonus for exact case match
    if (text.includes(searchTerm)) {
      score += 200;
    }

    // Bonus for match at beginning (reduced to allow recency to compete)
    if (normalizedText.startsWith(normalizedSearch)) {
      score += 150;
    } else if (
      normalizedText.indexOf(normalizedSearch) <
      normalizedText.length * 0.3
    ) {
      // Bonus for match in first third of text
      score += 100;
    }

    return score;
  }

  // 2. Word-based matching - only score if ALL words are found
  const searchWords = normalizedSearch
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const textWords = normalizedText.split(/\s+/);

  let matchedWords = 0;
  let totalWordScore = 0;

  for (const searchWord of searchWords) {
    let bestWordScore = 0;
    let wordMatched = false;

    for (let i = 0; i < textWords.length; i++) {
      const textWord = textWords[i];

      if (textWord === searchWord) {
        // Exact word match
        bestWordScore = Math.max(
          bestWordScore,
          100 + (textWords.length - i) * 2
        );
        wordMatched = true;
      } else if (textWord.startsWith(searchWord)) {
        // Word starts with search term
        bestWordScore = Math.max(
          bestWordScore,
          80 + (textWords.length - i) * 2
        );
        wordMatched = true;
      } else if (textWord.includes(searchWord)) {
        // Word contains search term
        bestWordScore = Math.max(
          bestWordScore,
          60 + (textWords.length - i) * 2
        );
        wordMatched = true;
      }
    }

    if (wordMatched) {
      matchedWords++;
      totalWordScore += bestWordScore;
    }
  }

  // Only add word score if ALL search words were found
  if (matchedWords === searchWords.length) {
    score += totalWordScore;
    // Bonus for matching all words
    if (searchWords.length > 1) {
      score += 200;
    }
  }

  // 3. Fuzzy character matching (fallback)
  if (score === 0) {
    const textNoSeparators = normalizedText.replace(/[-_\/\.\s]/g, '');
    const searchNoSeparators = normalizedSearch.replace(/[-_\/\.\s]/g, '');

    if (textNoSeparators.includes(searchNoSeparators)) {
      score += 50;
    } else {
      // Sequential character matching - require matching ALL characters
      let searchIndex = 0;
      for (
        let i = 0;
        i < textNoSeparators.length && searchIndex < searchNoSeparators.length;
        i++
      ) {
        if (textNoSeparators[i] === searchNoSeparators[searchIndex]) {
          searchIndex++;
        }
      }

      // Only count if we matched ALL characters AND the search term is reasonable length
      if (
        searchIndex === searchNoSeparators.length &&
        searchNoSeparators.length >= 2
      ) {
        score = searchIndex; // Points equal to number of characters matched
      }
    }
  }

  return score;
}

// Replicate the search ranking logic
function simulateSearchRanking<T>(
  items: T[],
  getSearchableText: (item: T) => string,
  searchTerm: string
): T[] {
  if (!searchTerm) {
    return items;
  }

  // Create items with relevance scores and add recency bonus
  const itemsWithScores = items
    .map((item, originalIndex) => {
      const itemText = getSearchableText(item);
      const baseScore = calculateRelevanceScore(itemText, searchTerm);

      // Add recency bonus based on original position (earlier = more recent)
      // This helps newer items compete with older ones that have slightly higher text relevance
      const recencyBonus = Math.max(0, (items.length - originalIndex) * 150);
      const finalScore = baseScore + recencyBonus;

      return { item, score: finalScore, originalIndex, baseScore };
    })
    .filter(({ baseScore }) => baseScore > 0) // Only include items that match the search text
    .sort((a, b) => {
      // Primary sort: by final score (highest first)
      return b.score - a.score;
    });

  return itemsWithScores.map(({ item }) => item);
}

describe('Interactive List Search Ranking', () => {
  describe('recency-based ranking', () => {
    it('should rank more recent branches higher when text relevance is similar', () => {
      // Arrange: Branches with similar text relevance but different ages
      const branches = [
        { name: 'master', date: '1 minute ago' },
        { name: 'chore/cypress-update-migration', date: '6 days ago' },
        { name: 'cypress-test-env', date: '4 months ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "cypress"
      const results = simulateSearchRanking(
        branches,
        searchFunction,
        'cypress'
      );

      // Debug output
      console.log('Search results for "cypress":');
      results.forEach((branch, index) => {
        const score = calculateRelevanceScore(branch.name, 'cypress');
        const originalIndex = branches.findIndex((b) => b.name === branch.name);
        const recencyBonus = Math.max(
          0,
          (branches.length - originalIndex) * 150
        );
        console.log(
          `  ${index}: ${branch.name} (score: ${score}, recency: ${recencyBonus}, total: ${score + recencyBonus})`
        );
      });

      // Assert: More recent cypress branch should be ranked first
      expect(results.length).toBeGreaterThan(0); // At least some cypress branches should match
      expect(results).toHaveLength(2); // Only cypress branches should match
      expect(results[0].name).toBe('chore/cypress-update-migration'); // More recent
      expect(results[1].name).toBe('cypress-test-env'); // Older
    });

    it('should still prioritize strong text matches when the difference is significant', () => {
      // Arrange: Branches where one has very strong text match despite being older
      const branches = [
        { name: 'some-feature', date: '1 day ago' },
        { name: 'test-automation', date: '1 month ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "test"
      const results = simulateSearchRanking(branches, searchFunction, 'test');

      // Assert: Strong text match should win over recency in this case
      expect(results).toHaveLength(1); // Only test-automation should match
      expect(results[0].name).toBe('test-automation');
    });

    it('should apply recency bonus correctly when scores are close', () => {
      // Arrange: Branches with very similar text relevance
      const branches = [
        { name: 'feature/api-integration', date: '2 weeks ago' },
        { name: 'bugfix/api-validation', date: '1 month ago' },
      ];

      const searchFunction = (branch: (typeof branches)[0]) => branch.name;

      // Act: Search for "api"
      const results = simulateSearchRanking(branches, searchFunction, 'api');

      // Assert: More recent branch should be ranked first due to recency bonus
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('feature/api-integration'); // More recent
      expect(results[1].name).toBe('bugfix/api-validation'); // Older
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
      const results = simulateSearchRanking(branches, searchFunction, '');

      // Assert: Should return all branches in original order
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('master');
      expect(results[1].name).toBe('develop');
      expect(results[2].name).toBe('feature/test');
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
      const results = simulateSearchRanking(branches, searchFunction, 'wwwwww');

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
      const results = simulateSearchRanking(
        branches,
        searchFunction,
        'xyzabc123'
      );

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
      const results = simulateSearchRanking(branches, searchFunction, 'test');

      // Assert: Should return empty array since none contain "test"
      expect(results).toHaveLength(0);
    });
  });
});
