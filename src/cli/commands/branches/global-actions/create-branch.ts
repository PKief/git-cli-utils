/**
 * Global action: Create a new branch from HEAD
 */

import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Git branch name rules:
 * 1. Cannot start with a dot (.)
 * 2. Cannot contain consecutive dots (..)
 * 3. Cannot contain: space, ~, ^, :, ?, *, [, \, control characters
 * 4. Cannot end with a dot (.)
 * 5. Cannot end with .lock
 * 6. Cannot contain @{
 * 7. Cannot be a single @
 * 8. Cannot start or end with a slash (/)
 * 9. Cannot contain consecutive slashes (//)
 */

/**
 * Sanitize branch name by replacing invalid characters
 */
function sanitizeBranchName(input: string): string {
  let name = input.trim();

  // Replace whitespace with dashes
  name = name.replace(/\s+/g, '-');

  // Replace other invalid characters with dashes
  name = name.replace(/[~^:?*[\]\\@{}<>|"'`]+/g, '-');

  // Replace consecutive dots with single dot
  name = name.replace(/\.{2,}/g, '.');

  // Replace consecutive slashes with single slash
  name = name.replace(/\/{2,}/g, '/');

  // Replace consecutive dashes with single dash
  name = name.replace(/-{2,}/g, '-');

  // Remove leading dots, slashes, and dashes
  name = name.replace(/^[./-]+/, '');

  // Remove trailing dots, slashes, dashes, and .lock
  name = name.replace(/[./-]+$/, '');
  name = name.replace(/\.lock$/, '');

  return name;
}

/**
 * Validate branch name according to git rules
 */
function validateBranchName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return 'Branch name is required';
  }

  // Check for invalid characters that weren't sanitized
  if (/[\s~^:?*[\]\\]/.test(name)) {
    return 'Branch name contains invalid characters';
  }

  // Cannot start with dot or slash
  if (name.startsWith('.') || name.startsWith('/')) {
    return 'Branch name cannot start with . or /';
  }

  // Cannot end with dot, slash, or .lock
  if (name.endsWith('.') || name.endsWith('/') || name.endsWith('.lock')) {
    return 'Branch name cannot end with ., /, or .lock';
  }

  // Cannot contain consecutive dots
  if (name.includes('..')) {
    return 'Branch name cannot contain consecutive dots (..)';
  }

  // Cannot contain @{
  if (name.includes('@{')) {
    return 'Branch name cannot contain @{';
  }

  // Cannot be just @
  if (name === '@') {
    return 'Branch name cannot be just @';
  }

  // Cannot contain consecutive slashes
  if (name.includes('//')) {
    return 'Branch name cannot contain consecutive slashes';
  }

  return undefined;
}

/**
 * Arguments for creating a branch
 */
export interface CreateBranchArgs {
  name: string;
}

/**
 * Prompt user for branch name
 * Returns null if user cancels
 */
export async function promptForBranchName(): Promise<CreateBranchArgs | null> {
  const rawInput = await p.text({
    message: 'Enter new branch name:',
    placeholder: 'feature/my-new-feature',
    validate: (value) => {
      const sanitized = sanitizeBranchName(value);
      return validateBranchName(sanitized);
    },
  });

  if (typeof rawInput === 'symbol') {
    writeLine(yellow('Branch creation cancelled.'));
    return null;
  }

  // Sanitize the input
  const branchName = sanitizeBranchName(rawInput);

  // Show the sanitized name if it differs from input
  if (branchName !== rawInput.trim()) {
    writeLine(`Branch name sanitized to: ${branchName}`);
  }

  return { name: branchName };
}

/**
 * Create a new branch from current HEAD
 * @param args - Branch creation arguments (name required)
 */
export async function createBranch(args: CreateBranchArgs): Promise<boolean> {
  try {
    const { name: branchName } = args;

    const executor = GitExecutor.getInstance();

    // Check if branch already exists
    const existingBranches = await executor.executeCommand(
      'git branch --format="%(refname:short)"'
    );
    if (existingBranches.stdout.split('\n').includes(branchName)) {
      writeLine(red(`Branch '${branchName}' already exists.`));
      return false;
    }

    // Ask if user wants to checkout the new branch
    const checkoutBranch = await p.confirm({
      message: 'Switch to the new branch after creation?',
      initialValue: true,
    });

    if (typeof checkoutBranch === 'symbol') {
      writeLine(yellow('Branch creation cancelled.'));
      return false;
    }

    if (checkoutBranch) {
      await executor.executeCommand(`git checkout -b "${branchName}"`);
      writeLine(green(`✓ Created and switched to branch '${branchName}'`));
    } else {
      await executor.executeCommand(`git branch "${branchName}"`);
      writeLine(green(`✓ Created branch '${branchName}'`));
    }

    return true;
  } catch (error) {
    writeLine(
      red(
        `✗ Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return false;
  }
}
