import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import {
  getEditorConfig,
  getWorktreeSymlinkConfig,
  setWorktreeSymlinkConfig,
} from '../../core/config.js';
import { GitBranch } from '../../core/git/branches.js';
import { GitCommit } from '../../core/git/commits.js';
import { GitRemoteBranch } from '../../core/git/remotes.js';
import {
  createSymlinksForIgnored,
  filterByPatterns,
  getIgnoredPaths,
  type IgnoredPath,
} from '../../core/git/worktree-symlinks.js';
import {
  createWorktree,
  createWorktreeFromCommit,
  getGitWorktrees,
  getRepositoryRoot,
} from '../../core/git/worktrees.js';
import { configCommand } from '../commands/config/index.js';
import { blue, gray, green, yellow } from '../ui/ansi.js';
import { openInConfiguredEditor } from './editor.js';
import { writeErrorLine, writeLine } from './terminal.js';

/**
 * Automatically open worktree in editor if configured, otherwise offer to configure
 */
async function openWorktreeInEditor(worktreePath: string): Promise<void> {
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
      return;
    }

    // Launch interactive config to set up editor
    await configCommand();

    // After config, automatically open if editor was configured and valid
    const newEditorConfig = getEditorConfig();
    if (newEditorConfig && existsSync(newEditorConfig.path)) {
      openInConfiguredEditor(worktreePath, { silent: false });
    }
    return;
  }

  // Editor is configured and exists - open automatically
  openInConfiguredEditor(worktreePath, { silent: false });
}

/**
 * Prompt user to select which git-ignored files/folders to symlink to the worktree
 */
async function promptForSymlinks(
  sourceRepo: string,
  worktreePath: string
): Promise<void> {
  const config = getWorktreeSymlinkConfig();

  // Skip if mode is plain (no symlinks)
  if (config.mode === 'plain') {
    return;
  }

  // Get all ignored paths in the repo
  const ignoredPaths = await getIgnoredPaths(sourceRepo);

  if (ignoredPaths.length === 0) {
    return;
  }

  // Filter by default patterns to get pre-selected items
  const defaultMatches = filterByPatterns(ignoredPaths, config.defaultPatterns);
  const defaultMatchPaths = new Set(defaultMatches.map((p) => p.relativePath));

  // Build options for multiselect
  const options = ignoredPaths.map((item) => ({
    value: item,
    label: item.isDirectory ? `${item.relativePath}/` : item.relativePath,
    hint: item.isDirectory ? 'directory' : 'file',
  }));

  // Ask user which files to symlink
  writeLine('');
  const selected = await p.multiselect({
    message: 'Select git-ignored files/folders to symlink to the worktree',
    options,
    initialValues: ignoredPaths.filter((p) =>
      defaultMatchPaths.has(p.relativePath)
    ),
    required: false,
  });

  if (p.isCancel(selected) || selected.length === 0) {
    return;
  }

  const selectedPaths = selected as IgnoredPath[];

  // Create the symlinks
  writeLine(gray('Creating symlinks...'));
  const results = await createSymlinksForIgnored(
    sourceRepo,
    worktreePath,
    selectedPaths
  );

  // Report results
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    writeLine(
      green(`  Symlinked: ${successful.map((r) => r.path).join(', ')}`)
    );
  }

  if (failed.length > 0) {
    for (const f of failed) {
      writeErrorLine(`  Failed to symlink ${f.path}: ${f.error}`);
    }
  }

  // Ask if user wants to save their selection as default patterns
  const selectedNames = selectedPaths.map((p) => p.relativePath);
  const currentPatterns = config.defaultPatterns;
  const patternsChanged =
    selectedNames.length !== currentPatterns.length ||
    !selectedNames.every((n) => currentPatterns.includes(n));

  if (patternsChanged && successful.length > 0) {
    const shouldSave = await p.confirm({
      message: 'Save this selection as default for future worktrees?',
      initialValue: false,
    });

    if (!p.isCancel(shouldSave) && shouldSave) {
      setWorktreeSymlinkConfig({
        mode: 'selective',
        defaultPatterns: selectedNames,
      });
      writeLine(blue('Default symlink patterns updated'));
    }
  }
}

