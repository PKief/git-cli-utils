import { Command } from 'commander';
import { GitBranch, getGitBranches } from '../../../core/git/branches.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { getBranchGlobalActions } from './global-actions/index.js';
import { getBranchItemActions } from './item-actions/index.js';

export const searchBranches = async (): Promise<void | CommandResult> => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      writeLine(yellow('No branches found!'));
      return;
    }

    const result = await selectionList<GitBranch>({
      items: branches,
      renderItem: (branch) =>
        `${branch.date} - ${branch.name}${branch.current ? ' (current)' : ''}`,
      getSearchText: (branch) => branch.name,
      actions: getBranchItemActions(),
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }

    if (!result.success) {
      writeLine(yellow('No branch selected.'));
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch branches');
  }
};

/**
 * Plugin/Module Pattern Registration
 * Uses unified actions - CLI options auto-generated from globalActions
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'branches',
    description: 'Interactive branch selection with fuzzy search',
    action: searchBranches,
    globalActions: getBranchGlobalActions(),
  });
}
