import * as readline from 'readline';
import { clearScreen, write, writeLine } from '../utils/terminal.js';
import {
  green,
  highlightExact,
  highlightFuzzy,
  highlightSelected,
  yellow,
} from './ansi.js';
import { rankSearchResults } from './search-scoring.js';

/**
 * Removes ANSI escape codes from text to calculate actual display length
 */
function getTextLengthWithoutColors(text: string): number {
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}

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
    const isSeperatorChar = /[-_\/\.\s]/.test(text[i].toLowerCase());

    if (isSeperatorChar) {
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

export function interactiveList<T>(
  items: T[],
  itemRenderer: (item: T) => string,
  searchFunction?: (item: T) => string,
  header?: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      resolve(null);
      return;
    }

    // Use searchFunction if provided, otherwise fall back to itemRenderer
    const getSearchableText = searchFunction || itemRenderer;

    // Check if we're in an interactive environment
    // More robust detection for CI environments
    const isInteractive =
      process.stdin.isTTY &&
      typeof process.stdin.setRawMode === 'function' &&
      !process.env.CI && // Not in CI environment
      !process.env.GITHUB_ACTIONS && // Not in GitHub Actions
      process.env.TERM !== 'dumb'; // Not a dumb terminal

    if (!isInteractive) {
      // In non-interactive mode (like tests), just return the first item
      console.log('Search: (non-interactive mode)');
      console.log(
        'Use arrow keys to navigate, Enter to select, Escape to clear search, Ctrl+C to cancel'
      );

      // Show optional header/description if provided
      if (header) {
        console.log('');
        console.log(header);
        console.log('');
      }

      items.slice(0, 5).forEach((item, index) => {
        console.log(`${index === 0 ? '→' : ' '} ${itemRenderer(item)}`);
      });
      if (items.length > 5) {
        console.log('  ... and more');
      }
      resolve(items[0] || null);
      return;
    }

    let currentIndex = 0;
    const maxDisplayItems = 7;
    let searchTerm = '';
    let filteredItems = items;

    const filterItems = () => {
      if (!searchTerm) {
        filteredItems = items;
      } else {
        // Use the extracted search scoring logic
        const rankedResults = rankSearchResults(
          items,
          searchTerm,
          getSearchableText
        );
        filteredItems = rankedResults.map(({ item }) => item);
      }
      // Reset current index to 0, but ensure it's within bounds
      currentIndex = filteredItems.length > 0 ? 0 : -1;
    };

    const render = () => {
      // Clear screen and move cursor to top-left
      clearScreen();

      // Always show search line first - this should never scroll away
      writeLine(`${green('Search:')} ${searchTerm || '(type to search)'}`);
      writeLine(
        'Use arrow keys to navigate, Enter to select, Esc to clear search, Ctrl+C to exit'
      );
      writeLine();

      // Show optional header/description if provided
      if (header) {
        writeLine(header);
        writeLine();
      }

      if (filteredItems.length === 0) {
        write(yellow(`No items found matching "${searchTerm}"`));
        return;
      }

      const startIndex = Math.max(
        0,
        currentIndex - Math.floor(maxDisplayItems / 2)
      );
      const endIndex = Math.min(
        filteredItems.length,
        startIndex + maxDisplayItems
      );

      // Render each visible item with appropriate highlighting
      for (let i = startIndex; i < endIndex; i++) {
        const item = filteredItems[i];
        const itemText = itemRenderer(item);
        const searchableText = getSearchableText(item);

        if (i === currentIndex) {
          // Selected item: highlight text + extend green background to full terminal width
          const terminalWidth = process.stdout.columns || 80;
          const highlightedText = applyTextHighlighting(
            itemText,
            searchableText,
            searchTerm,
            true // isSelected = true
          );
          const selectedLine = `=> ${highlightedText}`;

          // Calculate padding needed to fill remaining terminal width
          const textLength = getTextLengthWithoutColors(selectedLine);
          const paddingNeeded = Math.max(0, terminalWidth - 1 - textLength);
          const fullWidthLine =
            selectedLine + highlightSelected(' '.repeat(paddingNeeded));

          writeLine(fullWidthLine);
        } else {
          // Non-selected items: apply search highlighting only
          const highlightedText = applyTextHighlighting(
            itemText,
            searchableText,
            searchTerm
          );
          writeLine(`   ${highlightedText}`);
        }
      }
    };

    const handleKeypress = (_chunk: Buffer, key: readline.Key) => {
      if (key) {
        if (key.ctrl && key.name === 'c') {
          if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
          }
          process.stdin.removeAllListeners('keypress');
          reject(new Error('Selection cancelled'));
          return;
        }

        if (key.name === 'escape') {
          searchTerm = '';
          filterItems();
          render();
          return;
        }

        if (key.name === 'return') {
          if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
          }
          process.stdin.removeAllListeners('keypress');
          // Only resolve with an item if there are filtered items available
          resolve(
            filteredItems.length > 0
              ? filteredItems[currentIndex] || null
              : null
          );
          return;
        }

        if (key.name === 'up') {
          // Only navigate if there are items to navigate
          if (filteredItems.length > 0) {
            currentIndex = Math.max(0, currentIndex - 1);
            render();
          }
          return;
        }

        if (key.name === 'down') {
          // Only navigate if there are items to navigate
          if (filteredItems.length > 0) {
            currentIndex = Math.min(filteredItems.length - 1, currentIndex + 1);
            render();
          }
          return;
        }

        if (key.name === 'backspace') {
          if (searchTerm.length > 0) {
            searchTerm = searchTerm.slice(0, -1);
            filterItems();
            render();
          }
          return;
        }

        // Add character to search
        if (
          key.sequence &&
          key.sequence.length === 1 &&
          key.sequence >= ' ' &&
          key.sequence <= '~' // Allow all printable ASCII characters
        ) {
          searchTerm += key.sequence;
          filterItems();
          render();
        }
      }
    };

    // Setup raw mode for keypress detection (only in interactive mode)
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', handleKeypress);

    // Initial render
    render();
  });
}