/**
 * Checkout a branch in a new worktree
 */
export async function checkoutBranchInWorktree(
  branch: GitBranch
): Promise<boolean> {
  try {
    writeLine(`Creating worktree for branch '${branch.name}'...`);

    // Check if worktree already exists for this branch
    const existingWorktrees = await getGitWorktrees();
    const existingWorktree = existingWorktrees.find(
      (wt) => wt.branch === branch.name
    );

    if (existingWorktree) {
      writeLine(
        green(
          `✓ Worktree exists for branch '${branch.name}': ${existingWorktree.path}`
        )
      );

      // Automatically open existing worktree in configured editor
      await openWorktreeInEditor(existingWorktree.path);
      return true;
    }

    // Auto-generate path based on branch name
    const repoRoot = await getRepositoryRoot();
    const createdPath = await createWorktree(branch.name);

    writeLine(green(`✓ Worktree created: ${createdPath}`));
    writeLine(`  Branch: ${branch.name}`);

    // Prompt for symlinking git-ignored files
    await promptForSymlinks(repoRoot, createdPath);

    // Automatically open in configured editor
    await openWorktreeInEditor(createdPath);

    return true;
  } catch (error) {
    writeErrorLine(
      `Failed to create worktree for branch '${branch.name}': ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Checkout a commit in a new worktree (detached HEAD)
 */
export async function checkoutCommitInWorktree(
  commit: GitCommit
): Promise<boolean> {
  try {
    writeLine(
      `Creating worktree for commit '${commit.hash.substring(0, 8)}'...`
    );

    // Auto-generate path based on commit hash
    const repoRoot = await getRepositoryRoot();
    const createdPath = await createWorktreeFromCommit(commit.hash);

    writeLine(green(`✓ Worktree created: ${createdPath}`));
    writeLine(`  Commit: ${commit.hash.substring(0, 8)}`);

    // Prompt for symlinking git-ignored files
    await promptForSymlinks(repoRoot, createdPath);

    // Automatically open in configured editor
    await openWorktreeInEditor(createdPath);

    return true;
  } catch (error) {
    writeErrorLine(
      `Failed to create worktree for commit '${commit.hash}': ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Checkout a remote branch in a new worktree
 */
export async function checkoutRemoteBranchInWorktree(
  remoteBranch: GitRemoteBranch
): Promise<boolean> {
  try {
    const branchName = remoteBranch.name;
    const remoteName = remoteBranch.fullName.split('/')[0]; // Extract remote name from fullName
    writeLine(
      `Creating worktree for remote branch '${remoteName}/${branchName}'...`
    );

    // Check if worktree already exists for this branch
    const existingWorktrees = await getGitWorktrees();
    const existingWorktree = existingWorktrees.find(
      (wt) => wt.branch === branchName
    );

    if (existingWorktree) {
      writeLine(
        green(
          `✓ Worktree exists for branch '${branchName}': ${existingWorktree.path}`
        )
      );

      // Automatically open existing worktree in configured editor
      await openWorktreeInEditor(existingWorktree.path);
      return true;
    }

    // Auto-generate path based on remote branch name
    const repoRoot = await getRepositoryRoot();
    const createdPath = await createWorktree(remoteBranch.fullName);

    writeLine(green(`✓ Worktree created: ${createdPath}`));
    writeLine(`  Remote branch: ${remoteName}/${branchName}`);

    // Prompt for symlinking git-ignored files
    await promptForSymlinks(repoRoot, createdPath);

    // Automatically open in configured editor
    await openWorktreeInEditor(createdPath);

    return true;
  } catch (error) {
    writeErrorLine(
      `Failed to create worktree for remote branch '${remoteBranch.fullName}': ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}
