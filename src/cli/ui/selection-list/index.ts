/**
 * SelectionList - A unified component for interactive list selection with actions
 *
 * Supports:
 * - Item selection with fuzzy search
 * - Static or dynamic actions per item
 * - Item-bound actions (require selected item) and global actions (no item required)
 * - Keyboard navigation (up/down for items, left/right for actions)
 * - Built-in bookmarking: pinned items at top + Bookmark/Unbookmark toggle action
 */

import * as readline from 'readline';
import {
  type BookmarkStore,
  getBookmarkIds,
  getRepoRoot,
  isBookmarked,
  loadBookmarks,
  toggleBookmark,
} from '../../../core/bookmarks.js';
import { AppError } from '../../utils/exit.js';
import { clearScreen, write, writeLine } from '../../utils/terminal.js';
import { blue, yellow } from '../ansi.js';
import {
  isInteractiveTerminal,
  navigateActionLeft,
  navigateActionRight,
  navigateDown,
  navigateUp,
  processKeyPress,
} from './keyboard-handler.js';
import { getActionIndexByKey, renderActionBar } from './render-action-bar.js';
import { renderListItems } from './render-list.js';
import { filterAndRankItems } from './search.js';
import type {
  Action,
  ActionProvider,
  BookmarkConfig,
  ItemAction,
  SelectionListConfig,
  SelectionListState,
  SelectionResult,
} from './types.js';

// Re-export types for external use
export type {
  Action,
  BookmarkConfig,
  GlobalAction,
  ItemAction,
} from './types.js';
export type { ActionProvider, SelectionListConfig, SelectionResult };

/**
 * Maximum number of items to display at once
 */
const MAX_DISPLAY_ITEMS = 7;

/**
 * Resolves actions from an ActionProvider based on the current item
 */
function resolveActions<T>(
  actionProvider: ActionProvider<T> | undefined,
  currentItem: T | null
): Action<T>[] {
  if (!actionProvider) {
    return [];
  }

  if (typeof actionProvider === 'function') {
    return actionProvider(currentItem);
  }

  return actionProvider;
}

/**
 * Executes an action and returns the result
 */
async function executeAction<T>(
  action: Action<T>,
  item: T | null
): Promise<boolean> {
  let result: boolean | void;

  if (action.type === 'global') {
    result = await action.handler();
  } else {
    // Item action - requires an item
    if (item === null) {
      return false;
    }
    result = await action.handler(item);
  }

  // If handler returned void/undefined, treat as success
  return result !== false;
}

/**
 * Renders the non-interactive fallback for CI environments
 */
function renderNonInteractive<T>(
  config: SelectionListConfig<T>
): SelectionResult<T> {
  const { items, renderItem, header } = config;

  console.log('Search: (non-interactive mode)');
  console.log(
    'Use arrow keys to navigate, Enter to select, Escape to clear search, Ctrl+C to cancel'
  );

  if (header) {
    console.log('');
    console.log(header);
    console.log('');
  }

  items.slice(0, 5).forEach((item, index) => {
    console.log(`${index === 0 ? '>' : ' '} ${renderItem(item)}`);
  });

  if (items.length > 5) {
    console.log('  ... and more');
  }

  return {
    item: items[0] || null,
    action: null,
    success: true,
  };
}

/**
 * Initializes bookmark state for the selection list.
 * Returns null if bookmarking is not configured.
 */
async function initBookmarkState<T>(
  bookmarkConfig: BookmarkConfig<T> | undefined
): Promise<{
  repoPath: string;
  store: BookmarkStore;
  pinnedIds: Set<string>;
} | null> {
  if (!bookmarkConfig) return null;

  try {
    const repoPath = await getRepoRoot();
    const store = loadBookmarks(repoPath);
    const pinnedIds = getBookmarkIds(store, bookmarkConfig.type);
    return { repoPath, store, pinnedIds };
  } catch {
    // If we can't resolve repo root (e.g., not in a git repo), skip bookmarks
    return null;
  }
}

/**
 * Main SelectionList component
 *
 * @param config - Configuration for the selection list
 * @returns Promise resolving to the selection result
 */
