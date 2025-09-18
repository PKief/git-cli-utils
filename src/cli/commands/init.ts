import * as p from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  getOptimalCommand,
  getPerformanceStatus,
  isGitUtilsAvailable,
} from '../utils/binary-detection.js';

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
    command: 'search-branches',
    defaultAlias: 'sb',
    description: 'Interactive branch selection with fuzzy search',
  },
  {
    name: 'Search Commits',
    command: 'search-commits',
    defaultAlias: 'sc',
    description: 'Interactive commit selection with fuzzy search',
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
    console.error(`Error setting alias '${alias}': ${error}`);
    return false;
  }
}

async function init() {
  console.log('🚀 Welcome to Git CLI Utilities Setup!\n');

  // Check for global installation and inform user about performance
  const performanceStatus = await getPerformanceStatus();
  console.log(`📊 Performance Status: ${performanceStatus}\n`);

  const isGloballyAvailable = await isGitUtilsAvailable();
  if (!isGloballyAvailable) {
    console.log(
      '💡 Performance Tip: Install git-cli-utils globally for faster git aliases:'
    );
    console.log('   npm install -g git-cli-utils');
    console.log('   # or');
    console.log('   bun install -g git-cli-utils\n');

    const continueWithNpx = await p.confirm({
      message:
        'Continue with npx setup (slower but works without global install)?',
      initialValue: true,
    });

    if (p.isCancel(continueWithNpx) || !continueWithNpx) {
      console.log(
        'Setup cancelled. Install globally and run "git-utils init" again for optimal performance.'
      );
      return;
    }
    console.log('');
  }

  // Step 1: Multi-select commands
  const selectedCommands = await p.multiselect({
    message: 'Which commands would you like to create git aliases for?',
    options: availableCommands.map((cmd) => ({
      value: cmd.command,
      label: `${cmd.name} (${cmd.defaultAlias})`,
      hint: cmd.description,
    })),
    required: false,
  });

  if (p.isCancel(selectedCommands) || selectedCommands.length === 0) {
    console.log('No commands selected. Setup cancelled.');
    return;
  }

  console.log('\n📝 Setting up aliases...\n');

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
        console.log(`Skipping ${command.name}...`);
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
          console.log(`Skipping ${command.name}...`);
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
        console.log(`Skipping ${command.name}...`);
        continue;
      }

      aliasToUse = confirmAlias || command.defaultAlias;
    }

    // Set the alias
    const success = await setGitAlias(aliasToUse, command.command);
    if (success) {
      console.log(`✅ Created alias: git ${aliasToUse} → ${command.name}`);
    } else {
      console.log(`❌ Failed to create alias for ${command.name}`);
    }
  }

  console.log('\n🎉 Setup complete! You can now use:');
  console.log('  git <alias>  - Run the aliased command');
  console.log(
    '  git config --global --get-regexp alias  - View all your aliases\n'
  );
}

export default init;
