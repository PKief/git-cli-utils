#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import init from './cli/commands/init.js';
import { searchBranches } from './cli/commands/search-branches.js';
import { searchCommits } from './cli/commands/search-commits.js';
import { topAuthors } from './cli/commands/top-authors.js';

// Get version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for managing Git repositories')
  .version(packageJson.version);

program
  .command('search-branches')
  .description('Interactive branch selection with fuzzy search')
  .action(searchBranches);

program
  .command('search-commits')
  .description('Interactive commit selection with fuzzy search')
  .action(searchCommits);

program
  .command('top-authors')
  .description(
    'Show top contributors by commit count, optionally for a specific file'
  )
  .argument('[file]', 'file path to analyze (optional)')
  .action(topAuthors);

program
  .command('init')
  .description('Setup git aliases for git-utils commands')
  .action(init);

program
  .command('list-aliases')
  .description('Show current git aliases')
  .action(async () => {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        'git config --global --get-regexp alias'
      );
      if (stdout.trim()) {
        console.log('📋 Current git aliases:\n');
        stdout
          .trim()
          .split('\n')
          .forEach((line) => {
            const [alias, command] = line.split(' ');
            const aliasName = alias.replace('alias.', '');
            console.log(`  git ${aliasName} → ${command}`);
          });
      } else {
        console.log('📋 No git aliases found.');
        console.log('💡 Run "git-utils init" to create some!');
      }
    } catch (_error) {
      console.log('📋 No git aliases found or error reading config.');
      console.log('💡 Run "git-utils init" to create some!');
    }
  });

program.parse(process.argv);
