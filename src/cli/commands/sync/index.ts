import { Command } from 'commander';
import {
  GitRemote,
  GitRemoteBranch,
  getGitRemotes,
  getRemoteBranches,
} from '../../../core/git/remotes.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { syncFromRemoteBranch } from './actions/sync.js';

/**
 * Main sync command that allows users to select a remote and branch to sync from
 */
const syncCommand = async (): Promise<void | CommandResult> => {
  // Step 1: Get list of available remotes
  const remotes = await getGitRemotes();

  if (remotes.length === 0) {
    writeLine(
      yellow(
        'No remotes found! Make sure you have configured remote repositories.'
      )
    );
    return;
  }

  // Step 2: Let user select a remote
  const remoteResult = await selectionList<GitRemote>({
    items: remotes,
    renderItem: (remote) => `${remote.name} - ${remote.url}`,
    getSearchText: (remote) => remote.name,
    header: yellow('Select a remote to fetch from:'),
    allowBack: true,
  });

  if (remoteResult.back) {
    return { back: true };
  }

  if (!remoteResult.success || !remoteResult.item) {
    writeLine(yellow('No remote selected.'));
    return;
  }

  const selectedRemote = remoteResult.item;

  // Step 3: Fetch branches from the selected remote
  const remoteBranches = await getRemoteBranches(selectedRemote.name);

  if (remoteBranches.length === 0) {
    writeLine(yellow(`No branches found on remote '${selectedRemote.name}'!`));
    return;
  }

  // Step 4: Let user select a branch from the remote
  const branchResult = await selectionList<GitRemoteBranch>({
    items: remoteBranches,
    renderItem: (branch) => `${branch.name} (${branch.lastCommit})`,
    getSearchText: (branch) => branch.name,
    header: yellow(`Select a branch from '${selectedRemote.name}' to sync:`),
    allowBack: true,
  });

  if (branchResult.back) {
    // Go back to remote selection - for now just return to main menu
    return { back: true };
  }

  if (!branchResult.success || !branchResult.item) {
    writeLine(yellow('No branch selected.'));
    return;
  }

  const selectedBranch = branchResult.item;

  // Step 5: Perform the sync operation
  try {
    await syncFromRemoteBranch(selectedRemote.name, selectedBranch.name);
    writeLine(
      `Successfully synced from ${selectedRemote.name}/${selectedBranch.name}`
    );
  } catch (error) {
    throw AppError.fromError(error, 'Error during sync');
  }
};

/**
 * Register sync command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'sync',
    description:
      'Sync from a remote branch by selecting remote and branch interactively',
    action: syncCommand,
  });
}
