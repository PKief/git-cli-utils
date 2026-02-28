/**
 * Shared utility functions for the git-cli-utils codebase
 */

/**
 * Extracts a string message from an unknown error type.
 * Replaces the duplicated pattern: `error instanceof Error ? error.message : String(error)`
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Performs fuzzy filtering on a list of items.
 * Supports three matching strategies:
 * 1. Direct substring match
 * 2. Match ignoring separators (-, _, /, ., space)
 * 3. Character-by-character fuzzy match
 *
 * @param items - The array of items to filter
 * @param searchTerm - The search term to match against
 * @param getSearchableText - Function to extract searchable text from each item
 * @returns Filtered array of matching items
 */
export function fuzzyFilter<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!searchTerm) {
    return items;
  }

  const normalizedSearchTerm = searchTerm.toLowerCase();

  return items.filter((item) => {
    const searchableText = getSearchableText(item).toLowerCase();

    // Strategy 1: Direct substring match
    if (searchableText.includes(normalizedSearchTerm)) {
      return true;
    }

    // Strategy 2: Match ignoring separators
    const textNoSeparators = searchableText.replace(/[-_\/\.\s]/g, '');
    const searchTermNoSeparators = normalizedSearchTerm.replace(
      /[-_\/\.\s]/g,
      ''
    );

    if (textNoSeparators.includes(searchTermNoSeparators)) {
      return true;
    }

    // Strategy 3: Character-by-character fuzzy match
    let searchIndex = 0;
    for (
      let i = 0;
      i < textNoSeparators.length &&
      searchIndex < searchTermNoSeparators.length;
      i++
    ) {
      if (textNoSeparators[i] === searchTermNoSeparators[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === searchTermNoSeparators.length;
  });
}

/**
 * Simple filter that only does direct substring matching.
 * Use this for simple cases where fuzzy matching is not needed.
 *
 * @param items - The array of items to filter
 * @param searchTerm - The search term to match against
 * @param getSearchableText - Function to extract searchable text from each item
 * @returns Filtered array of matching items
 */
export function simpleFilter<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!searchTerm) {
    return items;
  }

  const normalizedSearchTerm = searchTerm.toLowerCase();

  return items.filter((item) => {
    const searchableText = getSearchableText(item).toLowerCase();
    return searchableText.includes(normalizedSearchTerm);
  });
}
