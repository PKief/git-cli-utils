import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { gitExecutor } from './git/executor.js';

/**
 * Supported bookmark types - one per command/entity type
 */
export type BookmarkType =
  | 'branches'
  | 'commits'
  | 'stashes'
  | 'tags'
  | 'remotes'
  | 'worktrees'
  | 'aliases';

/**
 * Storage format for bookmarks per repository
 */
export interface BookmarkStore {
  branches: string[];
  commits: string[];
  stashes: string[];
  tags: string[];
  remotes: string[];
  worktrees: string[];
  aliases: string[];
}

const CONFIG_DIR = join(homedir(), '.git-cli-utils');
const REPOS_DIR = join(CONFIG_DIR, 'repos');

/**
 * Creates an empty bookmark store with all types initialized
 */
function createEmptyStore(): BookmarkStore {
  return {
    branches: [],
    commits: [],
    stashes: [],
    tags: [],
    remotes: [],
    worktrees: [],
    aliases: [],
  };
}

/**
 * Derives a stable, filesystem-safe identifier from the repository root path
 */
function hashRepoPath(repoPath: string): string {
  return createHash('sha256').update(repoPath).digest('hex').substring(0, 16);
}

/**
 * Gets the absolute root path of the current git repository
 */
export async function getRepoRoot(): Promise<string> {
  const result = await gitExecutor.executeCommand(
    'git rev-parse --show-toplevel'
  );
  return result.stdout.trim();
}

/**
 * Returns the bookmarks file path for a given repository root
 */
function getBookmarksPath(repoPath: string): string {
  const repoId = hashRepoPath(repoPath);
  return join(REPOS_DIR, repoId, 'bookmarks.json');
}

/**
 * Returns the bookmarks directory for a given repository root
 */
function getBookmarksDir(repoPath: string): string {
  const repoId = hashRepoPath(repoPath);
  return join(REPOS_DIR, repoId);
}

/**
 * Ensures the bookmarks directory exists for a given repository
 */
function ensureBookmarksDir(repoPath: string): void {
  const dir = getBookmarksDir(repoPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads the bookmark store for a given repository path.
 * Returns an empty store if the file doesn't exist or is corrupt.
 */
export function loadBookmarks(repoPath: string): BookmarkStore {
  try {
    const filePath = getBookmarksPath(repoPath);
    if (!existsSync(filePath)) return createEmptyStore();
    const raw = readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return createEmptyStore();
    const parsed = JSON.parse(raw) as Partial<BookmarkStore>;
    // Merge with empty store to ensure all keys exist
    return { ...createEmptyStore(), ...parsed };
  } catch {
    return createEmptyStore();
  }
}

/**
 * Saves the bookmark store to disk for a given repository
 */
export function saveBookmarks(repoPath: string, store: BookmarkStore): void {
  ensureBookmarksDir(repoPath);
  const filePath = getBookmarksPath(repoPath);
  writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Checks if a specific item is bookmarked
 */
export function isBookmarked(
  store: BookmarkStore,
  type: BookmarkType,
  id: string
): boolean {
  return store[type].includes(id);
}

/**
 * Adds a bookmark for an item. No-op if already bookmarked.
 */
export function addBookmark(
  repoPath: string,
  store: BookmarkStore,
  type: BookmarkType,
  id: string
): BookmarkStore {
  if (store[type].includes(id)) return store;
  const updated = {
    ...store,
    [type]: [...store[type], id],
  };
  saveBookmarks(repoPath, updated);
  return updated;
}

/**
 * Removes a bookmark for an item. No-op if not bookmarked.
 */
export function removeBookmark(
  repoPath: string,
  store: BookmarkStore,
  type: BookmarkType,
  id: string
): BookmarkStore {
  if (!store[type].includes(id)) return store;
  const updated = {
    ...store,
    [type]: store[type].filter((entry) => entry !== id),
  };
  saveBookmarks(repoPath, updated);
  return updated;
}

/**
 * Toggles a bookmark for an item. Returns the updated store and whether the item is now bookmarked.
 */
export function toggleBookmark(
  repoPath: string,
  store: BookmarkStore,
  type: BookmarkType,
  id: string
): { store: BookmarkStore; bookmarked: boolean } {
  if (isBookmarked(store, type, id)) {
    return {
      store: removeBookmark(repoPath, store, type, id),
      bookmarked: false,
    };
  }
  return { store: addBookmark(repoPath, store, type, id), bookmarked: true };
}

/**
 * Gets the set of bookmarked IDs for a given type.
 * Useful for passing to the selection list as pinnedIds.
 */
export function getBookmarkIds(
  store: BookmarkStore,
  type: BookmarkType
): Set<string> {
  return new Set(store[type]);
}
