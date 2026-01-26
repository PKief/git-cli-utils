import * as p from '@clack/prompts';
import { GitBranch } from '../../../../core/git/branches.js';
import { gitExecutor } from '../../../../core/git/executor.js';
import { getGitRemotes } from '../../../../core/git/remotes.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionCancelled,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Set or change the upstream tracking remote for a branch
 */
export async function setUpstream(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    // Get available remotes
    const remotes = await getGitRemotes();

    if (remotes.length === 0) {
      writeLine(yellow('No remotes configured. Add a remote first.'));
      return actionFailure('No remotes available');
    }

    // Build options: remotes + unset option if branch has upstream
    const options: { label: string; value: string }[] = remotes.map(
      (remote) => ({
        label: remote.name,
        value: remote.name,
      })
    );

    if (branch.upstream) {
      options.push({
        label: 'Unset upstream (stop tracking)',
        value: '__unset__',
      });
    }

    const currentRemote = branch.upstream?.split('/')[0];
    const message = branch.upstream
      ? `Select remote for '${branch.name}' (currently tracking ${branch.upstream}):`
      : `Select remote for '${branch.name}' to track:`;

    const selected = await p.select({
      message,
      options,
      initialValue: currentRemote,
    });

    if (p.isCancel(selected)) {
      writeLine(yellow('Cancelled.'));
      return actionCancelled('Selection cancelled');
    }

    if (selected === '__unset__') {
      // Unset upstream
      await gitExecutor.executeCommand(
        `git branch --unset-upstream ${branch.name}`
      );
      writeLine(green(`✓ Removed upstream tracking for '${branch.name}'`));
      return actionSuccess(`Removed upstream for '${branch.name}'`);
    }

    // Set upstream to selected remote
    const remoteBranch = `${selected}/${branch.name}`;
    await gitExecutor.executeCommand(
      `git branch --set-upstream-to=${remoteBranch} ${branch.name}`
    );
    writeLine(green(`✓ Set '${branch.name}' to track '${remoteBranch}'`));
    return actionSuccess(`Set upstream to '${remoteBranch}'`);
  } catch (error) {
    const errorMessage = `Failed to set upstream: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
