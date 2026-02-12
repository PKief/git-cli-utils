#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { registerCommand as registerBranches } from './cli/commands/branches/index.js';
import { registerCommand as registerCommits } from './cli/commands/commits/index.js';
import { registerCommand as registerConfig } from './cli/commands/config/index.js';
import { registerCommand as registerInit } from './cli/commands/init/index.js';
import { registerCommand as registerAliases } from './cli/commands/list-aliases/index.js';
import { registerCommand as registerRemotes } from './cli/commands/remotes/index.js';
import { registerCommand as registerStashes } from './cli/commands/stashes/index.js';
import { registerCommand as registerSync } from './cli/commands/sync/index.js';
import { registerCommand as registerTags } from './cli/commands/tags/index.js';
import { registerCommand as registerAuthors } from './cli/commands/top-authors/index.js';
import { registerCommand as registerWorktrees } from './cli/commands/worktrees/index.js';
import {
  type GitUtilsCommand,
  showCommandSelector,
} from './cli/ui/command-selector.js';
import { handleErrorAndExit } from './cli/utils/exit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for managing Git repositories')
  .version(packageJson.version);

const commands: GitUtilsCommand[] = [
  registerBranches(program),
  registerCommits(program),
  registerTags(program),
  registerStashes(program),
  registerSync(program),
  registerRemotes(program),
  registerWorktrees(program),
  registerAliases(program),
  registerAuthors(program),
  registerInit(program),
  registerConfig(program),
  {
    name: 'help',
    description: 'Show help information for all commands',
    action: async () => {
      program.help();
    },
  },
];

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

// Centralized error handling - all errors bubble up here
main().catch(handleErrorAndExit);
