/**
 * Search and filtering logic for SelectionList
 */

import { rankSearchResults } from '../search-scoring.js';

/**
 * Filter and rank items based on search term
 *
 * @param items - All items to filter
 * @param searchTerm - Current search query
 * @param getSearchText - Function to extract searchable text from items
 * @returns Filtered and ranked items
 */
export function filterAndRankItems<T>(
  items: T[],
  searchTerm: string,
  getSearchText: (item: T) => string
): T[] {
  if (!searchTerm) {
    return items;
  }

  const rankedResults = rankSearchResults(items, searchTerm, getSearchText);
  return rankedResults.map(({ item }) => item);
}
