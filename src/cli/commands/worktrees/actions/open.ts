import * as p from '@clack/prompts';
import { getEditorConfig } from '../../../../core/config.js';
import { GitWorktree } from '../../../../core/git/worktrees.js';
import { green } from '../../../ui/ansi.js';
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

    if (!editorConfig) {
      // No editor configured - show helpful message and offer to configure
      writeLine();
      writeErrorLine(
        'No editor configured. Do you want to configure your default editor?'
      );

      const shouldConfigure = await p.confirm({
        message: 'Configure editor now?',
        initialValue: true,
      });

      if (p.isCancel(shouldConfigure) || !shouldConfigure) {
        return true;
      }

      // Launch interactive config to set up editor
      await configCommand();

      // After config, try to open if editor was configured
      const newEditorConfig = getEditorConfig();
      if (newEditorConfig) {
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

    // Editor is configured - open directly
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
