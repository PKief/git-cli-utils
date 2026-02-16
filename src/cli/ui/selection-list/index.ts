/**
 * SelectionList - A unified component for interactive list selection with actions
 *
 * Supports:
 * - Item selection with fuzzy search
 * - Static or dynamic actions per item
 * - Item-bound actions (require selected item) and global actions (no item required)
 * - Keyboard navigation (up/down for items, left/right for actions)
 */

import * as readline from 'readline';
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
  SelectionListConfig,
  SelectionListState,
  SelectionResult,
} from './types.js';

// Re-export types for external use
export type { Action, GlobalAction, ItemAction } from './types.js';
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
 * Main SelectionList component
 *
 * @param config - Configuration for the selection list
 * @returns Promise resolving to the selection result
 */
export function selectionList<T>(
  config: SelectionListConfig<T>
): Promise<SelectionResult<T>> {
  return new Promise((resolve, reject) => {
    const {
      items,
      renderItem,
      getSearchText = renderItem,
      header,
      actions: actionProvider,
      defaultActionKey,
      allowBack = false,
    } = config;

    // Handle empty items
    if (items.length === 0) {
      resolve({ item: null, action: null, success: false });
      return;
    }

    // Handle non-interactive mode
    if (!isInteractiveTerminal()) {
      resolve(renderNonInteractive(config));
      return;
    }

    // Initialize state
    const state: SelectionListState<T> = {
      searchTerm: '',
      currentIndex: 0,
      selectedActionIndex: 0,
      filteredItems: items,
      currentActions: [],
    };

    // Update actions based on current selection
    const updateActions = () => {
      const currentItem =
        state.filteredItems.length > 0 && state.currentIndex >= 0
          ? state.filteredItems[state.currentIndex]
          : null;

      state.currentActions = resolveActions(actionProvider, currentItem);

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
        state.filteredItems = items;
      } else {
        state.filteredItems = filterAndRankItems(
          items,
          state.searchTerm,
          getSearchText
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

    // Handle Enter - execute action and resolve
    const handleEnter = async () => {
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

      const selectedAction = state.currentActions[state.selectedActionIndex];

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
