import { Command } from 'commander';
import { searchBranches } from './commands/search-branches.js';
import { searchCommits } from './commands/search-commits.js';
import init from './commands/init.js';

const program = new Command();

program
  .name('git-utils')
  .description('CLI utilities for Git management')
  .version('1.0.0');

program
  .command('search-branches')
  .description('Search for branches in the git repository')
  .action(searchBranches);

program
  .command('search-commits')
  .description('Search for commits in the git repository')
  .action(searchCommits);

program
  .command('init')
  .description('Initialize git utilities and set up aliases')
  .action(init);

export default program;