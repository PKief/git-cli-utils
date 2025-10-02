import { Command } from 'commander';
import { searchBranches } from './commands/branches/index.js';
import { searchCommits } from './commands/commits/index.js';
import { init } from './commands/init/index.js';
import { searchStashes } from './commands/stashes/index.js';
import { topAuthors } from './commands/top-authors/index.js';

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for Git management')
  .version('1.0.0');

program
  .command('branches')
  .description('Search for branches in the git repository')
  .action(searchBranches);

program
  .command('commits')
  .description('Search for commits in the git repository')
  .action(searchCommits);

program
  .command('stashes')
  .description('Search for stashes in the git repository')
  .action(searchStashes);

program
  .command('authors')
  .description(
    'Show top contributors by commit count, optionally for a specific file'
  )
  .argument('[file]', 'file path to analyze (optional)')
  .action(topAuthors);

program
  .command('init')
  .description('Initialize git utilities and set up aliases')
  .action(init);

export default program;
