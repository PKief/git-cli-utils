/**
 * Global action: Create a new tag at HEAD
 */

import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { createSpinner } from '../../../utils/spinner.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Git tag name rules (similar to branch names):
 * 1. Cannot contain: space, ~, ^, :, ?, *, [, \, control characters
 * 2. Cannot start with a dash (-)
 * 3. Cannot contain consecutive dots (..)
 * 4. Cannot end with .lock
 */

/**
 * Sanitize tag name by replacing invalid characters
 */
function sanitizeTagName(input: string): string {
  let name = input.trim();

  // Replace whitespace with dashes
  name = name.replace(/\s+/g, '-');

  // Replace invalid characters with dashes
  name = name.replace(/[~^:?*[\]\\@{}<>|"'`]+/g, '-');

  // Replace consecutive dots with single dot
  name = name.replace(/\.{2,}/g, '.');

  // Replace consecutive dashes with single dash
  name = name.replace(/-{2,}/g, '-');

  // Remove leading dashes
  name = name.replace(/^-+/, '');

  // Remove trailing dashes and .lock
  name = name.replace(/-+$/, '');
  name = name.replace(/\.lock$/, '');

  return name;
}

/**
 * Validate tag name
 */
function validateTagName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return 'Tag name is required';
  }

  if (/[\s~^:?*[\]\\]/.test(name)) {
    return 'Tag name contains invalid characters';
  }

  if (name.startsWith('-')) {
    return 'Tag name cannot start with a dash';
  }

  if (name.includes('..')) {
    return 'Tag name cannot contain consecutive dots (..)';
  }

  if (name.endsWith('.lock')) {
    return 'Tag name cannot end with .lock';
  }

  return undefined;
}

/**
 * Arguments for creating a tag
 */
export interface CreateTagArgs {
  name: string;
}

/**
 * Prompt user for tag name and options
 * Returns null if user cancels
 */
export async function promptForTagName(): Promise<CreateTagArgs | null> {
  const rawInput = await p.text({
    message: 'Enter new tag name:',
    placeholder: 'v1.0.0',
    validate: (value) => {
      const sanitized = sanitizeTagName(value);
      return validateTagName(sanitized);
    },
  });

  if (typeof rawInput === 'symbol') {
    writeLine(yellow('Tag creation cancelled.'));
    return null;
  }

  const tagName = sanitizeTagName(rawInput);

  if (tagName !== rawInput.trim()) {
    writeLine(`Tag name sanitized to: ${tagName}`);
  }

  return { name: tagName };
}

/**
 * Create a new tag at the current HEAD
 * @param args - Tag creation arguments (name required)
 */
export async function createTag(args: CreateTagArgs): Promise<boolean> {
  try {
    const { name: tagName } = args;
    const executor = GitExecutor.getInstance();

    // Check if tag already exists
    const existingTags = await executor.executeCommand('git tag --list');
    if (existingTags.stdout.split('\n').includes(tagName)) {
      writeLine(red(`Tag '${tagName}' already exists.`));
      return false;
    }

    const tagType = await p.select({
      message: 'What type of tag?',
      options: [
        {
          value: 'lightweight',
          label: 'Lightweight',
          hint: 'Just a pointer to a commit',
        },
        {
          value: 'annotated',
          label: 'Annotated',
          hint: 'Includes message, tagger, and date',
        },
      ],
    });

    if (typeof tagType === 'symbol') {
      writeLine(yellow('Tag creation cancelled.'));
      return false;
    }

    if (tagType === 'annotated') {
      const message = await p.text({
        message: 'Enter tag message:',
        placeholder: 'Release version 1.0.0',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Message is required for annotated tags';
          }
          return undefined;
        },
      });

      if (typeof message === 'symbol') {
        writeLine(yellow('Tag creation cancelled.'));
        return false;
      }

      await executor.executeCommand(
        `git tag -a "${tagName}" -m "${message.trim()}"`
      );
    } else {
      await executor.executeCommand(`git tag "${tagName}"`);
    }

    writeLine(green(`✓ Created tag '${tagName}'`));

    // Ask about pushing to remote
    const pushToRemote = await p.confirm({
      message: 'Push tag to remote?',
      initialValue: false,
    });

    if (typeof pushToRemote !== 'symbol' && pushToRemote) {
      const spinner = createSpinner();
      spinner.start(`Pushing tag '${tagName}' to origin...`);
      try {
        await executor.executeCommand(`git push origin "${tagName}"`);
        spinner.stop(green(`Pushed tag '${tagName}' to origin`));
      } catch (error) {
        spinner.fail(
          red(
            `Failed to push tag: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    return true;
  } catch (error) {
    writeLine(
      red(
        `✗ Failed to create tag: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return false;
  }
}
