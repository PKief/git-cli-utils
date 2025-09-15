import { exec } from 'child_process';
import clipboardy from 'clipboardy';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git operations utility functions
 */
export class GitOperations {
  /**
   * Checkout a git branch
   */
  static async checkoutBranch(branchName: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(
        `git checkout "${branchName}"`
      );

      if (
        stderr &&
        !stderr.includes('Switched to branch') &&
        !stderr.includes('Already on')
      ) {
        throw new Error(stderr);
      }

      console.log(`✅ Switched to branch '${branchName}'`);
      if (stdout) {
        console.log(stdout.trim());
      }
    } catch (error) {
      throw new Error(
        `Failed to checkout branch '${branchName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Copy text to clipboard using clipboardy library for cross-platform support
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      await clipboardy.write(text);
      console.log(`📋 Copied to clipboard: ${text}`);
    } catch (error) {
      throw new Error(
        `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
