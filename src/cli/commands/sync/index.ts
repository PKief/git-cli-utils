import { Command } from 'commander';
import {
  GitRemote,
  GitRemoteBranch,
  getGitRemotes,
  getRemoteBranches,
} from '../../../core/git/index.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { syncFromRemoteBranch } from './actions/sync.js';

/**
 * Main sync command that allows users to select a remote and branch to sync from
 */
const syncCommand = async () => {
  try {
    // Step 1: Get list of available remotes
    const remotes = await getGitRemotes();

    if (remotes.length === 0) {
      writeLine(
        yellow(
          'No remotes found! Make sure you have configured remote repositories.'
        )
      );
      process.exit(0);
    }

    // Step 2: Let user select a remote
    const selectedRemote = await interactiveList<GitRemote>(
      remotes,
      (remote: GitRemote) => `${remote.name} - ${remote.url}`,
      (remote: GitRemote) => remote.name,
      yellow('Select a remote to fetch from:')
    );

    if (!selectedRemote) {
      writeLine(yellow('No remote selected.'));
      process.exit(0);
    }

    // Step 3: Fetch branches from the selected remote
    const remoteBranches = await getRemoteBranches(selectedRemote.name);

    if (remoteBranches.length === 0) {
      writeLine(
        yellow(`No branches found on remote '${selectedRemote.name}'!`)
      );
      process.exit(0);
    }

    // Step 4: Let user select a branch from the remote
    const selectedBranch = await interactiveList<GitRemoteBranch>(
      remoteBranches,
      (branch: GitRemoteBranch) => `${branch.name} (${branch.lastCommit})`,
      (branch: GitRemoteBranch) => branch.name,
      yellow(`Select a branch from '${selectedRemote.name}' to sync:`)
    );

    if (!selectedBranch) {
      writeLine(yellow('No branch selected.'));
      process.exit(0);
    }

    // Step 5: Perform the sync operation
    await syncFromRemoteBranch(selectedRemote.name, selectedBranch.name);

    writeLine(
      `Successfully synced from ${selectedRemote.name}/${selectedBranch.name}`
    );
    process.exit(0);
  } catch (error) {
    if (error instanceof Error && error.message === 'Selection cancelled') {
      writeLine(yellow('Sync cancelled.'));
      process.exit(0);
    }

    writeErrorLine(
      `Error during sync: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
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
