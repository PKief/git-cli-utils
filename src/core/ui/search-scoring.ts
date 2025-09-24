/**
 * Search scoring utilities for ranking search results
 */

/**
 * Calculate character-by-character fuzzy match score
 * Returns a score based on how well scattered characters match, or Infinity if no match
 */
function calculateCharacterMatchScore(
  text: string,
  searchTerm: string
): number {
  if (searchTerm.length === 0) return 0;
  if (text.length === 0) return Infinity;

  let textIndex = 0;
  let searchIndex = 0;
  const matchedPositions: number[] = [];

  // Try to find all search characters in order within the text
  while (textIndex < text.length && searchIndex < searchTerm.length) {
    if (text[textIndex] === searchTerm[searchIndex]) {
      matchedPositions.push(textIndex);
      searchIndex++;
    }
    textIndex++;
  }

  // If we didn't match all characters, no fuzzy match
  if (searchIndex < searchTerm.length) {
    return Infinity;
  }

  // Calculate score based on how spread out the matches are
  // Closer matches get better scores
  if (matchedPositions.length === 0) return Infinity;

  const firstMatch = matchedPositions[0];
  const lastMatch = matchedPositions[matchedPositions.length - 1];
  const matchSpread = lastMatch - firstMatch;

  // Score based on spread and starting position
  // Lower spread = better score, earlier start = better score
  return firstMatch + matchSpread;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  originalIndex: number;
  baseScore: number;
}

/**
 * Simple search matching: exact matches rank higher than fuzzy matches
 * Returns a score where lower is better (0 = perfect match)
 */
export function calculateRelevanceScore(
  text: string,
  searchTerm: string
): number {
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();

  // 1. Exact substring match (best possible score)
  if (normalizedText.includes(normalizedSearch)) {
    const matchIndex = normalizedText.indexOf(normalizedSearch);

    // Bonus for word boundary matches (like "feat:" vs "feature")
    const charAfterMatch = normalizedText[matchIndex + normalizedSearch.length];
    const isWordBoundary =
      !charAfterMatch || /[\s\-_:\/\.]/.test(charAfterMatch);
    const wordBoundaryBonus = isWordBoundary ? 0 : 0.5;

    // Return the position where match starts + word boundary bonus
    return matchIndex + wordBoundaryBonus;
  }

  // 2. Contiguous fuzzy matching (after removing separators)
  const textNoSeparators = normalizedText.replace(/[-_\/\.\s]/g, '');
  const searchNoSeparators = normalizedSearch.replace(/[-_\/\.\s]/g, '');

  if (textNoSeparators.includes(searchNoSeparators)) {
    const matchIndex = textNoSeparators.indexOf(searchNoSeparators);
    // Add 1000 to ensure fuzzy matches always rank lower than exact matches
    return 1000 + matchIndex;
  }

  // 3. Character-by-character fuzzy matching (scattered characters)
  const charMatchScore = calculateCharacterMatchScore(
    normalizedText,
    normalizedSearch
  );
  if (charMatchScore !== Infinity) {
    // Add 2000 to ensure scattered matches rank lower than contiguous fuzzy matches
    return 2000 + charMatchScore;
  }

  // 4. No match found
  return Infinity;
} /**
 * Filter and rank items based on search term with simple scoring
 * Exact matches always rank higher than fuzzy matches
 */
export function rankSearchResults<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): SearchResult<T>[] {
  if (!searchTerm) {
    return items.map((item, originalIndex) => ({
      item,
      score: originalIndex,
      originalIndex,
      baseScore: originalIndex,
    }));
  }

  // Create items with relevance scores
  const itemsWithScores = items
    .map((item, originalIndex) => {
      const itemText = getSearchableText(item);
      const baseScore = calculateRelevanceScore(itemText, searchTerm);

      // Simple recency bonus: add a small value based on position
      // This only affects items with the same base score
      const recencyBonus = originalIndex * 0.01;
      const finalScore = baseScore + recencyBonus;

      return {
        item,
        score: finalScore,
        originalIndex,
        baseScore,
      };
    })
    .filter(({ baseScore }) => baseScore !== Infinity) // Only include items that match
    .sort((a, b) => {
      // Sort by score (lower is better)
      return a.score - b.score;
    });

  return itemsWithScores;
}
