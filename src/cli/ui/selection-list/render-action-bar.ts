/**
 * Action bar rendering for SelectionList
 */

import { blue, gray } from '../ansi.js';
import type { Action, ActionBarRenderConfig } from './types.js';

/**
 * Renders the action bar as a formatted string
 *
 * @param config - Action bar configuration
 * @returns Array of lines to display (action bar + optional description)
 */
export function renderActionBar<T>(config: ActionBarRenderConfig<T>): string[] {
  const { actions, selectedIndex } = config;

  if (actions.length === 0) {
    return [];
  }

  const lines: string[] = [];

  // Build action bar string
  const actionStrings = actions.map((action, index) => {
    const isSelected = index === selectedIndex;
    const label = action.label.toLowerCase();

    // Selected action: blue bullet and text
    // Non-selected: gray space (same width as bullet) and gray text
    return isSelected ? blue(`• ${label}`) : gray(`  ${label}`);
  });

  const actionBar = actionStrings.join('  ');
  lines.push(actionBar);

  // Show description of selected action
  const selectedAction = actions[selectedIndex];
  if (selectedAction?.description) {
    lines.push(gray(`  ${selectedAction.description}`));
  }

  return lines;
}

/**
 * Get the index of an action by its key
 *
 * @param actions - Array of actions
 * @param key - Action key to find
 * @returns Index of the action, or 0 if not found
 */
export function getActionIndexByKey<T>(
  actions: Action<T>[],
  key: string
): number {
  const index = actions.findIndex((a) => a.key === key);
  return index >= 0 ? index : 0;
}
