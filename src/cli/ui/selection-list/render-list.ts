/**
 * List rendering and text highlighting for SelectionList
 */

import { highlightExact, highlightFuzzy, highlightSelected } from '../ansi.js';
import type { ListRenderConfig } from './types.js';

/**
 * Applies appropriate highlighting to text based on search term and selection state
 *
 * @param displayText - The full text to display (may include formatting)
 * @param searchableText - The portion of text that should be searched
 * @param searchTerm - Current search query
 * @param isSelected - Whether this item is currently selected
 */
function applyTextHighlighting(
  displayText: string,
  searchableText: string,
  searchTerm: string,
  isSelected = false
): string {
  // No search term: apply green background if selected, otherwise return as-is
  if (!searchTerm) {
    return isSelected ? highlightSelected(displayText) : displayText;
  }

  // Find where the searchable content appears in the display text
  const searchableStartIndex = displayText.indexOf(searchableText);

  if (searchableStartIndex !== -1) {
    // Split display text into: [prefix] [searchable content] [suffix]
    const prefix = displayText.substring(0, searchableStartIndex);
    const searchableContent = displayText.substring(
      searchableStartIndex,
      searchableStartIndex + searchableText.length
    );
    const suffix = displayText.substring(
      searchableStartIndex + searchableText.length
    );

    // Apply search highlighting to the searchable portion
    const highlightedContent = highlightSearchMatches(
      searchableContent,
      searchTerm,
      isSelected
    );

    // For selected items, apply green background to non-searchable parts too
    if (isSelected) {
      return (
        highlightSelected(prefix) +
        highlightedContent +
        highlightSelected(suffix)
      );
    }
    return prefix + highlightedContent + suffix;
  }

  // Fallback: apply highlighting to entire display text
  return highlightSearchMatches(displayText, searchTerm, isSelected);
}

/**
 * Highlights search term matches within text using exact or fuzzy matching
 *
 * @param text - Text to search and highlight within
 * @param searchTerm - Search query to highlight
 * @param isSelected - Whether this text belongs to a selected item
 */
function highlightSearchMatches(
  text: string,
  searchTerm: string,
  isSelected = false
): string {
  if (!searchTerm) {
    return text;
  }

  const searchQuery = searchTerm.toLowerCase();
  const textToSearch = text.toLowerCase();

  // Try exact substring match first - simpler and more performant
  const exactMatchIndex = textToSearch.indexOf(searchQuery);
  if (exactMatchIndex !== -1) {
    const beforeMatch = text.substring(0, exactMatchIndex);
    const matchedText = text.substring(
      exactMatchIndex,
      exactMatchIndex + searchTerm.length
    );
    const afterMatch = text.substring(exactMatchIndex + searchTerm.length);

    if (isSelected) {
      // Selected items: green background for all text, magenta highlight for matches
      return (
        highlightSelected(beforeMatch) +
        highlightExact(matchedText) +
        highlightSelected(afterMatch)
      );
    } else {
      // Non-selected items: cyan highlight for matches only
      return beforeMatch + highlightFuzzy(matchedText) + afterMatch;
    }
  }

  // Fallback to fuzzy character-by-character matching
  return applyFuzzyHighlighting(text, searchTerm, isSelected);
}

/**
 * Applies fuzzy highlighting by matching individual characters
 */
function applyFuzzyHighlighting(
  text: string,
  searchTerm: string,
  isSelected: boolean
): string {
  const searchChars = searchTerm
    .toLowerCase()
    .replace(/[-_\/\.\s]/g, '')
    .split('');
  const textChars = text.split('');
  const normalizedTextChars = text
    .toLowerCase()
    .replace(/[-_\/\.\s]/g, '')
    .split('');

  let searchCharIndex = 0;
  let normalizedTextIndex = 0;
  let result = '';

  for (let i = 0; i < textChars.length; i++) {
    const char = textChars[i];
    const isSeparatorChar = /[-_\/\.\s]/.test(text[i].toLowerCase());

    if (isSeparatorChar) {
      // Apply background to separators for selected items
      result += isSelected ? highlightSelected(char) : char;
      continue;
    }

    const isMatchingChar =
      searchCharIndex < searchChars.length &&
      normalizedTextChars[normalizedTextIndex] === searchChars[searchCharIndex];

    if (isMatchingChar) {
      // Highlight matching characters
      result += isSelected ? highlightExact(char) : highlightFuzzy(char);
      searchCharIndex++;
    } else {
      // Apply background to non-matching chars for selected items
      result += isSelected ? highlightSelected(char) : char;
    }

    normalizedTextIndex++;
  }

  return result;
}

/**
 * Renders a single list item with appropriate highlighting
 *
 * @param item - The item to render
 * @param isSelected - Whether this item is selected
 * @param searchTerm - Current search term
 * @param renderItem - Function to render item text
 * @param getSearchText - Function to get searchable text
 * @returns Formatted line string
 */
export function renderListItem<T>(
  item: T,
  isSelected: boolean,
  searchTerm: string,
  renderItem: (item: T) => string,
  getSearchText: (item: T) => string
): string {
  const itemText = renderItem(item);
  const searchableText = getSearchText(item);

  if (isSelected) {
    const highlightedText = applyTextHighlighting(
      itemText,
      searchableText,
      searchTerm,
      true
    );
    return highlightSelected(`> `) + highlightedText;
  } else {
    const highlightedText = applyTextHighlighting(
      itemText,
      searchableText,
      searchTerm
    );
    return `  ${highlightedText}`;
  }
}

/**
 * Calculates the visible range of items to display
 *
 * @param totalItems - Total number of items
 * @param currentIndex - Currently selected index
 * @param maxDisplayItems - Maximum items to show
 * @returns Object with startIndex and endIndex
 */
export function calculateVisibleRange(
  totalItems: number,
  currentIndex: number,
  maxDisplayItems: number
): { startIndex: number; endIndex: number } {
  const startIndex = Math.max(
    0,
    currentIndex - Math.floor(maxDisplayItems / 2)
  );
  const endIndex = Math.min(totalItems, startIndex + maxDisplayItems);

  return { startIndex, endIndex };
}

/**
 * Renders the list items as an array of formatted strings
 *
 * @param config - List render configuration
 * @returns Array of formatted line strings
 */
export function renderListItems<T>(config: ListRenderConfig<T>): string[] {
  const {
    items,
    selectedIndex,
    searchTerm,
    renderItem,
    getSearchText,
    maxDisplayItems,
  } = config;

  const lines: string[] = [];

  if (items.length === 0) {
    return lines;
  }

  const { startIndex, endIndex } = calculateVisibleRange(
    items.length,
    selectedIndex,
    maxDisplayItems
  );

  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    const isSelected = i === selectedIndex;
    const line = renderListItem(
      item,
      isSelected,
      searchTerm,
      renderItem,
      getSearchText
    );
    lines.push(line);
  }

  return lines;
}
