import { Command } from 'commander';
import { GitStash, getGitStashes } from '../../../core/git/stashes.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { getStashGlobalActions } from './global-actions/index.js';
import { getStashItemActions } from './item-actions/index.js';

const searchStashes = async (): Promise<void | CommandResult> => {
  try {
    const stashes = await getGitStashes();

    if (stashes.length === 0) {
      writeLine(yellow('No stashes found!'));
      return;
    }

    try {
      const result = await selectionList<GitStash>({
        items: stashes,
        renderItem: (stash) =>
          `stash@{${stash.index}} on ${stash.branch}: ${stash.message}`,
        getSearchText: (stash) => stash.message,
        actions: getStashItemActions(),
        allowBack: true,
      });

      if (result.back) {
        return { back: true };
      }

      if (result.success && result.item) {
        writeLine();
        writeLine(`Selected stash: stash@{${result.item.index}}`);
      } else {
        writeLine(yellow('No stash selected.'));
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        return;
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
