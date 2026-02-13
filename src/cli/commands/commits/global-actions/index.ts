/**
 * Global actions for commits command
 * These actions modify how commits are searched/displayed
 */

import { createGlobalActions } from '../../../utils/action-helpers.js';
import { createCrossBranchAction } from './cross-branch.js';
import {
  createFileHistoryAction,
  type FileHistoryArgs,
} from './file-history.js';
import { createReflogAction } from './reflog.js';
import type { CommitSearchOptions, SearchCallback } from './types.js';

/** Callback to perform search with options - set by commits/index.ts */
let searchWithOptions: SearchCallback | null = null;

/**
 * Register the search callback (called by commits/index.ts)
 */
export function setSearchCallback(callback: SearchCallback): void {
  searchWithOptions = callback;
}

function getSearchCallback(): SearchCallback {
  if (!searchWithOptions) {
    throw new Error('Search callback not registered');
  }
  return searchWithOptions;
}

/**
 * Get all global actions for the commits command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getCommitGlobalActions() {
  const callback: SearchCallback = (options) => getSearchCallback()(options);
  return createGlobalActions([
    createCrossBranchAction(callback),
    createFileHistoryAction(callback),
    createReflogAction(callback),
  ]);
}

// Re-export types for direct use
export type { CommitSearchOptions, FileHistoryArgs };
