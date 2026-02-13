/**
 * Shared types for commits global actions
 */

/**
 * Search options for commits
 */
export interface CommitSearchOptions {
  showAll?: boolean;
  filePath?: string;
  reflog?: boolean;
}

/**
 * Callback to perform search with given options
 */
export type SearchCallback = (options: CommitSearchOptions) => Promise<boolean>;