export async function selectionList<T>(
  config: SelectionListConfig<T>
): Promise<SelectionResult<T>> {
  const {
    items,
    renderItem,
    getSearchText = renderItem,
    header,
    actions: actionProvider,
    defaultActionKey,
    allowBack = false,
    bookmark: bookmarkConfig,
  } = config;

  // Handle empty items
  if (items.length === 0) {
    return { item: null, action: null, success: false };
  }

  // Handle non-interactive mode
  if (!isInteractiveTerminal()) {
    return renderNonInteractive(config);
  }

  // Initialize bookmark state (async, done once before entering interactive mode)
  const bookmarkState = await initBookmarkState(bookmarkConfig);

  // Mutable bookmark store reference (updated on toggle)
  let currentBookmarkStore = bookmarkState?.store ?? null;
  let currentPinnedIds = bookmarkState?.pinnedIds ?? new Set<string>();
  const repoPath = bookmarkState?.repoPath ?? '';
  const getId = bookmarkConfig?.getId;

  return new Promise((resolve, reject) => {
    /**
     * Reorders items so that pinned items appear first, preserving
     * relative order within pinned and non-pinned groups.
     */
    const reorderWithPins = (itemList: T[]): T[] => {
      if (!getId || currentPinnedIds.size === 0) return itemList;
      const pinned: T[] = [];
      const rest: T[] = [];
      for (const item of itemList) {
        if (currentPinnedIds.has(getId(item))) {
          pinned.push(item);
        } else {
          rest.push(item);
        }
      }
      return [...pinned, ...rest];
    };

    /**
     * Creates the bookmark toggle action for a given item.
     */
    const createBookmarkAction = (item: T): ItemAction<T> | null => {
      if (!bookmarkConfig || !currentBookmarkStore || !getId) return null;

      const id = getId(item);
      const bookmarked = isBookmarked(
        currentBookmarkStore,
        bookmarkConfig.type,
        id
      );

      return {
        type: 'item',
        key: 'bookmark',
        label: bookmarked ? 'Unbookmark' : 'Bookmark',
        description: bookmarked
          ? 'Remove from bookmarks'
          : 'Pin to top of list',
        handler: (selectedItem: T) => {
          if (!currentBookmarkStore) return true;
          const result = toggleBookmark(
            repoPath,
            currentBookmarkStore,
            bookmarkConfig.type,
            getId(selectedItem)
          );
          currentBookmarkStore = result.store;
          currentPinnedIds = getBookmarkIds(result.store, bookmarkConfig.type);
          return true;
        },
      };
    };

    // Initialize state
    const state: SelectionListState<T> = {
      searchTerm: '',
      currentIndex: 0,
      selectedActionIndex: 0,
      filteredItems: reorderWithPins(items),
      currentActions: [],
    };

    // Update actions based on current selection
    const updateActions = () => {
      const currentItem =
        state.filteredItems.length > 0 && state.currentIndex >= 0
          ? state.filteredItems[state.currentIndex]
          : null;

      const baseActions = resolveActions(actionProvider, currentItem);

      // Append bookmark action if configured and an item is selected
      if (currentItem) {
        const bookmarkAction = createBookmarkAction(currentItem);
        if (bookmarkAction) {
          state.currentActions = [...baseActions, bookmarkAction];
        } else {
          state.currentActions = baseActions;
        }
      } else {
        state.currentActions = baseActions;
      }

      // Set default action index
      if (defaultActionKey && state.currentActions.length > 0) {
        state.selectedActionIndex = getActionIndexByKey(
          state.currentActions,
          defaultActionKey
        );
      } else if (state.selectedActionIndex >= state.currentActions.length) {
        state.selectedActionIndex = 0;
      }
    };

    // Filter items based on search
    const filterItems = () => {
      if (!state.searchTerm) {
        state.filteredItems = reorderWithPins(items);
      } else {
        state.filteredItems = reorderWithPins(
          filterAndRankItems(items, state.searchTerm, getSearchText)
        );
      }
      state.currentIndex = state.filteredItems.length > 0 ? 0 : -1;
      updateActions();
    };

    // Render the UI
    const render = () => {
      clearScreen();

      // Search line
      writeLine(`${blue('Search:')} ${state.searchTerm || '(type to search)'}`);
      const escHint = allowBack ? 'Esc to go back' : 'Esc to clear search';
      writeLine(
        `Use arrow keys to navigate, Enter to select, ${escHint}, Ctrl+C to exit`
      );
      writeLine();

      // Optional header
      if (header) {
        writeLine(header);
        writeLine();
      }

      // Empty state
      if (state.filteredItems.length === 0) {
        write(yellow(`No items found matching "${state.searchTerm}"`));
        return;
      }

      // Render list items
      const listLines = renderListItems({
        items: state.filteredItems,
        selectedIndex: state.currentIndex,
        searchTerm: state.searchTerm,
        renderItem,
        getSearchText,
        maxDisplayItems: MAX_DISPLAY_ITEMS,
        header,
        pinnedIds: currentPinnedIds.size > 0 ? currentPinnedIds : undefined,
        getId,
      });

      listLines.forEach((line) => writeLine(line));

      // Render action bar
      if (state.currentActions.length > 0) {
        writeLine(); // Empty line before action bar
        const actionLines = renderActionBar({
          actions: state.currentActions,
          selectedIndex: state.selectedActionIndex,
        });
        actionLines.forEach((line) => writeLine(line));
      }
    };

    // Cleanup function
    const cleanup = () => {
      process.stdin.removeListener('keypress', handleKeypress);
      if (typeof process.stdin.setRawMode === 'function') {
        process.stdin.setRawMode(false);
      }
      // Pause stdin to allow the process to exit
      process.stdin.pause();
    };

    /**
     * Handles the internally managed bookmark toggle action.
     * Executes the toggle, refreshes pinned state, and re-renders
     * without leaving the interactive list.
     */
    const handleBookmarkToggle = () => {
      const selectedItem =
        state.filteredItems.length > 0 && state.currentIndex >= 0
          ? state.filteredItems[state.currentIndex]
          : null;

      if (!selectedItem) return;

      const bookmarkAction = state.currentActions.find(
        (a) => a.key === 'bookmark'
      );
      if (!bookmarkAction || bookmarkAction.type !== 'item') return;

      bookmarkAction.handler(selectedItem);

      // Re-filter and re-render to reflect new pin state
      filterItems();
      render();
    };

    // Handle Enter - execute action and resolve
    const handleEnter = async () => {
      const selectedAction = state.currentActions[state.selectedActionIndex];

      // If the bookmark action is selected, handle it inline (stay in list)
      if (selectedAction?.key === 'bookmark') {
        handleBookmarkToggle();
        return;
      }

      cleanup();

      const selectedItem =
        state.filteredItems.length > 0 && state.currentIndex >= 0
          ? state.filteredItems[state.currentIndex]
          : null;

      // If no actions, just return the selected item
      if (state.currentActions.length === 0) {
        resolve({
          item: selectedItem,
          action: null,
          success: selectedItem !== null,
        });
        return;
      }

      // For item actions, we need a selected item
      if (selectedAction.type === 'item' && selectedItem === null) {
        resolve({
          item: null,
          action: selectedAction,
          success: false,
        });
        return;
      }

      // Execute the action - propagate errors (like AppError.cancelled)
      try {
        const success = await executeAction(selectedAction, selectedItem);
        resolve({
          item: selectedItem,
          action: selectedAction,
          success,
        });
      } catch (error) {
        reject(error);
      }
    };

    // Handle keypress events
    const handleKeypress = (_chunk: Buffer, key: readline.Key) => {
      const keyEvent = processKeyPress(key);
      if (!keyEvent) return;

      switch (keyEvent.type) {
        case 'cancel':
          cleanup();
          reject(AppError.cancelled('Selection cancelled.'));
          return;

        case 'escape':
          // If back is allowed, go back
          if (allowBack) {
            cleanup();
            resolve({
              item: null,
              action: null,
              success: false,
              back: true,
            });
            return;
          }
          // Otherwise, clear search
          state.searchTerm = '';
          filterItems();
          render();
          break;

        case 'enter':
          handleEnter();
          break;

        case 'up':
          if (state.filteredItems.length > 0) {
            state.currentIndex = navigateUp(
              state.currentIndex,
              state.filteredItems.length
            );
            updateActions();
            render();
          }
          break;

        case 'down':
          if (state.filteredItems.length > 0) {
            state.currentIndex = navigateDown(
              state.currentIndex,
              state.filteredItems.length
            );
            updateActions();
            render();
          }
          break;

        case 'left':
          if (state.currentActions.length > 0) {
            state.selectedActionIndex = navigateActionLeft(
              state.selectedActionIndex,
              state.currentActions.length
            );
            render();
          }
          break;

        case 'right':
          if (state.currentActions.length > 0) {
            state.selectedActionIndex = navigateActionRight(
              state.selectedActionIndex,
              state.currentActions.length
            );
            render();
          }
          break;

        case 'backspace':
          if (state.searchTerm.length > 0) {
            state.searchTerm = state.searchTerm.slice(0, -1);
            filterItems();
            render();
          }
          break;

        case 'character':
          if (keyEvent.character) {
            state.searchTerm += keyEvent.character;
            filterItems();
            render();
          }
          break;
      }
    };

    // Initialize
    updateActions();

    // Setup raw mode for keypress detection
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
