import { Command } from 'commander';
import { GitBranch, getGitBranches } from '../../../core/git/branches.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { getBranchGlobalActions } from './global-actions/index.js';
import { getBranchItemActions } from './item-actions/index.js';

export const searchBranches = async (): Promise<void | CommandResult> => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      writeLine(yellow('No branches found!'));
      return;
    }

    try {
      const result = await selectionList<GitBranch>({
        items: branches,
        renderItem: (branch) =>
          `${branch.date} - ${branch.name}${branch.current ? ' (current)' : ''}`,
        getSearchText: (branch) => branch.name,
        actions: getBranchItemActions(),
        allowBack: true,
      });

      // User pressed ESC to go back
      if (result.back) {
        return { back: true };
      }

      if (!result.success) {
        writeLine(yellow('No branch selected.'));
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
