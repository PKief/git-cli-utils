import { Command } from 'commander';
import { GitBranch, getGitBranches } from '../../../core/git/branches.js';
import { yellow } from '../../ui/ansi.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { getBranchGlobalActions } from './global-actions/index.js';
import { getBranchItemActions } from './item-actions/index.js';

export const searchBranches = async () => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      writeLine(yellow('No branches found!'));
      process.exit(0);
    }

    try {
      const result = await selectionList<GitBranch>({
        items: branches,
        renderItem: (branch) =>
          `${branch.date} - ${branch.name}${branch.current ? ' (current)' : ''}`,
        getSearchText: (branch) => branch.name,
        actions: getBranchItemActions(),
      });

      if (result.success) {
        // Action has already been executed by the selection list
        process.exit(0);
      } else {
        writeLine(yellow('No branch selected.'));
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
      `Error fetching branches: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

/**
 * Plugin/Module Pattern Registration
 * Command with subcommands - fully self-contained
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'branches',
    description: 'Interactive branch selection with fuzzy search',
    action: searchBranches,
    commandActions: getBranchGlobalActions(),
  });
}
