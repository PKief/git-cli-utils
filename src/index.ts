#!/usr/bin/env node
import { Command } from 'commander';
import { searchBranches } from './cli/commands/search-branches.js';
import { searchCommits } from './cli/commands/search-commits.js';
import init from './cli/commands/init.js';

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for managing Git repositories')
  .version('1.0.0');

program
  .command('search-branches')
  .description('Interactive branch selection with fuzzy search')
  .action(searchBranches);

program
  .command('search-commits')
  .description('Interactive commit selection with fuzzy search')
  .action(searchCommits);

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
      const { stdout } = await execAsync('git config --global --get-regexp alias');
      if (stdout.trim()) {
        console.log('📋 Current git aliases:\n');
        stdout.trim().split('\n').forEach(line => {
          const [alias, command] = line.split(' ');
          const aliasName = alias.replace('alias.', '');
          console.log(`  git ${aliasName} → ${command}`);
        });
      } else {
        console.log('📋 No git aliases found.');
        console.log('💡 Run "git-utils init" to create some!');
      }
    } catch (error) {
      console.log('📋 No git aliases found or error reading config.');
      console.log('💡 Run "git-utils init" to create some!');
    }
  });

program.parse(process.argv);