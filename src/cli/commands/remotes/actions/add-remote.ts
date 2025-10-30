import * as p from '@clack/prompts';
import { gitExecutor } from '../../../../core/git/executor.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Add a new remote repository
 */
export async function addRemote(): Promise<boolean> {
  try {
    // Ask for remote name
    const remoteName = await p.text({
      message: 'Enter name for the new remote:',
      placeholder: 'origin',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Remote name cannot be empty';
        }
        if (value.includes(' ')) {
          return 'Remote name cannot contain spaces';
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          return 'Remote name can only contain letters, numbers, dots, hyphens, and underscores';
        }
        return undefined;
      },
    });

    if (p.isCancel(remoteName)) {
      writeLine(yellow('Add remote cancelled.'));
      return false;
    }

    // Check if remote name already exists
    try {
      await gitExecutor.executeCommand(`git remote get-url ${remoteName}`);
      writeLine(yellow(`Remote '${remoteName}' already exists.`));
      return false;
    } catch {
      // Remote doesn't exist, which is what we want
    }

    // Ask for remote URL
    const remoteUrl = await p.text({
      message: `Enter URL for remote '${remoteName}':`,
      placeholder: 'https://github.com/user/repo.git',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Remote URL cannot be empty';
        }
        // Basic URL validation
        try {
          new URL(value);
        } catch {
          // Check if it's a valid git SSH format (git@host:path or user@host:path)
          if (!value.match(/^[\w.-]+@[\w.-]+:[\w./~-]+$/)) {
            return 'Please enter a valid URL or SSH format (user@host:path)';
          }
        }
        return undefined;
      },
    });

    if (p.isCancel(remoteUrl)) {
      writeLine(yellow('Add remote cancelled.'));
      return false;
    }

    // Execute git remote add command
    await gitExecutor.executeCommand(
      `git remote add ${remoteName} "${remoteUrl}"`
    );

    writeLine(
      green(`Successfully added remote '${remoteName}' with URL '${remoteUrl}'`)
    );
    return true;
  } catch (error) {
    throw new Error(
      `Failed to add remote: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
