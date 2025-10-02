#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { searchBranches } from './cli/commands/branches/index.js';
import { searchCommits } from './cli/commands/commits/index.js';
import { init } from './cli/commands/init/index.js';
import { listAliases } from './cli/commands/list-aliases/index.js';
import { saveChanges } from './cli/commands/save/index.js';
import { searchStashes } from './cli/commands/stashes/index.js';
import { searchTags } from './cli/commands/tags/index.js';
import { topAuthors } from './cli/commands/top-authors/index.js';
import {
  type GitUtilsCommand,
  showCommandSelector,
} from './cli/ui/command-selector.js';

// Get version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

// Commands are now defined with the imported GitUtilsCommand interface

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
    name: 'tags',
    description: 'Interactive tag selection with fuzzy search',
    action: searchTags,
  },
  {
    name: 'stashes',
    description: 'Interactive stash selection with fuzzy search',
    action: searchStashes,
  },
  {
    name: 'save',
    description: 'Save current working directory changes as a new stash',
    action: saveChanges,
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
  {
    name: 'help',
    description: 'Show help information for all commands',
    action: async () => {
      program.help();
    },
  },
];

// Command selector is now handled by the UI module

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
    await showCommandSelector(commands);
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
