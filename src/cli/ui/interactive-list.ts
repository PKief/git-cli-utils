import * as readline from 'readline';
import {
  green,
  highlightExact,
  highlightFuzzy,
  highlightSelected,
  yellow,
} from './ansi.js';
import { rankSearchResults } from './search-scoring.js';

/**
 * Highlights matching characters in display text based on search term matching against searchable text
 */
function highlightMatchesInDisplay(
  displayText: string,
  searchableText: string,
  searchTerm: string,
  isSelected = false
): string {
  if (!searchTerm) {
    return displayText;
  }

  // Find where the searchable text appears in the display text
  const searchableInDisplay = displayText.indexOf(searchableText);
  if (searchableInDisplay === -1) {
    // If searchable text is not found in display, fall back to no highlighting
    return displayText;
  }

  const beforeSearchable = displayText.substring(0, searchableInDisplay);
  const searchablePart = displayText.substring(
    searchableInDisplay,
    searchableInDisplay + searchableText.length
  );
  const afterSearchable = displayText.substring(
    searchableInDisplay + searchableText.length
  );

  // Apply highlighting only to the searchable portion
  const highlightedSearchable = highlightText(
    searchablePart,
    searchTerm,
    isSelected
  );

  return beforeSearchable + highlightedSearchable + afterSearchable;
}

/**
 * Highlights matching characters in text based on search term
 */
function highlightText(
  text: string,
  searchTerm: string,
  isSelected = false
): string {
  if (!searchTerm) {
    return text;
  }

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const normalizedText = text.toLowerCase();

  // Try exact substring match first with different colors for selected items
  const exactIndex = normalizedText.indexOf(normalizedSearchTerm);
  if (exactIndex !== -1) {
    const before = text.substring(0, exactIndex);
    const match = text.substring(exactIndex, exactIndex + searchTerm.length);
    const after = text.substring(exactIndex + searchTerm.length);

    if (isSelected) {
      // For selected items, use magenta background for search matches to contrast with green selection background
      return `${before}${highlightExact(match)}${highlightSelected(after)}`;
    } else {
      // Use cyan background with bright white text for better visibility
      return `${before}${highlightFuzzy(match)}${after}`;
    }
  }

  // Fuzzy highlighting: highlight individual matching characters
  const searchChars = normalizedSearchTerm.replace(/[-_\/\.\s]/g, '').split('');
  const textChars = text.split('');
  const normalizedTextChars = normalizedText
    .replace(/[-_\/\.\s]/g, '')
    .split('');

  let searchIndex = 0;
  let result = '';
  let normalizedIndex = 0;

  for (let i = 0; i < textChars.length; i++) {
    const char = textChars[i];
    const normalizedChar = normalizedText[i];

    // Skip separators in the normalized comparison
    if (/[-_\/\.\s]/.test(normalizedChar)) {
      result += char;
      continue;
    }

    if (
      searchIndex < searchChars.length &&
      normalizedTextChars[normalizedIndex] === searchChars[searchIndex]
    ) {
      // Highlight matching character with different colors for selected vs unselected items
      if (isSelected) {
        result += `${highlightExact(char)}${highlightSelected('')}`;
      } else {
        result += highlightFuzzy(char);
      }
      searchIndex++;
    } else {
      result += char;
    }
    normalizedIndex++;
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
      console.clear();
      console.log(`${green('Search:')} ${searchTerm || '(type to search)'}`);
      console.log(
        'Use arrow keys to navigate, Enter to select, Esc to clear search, Ctrl+C to exit\n'
      );

      // Show optional header/description if provided
      if (header) {
        console.log(header);
        console.log(''); // Add blank line after header
      }

      if (filteredItems.length === 0) {
        console.log(yellow(`No items found matching "${searchTerm}"`));
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

      for (let i = startIndex; i < endIndex; i++) {
        const item = filteredItems[i];
        const itemText = itemRenderer(item);
        const searchableText = getSearchableText(item);

        if (i === currentIndex) {
          // Selected item with green background and search highlighting
          const highlightedText = highlightMatchesInDisplay(
            itemText,
            searchableText,
            searchTerm,
            true
          );
          const terminalWidth = process.stdout.columns || 80;
          const selectedLine = `=> ${highlightedText}`;
          const paddedLine = selectedLine.padEnd(terminalWidth - 1);
          console.log(highlightSelected(paddedLine));
        } else {
          // Non-selected items get search highlighting
          const highlightedText = highlightMatchesInDisplay(
            itemText,
            searchableText,
            searchTerm
          );
          console.log(`   ${highlightedText}`);
        }
      }
    };

    const handleKeypress = (chunk: Buffer, key: readline.Key) => {
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
