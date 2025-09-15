import { exec } from 'child_process';

export interface GitBranch {
  name: string;
  date: string;
}

export function getGitBranches(): Promise<GitBranch[]> {
  return new Promise((resolve, reject) => {
    exec('git branch --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)" --list', (error, stdout) => {
      if (error) {
        reject(new Error(`Error executing git command: ${error.message}`));
        return;
      }

      const branches = stdout
        .split('\n')
        .filter((branch) => branch.trim() !== '')
        .map((branch) => {
          const [name, date] = branch.trim().split('|');
          return { name, date };
        });

      resolve(branches);
    });
  });
}

export function filterBranches(branches: GitBranch[], searchTerm: string): GitBranch[] {
  const normalizedSearchTerm = searchTerm.toLowerCase();
  return branches.filter(branch => branch.name.toLowerCase().includes(normalizedSearchTerm));
}