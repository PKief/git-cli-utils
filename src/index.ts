#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import init from './cli/commands/init.js';
import { listAliases } from './cli/commands/list-aliases.js';
import { searchBranches } from './cli/commands/search-branches.js';
import { searchCommits } from './cli/commands/search-commits.js';
import { topAuthors } from './cli/commands/top-authors.js';
import { green, yellow } from './cli/ui/ansi.js';
import { interactiveList } from './cli/ui/interactive-list.js';

// Get version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

// Define available commands for both interactive selection and CLI registration
interface GitUtilsCommand {
  name: string;
  description: string;
  action: (...args: string[]) => Promise<void>;
  argument?: {
    name: string;
    description: string;
  };
}

// Centralized command definitions
const commands: GitUtilsCommand[] = [
  {
    name: 'branches',
    description: 'Interactive branch selection with fuzzy search',
    action: searchBranches,
  },
  {
    name: 'commits',
    description: 'Interactive commit selection with fuzzy search',
    action: searchCommits,
  },
  {
    name: 'authors',
    description:
      'Show top contributors by commit count, optionally for a specific file',
    action: topAuthors,
    argument: {
      name: '[file]',
      description: 'file path to analyze (optional)',
    },
  },
  {
    name: 'init',
    description: 'Setup git aliases for git-utils commands',
    action: init,
  },
  {
    name: 'aliases',
    description: 'Show current git aliases',
    action: listAliases,
  },
];

// Interactive command selector
async function showCommandSelector(): Promise<void> {
  console.log(green('🚀 Git CLI Utils'));
  console.log('Select a command to run:\n');

  const selectedCommand = await interactiveList<GitUtilsCommand>(
    commands,
    (cmd: GitUtilsCommand) => `${cmd.name.padEnd(12)} ${cmd.description}`,
    (cmd: GitUtilsCommand) => `${cmd.name} ${cmd.description}` // Search both name and description
  );

  if (selectedCommand) {
    console.log(yellow(`\nExecuting: ${selectedCommand.name}\n`));
    await selectedCommand.action();
  } else {
    console.log(yellow('No command selected. Exiting.'));
    process.exit(0);
  }
}

// Register commands with the CLI program
function registerCommands(program: Command): void {
  commands.forEach((cmd) => {
    const command = program.command(cmd.name).description(cmd.description);

    // Add argument if specified
    if (cmd.argument) {
      command.argument(cmd.argument.name, cmd.argument.description);
    }

    command.action(cmd.action);
  });
}

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for managing Git repositories')
  .version(packageJson.version);

// Register all commands dynamically
registerCommands(program);

// Main execution function
async function main() {
  // Check if no arguments were provided (only 'node' and script name)
  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Show interactive command selector when no arguments provided
    await showCommandSelector();
  } else {
    // Parse arguments normally for direct command usage
    program.parse(process.argv);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
