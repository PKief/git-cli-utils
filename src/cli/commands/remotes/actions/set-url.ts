import * as p from '@clack/prompts';
import { GitRemote, gitExecutor } from '../../../../core/git/index.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Set URL for a remote
 */
export async function setRemoteUrl(remote: GitRemote): Promise<boolean> {
  try {
    const newUrl = await p.text({
      message: `Enter new URL for remote '${remote.name}':`,
      placeholder: remote.url,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'URL cannot be empty';
        }
        if (value === remote.url) {
          return 'New URL must be different from current URL';
        }
        // Basic URL validation
        try {
          new URL(value);
        } catch {
          // Check if it's a valid git SSH format (git@host:path)
          if (!value.match(/^[\w.-]+@[\w.-]+:[\w./~-]+$/)) {
            return 'Please enter a valid URL or SSH format (git@host:path)';
          }
        }
        return undefined;
      },
    });

    if (p.isCancel(newUrl)) {
      writeLine(yellow('Set URL cancelled.'));
      return false;
    }

    // Execute git remote set-url command
    await gitExecutor.executeCommand(
      `git remote set-url ${remote.name} "${newUrl}"`
    );

    writeLine(
      green(
        `Successfully updated URL for remote '${remote.name}' to '${newUrl}'`
      )
    );
    return true;
  } catch (error) {
    throw new Error(
      `Failed to set URL for remote '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
