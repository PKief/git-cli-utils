import { Command } from 'commander';
import init from './commands/init.js';
import { searchBranches } from './commands/search-branches.js';
import { searchCommits } from './commands/search-commits.js';
import { topAuthors } from './commands/top-authors.js';

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
