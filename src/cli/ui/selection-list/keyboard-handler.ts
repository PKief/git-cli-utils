/**
 * Keyboard handling for SelectionList
 */

import type * as readline from 'readline';

/**
 * Key event types that the SelectionList handles
 */
export type KeyEventType =
  | 'cancel'
  | 'escape'
  | 'enter'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'backspace'
  | 'character';

/**
 * Processed key event with relevant data
 */
export interface KeyEvent {
  type: KeyEventType;
  /** Character for 'character' type events */
  character?: string;
}

/**
 * Processes a readline key press into a KeyEvent
 *
 * @param key - The readline Key object
 * @returns Processed KeyEvent or null if not handled
 */
export function processKeyPress(key: readline.Key): KeyEvent | null {
  if (!key) {
    return null;
  }

  // Ctrl+C - cancel
  if (key.ctrl && key.name === 'c') {
    return { type: 'cancel' };
  }

  // Escape - clear search
  if (key.name === 'escape') {
    return { type: 'escape' };
  }

  // Enter - select/execute
  if (key.name === 'return') {
    return { type: 'enter' };
  }

  // Navigation keys
  if (key.name === 'up') {
    return { type: 'up' };
  }
  if (key.name === 'down') {
    return { type: 'down' };
  }
  if (key.name === 'left') {
    return { type: 'left' };
  }
  if (key.name === 'right') {
    return { type: 'right' };
  }

  // Backspace
  if (key.name === 'backspace') {
    return { type: 'backspace' };
  }

  // Character input
  if (
    key.sequence &&
    key.sequence.length === 1 &&
    key.sequence >= ' ' &&
    key.sequence <= '~'
  ) {
    return { type: 'character', character: key.sequence };
  }

  return null;
}

/**
 * Navigation helpers for list index
 */
export function navigateUp(currentIndex: number, totalItems: number): number {
  if (totalItems === 0) return -1;
  return currentIndex <= 0 ? totalItems - 1 : currentIndex - 1;
}

export function navigateDown(currentIndex: number, totalItems: number): number {
  if (totalItems === 0) return -1;
  return currentIndex >= totalItems - 1 ? 0 : currentIndex + 1;
}

/**
 * Navigation helpers for action index
 */
export function navigateActionLeft(
  currentIndex: number,
  totalActions: number
): number {
  if (totalActions === 0) return 0;
  return Math.max(0, currentIndex - 1);
}

export function navigateActionRight(
  currentIndex: number,
  totalActions: number
): number {
  if (totalActions === 0) return 0;
  return Math.min(totalActions - 1, currentIndex + 1);
}

/**
 * Checks if the terminal is interactive (supports raw mode)
 */
export function isInteractiveTerminal(): boolean {
  return (
    process.stdin.isTTY &&
    typeof process.stdin.setRawMode === 'function' &&
    !process.env.CI &&
    !process.env.GITHUB_ACTIONS &&
    process.env.TERM !== 'dumb'
  );
}
