import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import { getEditorConfig } from '../../../../core/config.js';
import { GitWorktree } from '../../../../core/git/worktrees.js';
import { green, yellow } from '../../../ui/ansi.js';
import { openInConfiguredEditor } from '../../../utils/editor.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';
import { configCommand } from '../../config/index.js';

/**
 * Open a worktree in the configured editor
 */
export async function openWorktreeInEditor(
  worktree: GitWorktree
): Promise<boolean> {
  try {
    const editorConfig = getEditorConfig();

    // Check if no editor is configured OR if the configured editor doesn't exist
    const needsConfiguration = !editorConfig || !existsSync(editorConfig.path);

    if (needsConfiguration) {
      // Show clear message regardless of whether config is missing or invalid
      writeLine(yellow('No editor configured'));

      const shouldConfigure = await p.confirm({
        message: 'Configure editor now?',
        initialValue: true,
      });

      if (p.isCancel(shouldConfigure) || !shouldConfigure) {
        return true;
      }

      // Launch interactive config to set up editor
      await configCommand();

      // After config, try to open if editor was configured and valid
      const newEditorConfig = getEditorConfig();
      if (newEditorConfig && existsSync(newEditorConfig.path)) {
        const shouldOpen = await p.confirm({
          message: 'Open worktree in the configured editor?',
          initialValue: true,
        });

        if (!p.isCancel(shouldOpen) && shouldOpen) {
          const success = openInConfiguredEditor(worktree.path, {
            silent: false,
          });
          if (success) {
            writeLine(green(`✓ Opened worktree in editor: ${worktree.path}`));
            writeLine(`  Branch: ${worktree.branch || 'detached HEAD'}`);
            writeLine(`  Commit: ${worktree.commit || 'unknown'}`);
          }
          return success;
        }
      }
      return true;
    }

    // Editor is configured and exists - open directly
    const success = openInConfiguredEditor(worktree.path, { silent: false });
    if (success) {
      writeLine(green(`✓ Opened worktree in editor: ${worktree.path}`));
      writeLine(`  Branch: ${worktree.branch || 'detached HEAD'}`);
      writeLine(`  Commit: ${worktree.commit || 'unknown'}`);
    }
    return success;
  } catch (error) {
    writeErrorLine(
      `Failed to open worktree in editor: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}
