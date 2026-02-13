/**
 * Global actions for commits command
 * These actions modify how commits are searched/displayed
 */

import {
  createGlobalAction,
  createGlobalActions,
} from '../../../utils/action-helpers.js';
import { type FileHistoryArgs, promptForFilePath } from './file-history.js';

/**
 * Search options for commits
 */
export interface CommitSearchOptions {
  showAll?: boolean;
  filePath?: string;
}

/** Callback to perform search with options - set by commits/index.ts */
let searchWithOptions:
  | ((options: CommitSearchOptions) => Promise<boolean>)
  | null = null;

/**
 * Register the search callback (called by commits/index.ts)
 */
export function setSearchCallback(
  callback: (options: CommitSearchOptions) => Promise<boolean>
): void {
  searchWithOptions = callback;
}

/**
 * Get all global actions for the commits command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getCommitGlobalActions() {
  return createGlobalActions([
    createGlobalAction<void>({
      key: 'all',
      label: 'Cross-branch search',
      description: 'Search commits across all branches',
      cli: {
        option: '-a, --all',
      },
      handler: async () => {
        if (!searchWithOptions) {
          throw new Error('Search callback not registered');
        }
        return searchWithOptions({ showAll: true });
      },
    }),
    createGlobalAction<FileHistoryArgs>({
      key: 'file',
      label: 'File history',
      description: 'Show commits for a specific file',
      cli: {
        option: '--file <file>',
      },
      handler: async (args) => {
        if (!searchWithOptions) {
          throw new Error('Search callback not registered');
        }
        return searchWithOptions({ filePath: args.file });
      },
      promptForArgs: promptForFilePath,
    }),
  ]);
}

// Re-export types for direct use
export { type FileHistoryArgs, promptForFilePath };
