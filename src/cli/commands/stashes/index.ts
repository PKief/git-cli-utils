import { Command } from 'commander';
import { GitStash, getGitStashes } from '../../../core/git/stashes.js';
import { yellow } from '../../ui/ansi.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { getStashGlobalActions } from './global-actions/index.js';
import { getStashItemActions } from './item-actions/index.js';

const searchStashes = async () => {
  try {
    const stashes = await getGitStashes();

    if (stashes.length === 0) {
      writeLine(yellow('No stashes found!'));
      process.exit(0);
    }

    try {
      const result = await selectionList<GitStash>({
        items: stashes,
        renderItem: (stash) =>
          `stash@{${stash.index}} on ${stash.branch}: ${stash.message}`,
        getSearchText: (stash) => stash.message,
        actions: getStashItemActions(),
      });

      if (result.success && result.item) {
        writeLine();
        writeLine(`Selected stash: stash@{${result.item.index}}`);
        // Action has already been executed by the selection list
        process.exit(0);
      } else {
        writeLine(yellow('No stash selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        process.exit(0);
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeErrorLine(
      `Error fetching stashes: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

/**
 * Register stashes command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'stashes',
    description: 'Interactive stash selection with fuzzy search',
    action: searchStashes,
    commandActions: getStashGlobalActions(),
  });
}
