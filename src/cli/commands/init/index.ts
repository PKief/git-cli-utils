import * as p from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  getOptimalCommand,
  getPerformanceStatus,
  isGitUtilsAvailable,
} from '../../utils/binary-detection.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';

const execAsync = promisify(exec);

interface Command {
  name: string;
  command: string;
  defaultAlias: string;
  description: string;
}

const availableCommands: Command[] = [
  {
    name: 'Search Branches',
    command: 'branches',
    defaultAlias: 'branches',
    description: 'Interactive branch selection with fuzzy search',
  },
  {
    name: 'Search Commits',
    command: 'commits',
    defaultAlias: 'commits',
    description: 'Interactive commit selection with fuzzy search',
  },
  {
    name: 'Search Stashes',
    command: 'stashes',
    defaultAlias: 'stashes',
    description: 'Interactive stash selection with fuzzy search',
  },
  {
    name: 'Search Tags',
    command: 'tags',
    defaultAlias: 'tags',
    description: 'Interactive tag selection with fuzzy search',
  },
  {
    name: 'Save Changes',
    command: 'save',
    defaultAlias: 'save',
    description: 'Save current working directory changes as a new stash',
  },
  {
    name: 'Top Authors',
    command: 'authors',
    defaultAlias: 'authors',
    description:
      'Show top contributors by commit count for files or repository',
  },
];

async function checkExistingAlias(alias: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`git config --global alias.${alias}`);
    return stdout.trim() !== '';
  } catch {
    return false;
  }
}

async function setGitAlias(alias: string, command: string): Promise<boolean> {
  try {
    const optimalCommand = await getOptimalCommand(command);
    await execAsync(`git config --global alias.${alias} "${optimalCommand}"`);
    return true;
  } catch (error) {
    writeErrorLine(`Error setting alias '${alias}': ${error}`);
    return false;
  }
}

export const init = async () => {
  writeLine('Welcome to Git CLI Utilities Setup!');
  writeLine();

  // Check for global installation and inform user about performance
  const performanceStatus = await getPerformanceStatus();
  writeLine(`Performance Status: ${performanceStatus}`);
  writeLine();

  const isGloballyAvailable = await isGitUtilsAvailable();
  if (!isGloballyAvailable) {
    writeLine(
      'Performance Tip: Install git-cli-utils globally for faster git aliases:'
    );
    writeLine('   npm install -g git-cli-utils');
    writeLine('   # or');
    writeLine('   bun install -g git-cli-utils');
    writeLine();

    const continueWithNpx = await p.confirm({
      message:
        'Continue with npx setup (slower but works without global install)?',
      initialValue: true,
    });

    if (p.isCancel(continueWithNpx) || !continueWithNpx) {
      writeLine(
        'Setup cancelled. Install globally and run "git-utils init" again for optimal performance.'
      );
      return;
    }
    writeLine();
  }

  // Step 1: Multi-select commands
  const selectedCommands = await p.multiselect({
    message: 'Which commands would you like to create git aliases for?',
    options: availableCommands.map((cmd) => ({
      value: cmd.command,
      label: `${cmd.name} (git ${cmd.defaultAlias})`,
      hint: cmd.description,
    })),
    required: false,
  });

  if (p.isCancel(selectedCommands) || selectedCommands.length === 0) {
    writeLine('No commands selected. Setup cancelled.');
    return;
  }

  writeLine();
  writeLine('Setting up aliases...');
  writeLine();

  // Step 2: Configure alias for each selected command
  for (const commandName of selectedCommands) {
    const command = availableCommands.find(
      (cmd) => cmd.command === commandName
    );
    if (!command) continue;

    // Check if default alias already exists
    const aliasExists = await checkExistingAlias(command.defaultAlias);

    let aliasToUse = command.defaultAlias;

    if (aliasExists) {
      const shouldOverride = await p.confirm({
        message: `Alias '${command.defaultAlias}' already exists. Override it?`,
        initialValue: false,
      });

      if (p.isCancel(shouldOverride)) {
        writeLine(`Skipping ${command.name}...`);
        continue;
      }

      if (!shouldOverride) {
        // Ask for alternative alias
        const newAlias = await p.text({
          message: `Enter alternative alias for ${command.name}:`,
          placeholder: command.defaultAlias,
          validate: (value) => {
            if (!value) return 'Alias cannot be empty';
            if (!/^[a-zA-Z0-9-_]+$/.test(value))
              return 'Alias can only contain letters, numbers, hyphens, and underscores';
            return undefined;
          },
        });

        if (p.isCancel(newAlias)) {
          writeLine(`Skipping ${command.name}...`);
          continue;
        }

        aliasToUse = newAlias;
      }
    } else {
      // Confirm default alias
      const confirmAlias = await p.text({
        message: `Alias for ${command.name}:`,
        placeholder: command.defaultAlias,
        defaultValue: command.defaultAlias,
        validate: (value) => {
          if (!value) return 'Alias cannot be empty';
          if (!/^[a-zA-Z0-9-_]+$/.test(value))
            return 'Alias can only contain letters, numbers, hyphens, and underscores';
          return undefined;
        },
      });

      if (p.isCancel(confirmAlias)) {
        writeLine(`Skipping ${command.name}...`);
        continue;
      }

      aliasToUse = confirmAlias || command.defaultAlias;
    }

    // Set the alias
    const success = await setGitAlias(aliasToUse, command.command);
    if (success) {
      writeLine(`Created alias: git ${aliasToUse} → ${command.name}`);
    } else {
      writeLine(`Failed to create alias for ${command.name}`);
    }
  }

  writeLine();
  writeLine('Setup complete! You can now use:');
  writeLine('  git <alias>  - Run the aliased command');
  writeLine(
    '  git config --global --get-regexp alias  - View all your aliases'
  );
  writeLine();
};
