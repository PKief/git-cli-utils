import * as readline from 'readline';
import ANSI from './ansi.js';

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
      return `${before}${ANSI.bgMagenta}${ANSI.brightWhite}${ANSI.bold}${match}${ANSI.reset}${ANSI.bgGreen}${ANSI.brightWhite}${ANSI.bold}${after}`;
    } else {
      // Use cyan background with bright white text for better visibility
      return `${before}${ANSI.bgCyan}${ANSI.brightWhite}${ANSI.bold}${match}${ANSI.reset}${after}`;
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
        result += `${ANSI.bgMagenta}${ANSI.brightWhite}${ANSI.bold}${char}${ANSI.reset}${ANSI.bgGreen}${ANSI.brightWhite}${ANSI.bold}`;
      } else {
        result += `${ANSI.bgCyan}${ANSI.brightWhite}${ANSI.bold}${char}${ANSI.reset}`;
      }
      searchIndex++;
    } else {
      result += char;
    }
    normalizedIndex++;
  }

  return result;
}

/**
 * Calculate relevance score for how well a search term matches target text
 * Higher scores indicate better matches
 */
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

    // Bonus for match at beginning
    if (normalizedText.startsWith(normalizedSearch)) {
      score += 300;
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
      // Sequential character matching
      let searchIndex = 0;
      for (
        let i = 0;
        i < textNoSeparators.length && searchIndex < searchNoSeparators.length;
        i++
      ) {
        if (textNoSeparators[i] === searchNoSeparators[searchIndex]) {
          searchIndex++;
          score += 1;
        }
      }

      // Only count if we matched all characters
      if (searchIndex < searchNoSeparators.length) {
        score = 0;
      }
    }
  }

  return score;
}

export function interactiveList<T>(
  items: T[],
  itemRenderer: (item: T) => string,
  searchFunction?: (item: T) => string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      resolve(null);
      return;
    }

    // Use searchFunction if provided, otherwise fall back to itemRenderer
    const getSearchableText = searchFunction || itemRenderer;

    // Check if we're in an interactive environment
    const isInteractive =
      process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';

    if (!isInteractive) {
      // In non-interactive mode (like tests), just return the first item
      console.log('Search: (non-interactive mode)');
      console.log(
        'Use arrow keys to navigate, Enter to select, Escape to clear search, Ctrl+C to cancel'
      );
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
    const maxDisplayItems = 10;
    let searchTerm = '';
    let filteredItems = items;

    const filterItems = () => {
      if (!searchTerm) {
        filteredItems = items;
      } else {
        const _normalizedSearchTerm = searchTerm.toLowerCase();

        // Create items with relevance scores
        const itemsWithScores = items
          .map((item) => {
            const itemText = getSearchableText(item);
            const score = calculateRelevanceScore(itemText, searchTerm);
            return { item, score };
          })
          .filter(({ score }) => score > 0) // Only include items with matches
          .sort((a, b) => b.score - a.score); // Sort by score (highest first)

        filteredItems = itemsWithScores.map(({ item }) => item);
      }
      currentIndex = 0;
    };

    const render = () => {
      console.clear();
      console.log(
        `${ANSI.green}Search:${ANSI.reset} ${searchTerm || '(type to search)'}`
      );
      console.log(
        'Use arrow keys to navigate, Enter to select, Esc to clear search, Ctrl+C to exit\n'
      );

      if (filteredItems.length === 0) {
        console.log(
          `${ANSI.yellow}No items found matching "${searchTerm}"${ANSI.reset}`
        );
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
          console.log(
            `${ANSI.bgGreen}${ANSI.brightWhite}${ANSI.bold}${paddedLine}${ANSI.reset}`
          );
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

      if (startIndex > 0) {
        console.log(`\n${ANSI.bold}↑ More items above${ANSI.reset}`);
      }
      if (endIndex < filteredItems.length) {
        console.log(`\n${ANSI.bold}↓ More items below${ANSI.reset}`);
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
          resolve(filteredItems[currentIndex] || null);
          return;
        }

        if (key.name === 'up') {
          currentIndex = Math.max(0, currentIndex - 1);
          render();
          return;
        }

        if (key.name === 'down') {
          currentIndex = Math.min(filteredItems.length - 1, currentIndex + 1);
          render();
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
          /[a-zA-Z0-9\-_\/\s]/.test(key.sequence)
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
