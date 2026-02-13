/**
 * Global action: Show commits for a specific file
 */

import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { yellow } from '../../../ui/ansi.js';
import { createGlobalAction } from '../../../utils/action-helpers.js';
import { writeLine } from '../../../utils/terminal.js';
import type { SearchCallback } from './types.js';

/**
 * Arguments for file history
 */
export interface FileHistoryArgs {
  file: string;
}

export function createFileHistoryAction(searchWithOptions: SearchCallback) {
  return createGlobalAction<FileHistoryArgs>({
    key: 'file',
    label: 'File history',
    description: 'Show commits for a specific file',
    cli: {
      option: '--file <file>',
    },
    handler: async (args) => {
      return searchWithOptions({ filePath: args.file });
    },
    promptForArgs: promptForFilePath,
  });
}

/**
 * Get list of tracked files in the repository
 */
async function getTrackedFiles(): Promise<string[]> {
  const executor = GitExecutor.getInstance();
  const result = await executor.executeCommand('git ls-files');
  return result.stdout
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .sort();
}

/**
 * Prompt user to select a file from tracked files
 * Returns null if user cancels
 */
export async function promptForFilePath(): Promise<FileHistoryArgs | null> {
  const files = await getTrackedFiles();

  if (files.length === 0) {
    writeLine(yellow('No tracked files found in repository.'));
    return null;
  }

  const selected = await p.select({
    message: 'Select a file to view history:',
    options: files.slice(0, 50).map((file) => ({
      value: file,
      label: file,
    })),
    // Note: For large repos, you might want to use autocomplete instead
  });

  if (p.isCancel(selected)) {
    writeLine(yellow('File selection cancelled.'));
    return null;
  }

  return { file: selected as string };
}
