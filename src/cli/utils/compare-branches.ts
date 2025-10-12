import { GitBranch } from '../../core/git/branches.js';
import { GitExecutor } from '../../core/git/executor.js';
import { GitRemoteBranch } from '../../core/git/remotes.js';
import { green, red, yellow } from '../ui/ansi.js';
import { writeErrorLine, writeLine } from './terminal.js';

/**
 * File change information for comparison
 */
interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

/**
 * Commit information for comparison
 */
interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

/**
 * Comparison result between two branches
 */
interface BranchComparison {
  currentBranch: string;
  targetBranch: string;
  commitsAhead: CommitInfo[];
  commitsBehind: CommitInfo[];
  fileChanges: FileChange[];
}

/**
 * Compare currently checked out branch with a selected branch
 * This is a reusable action for both local and remote branches
 */
export async function compareBranches(
  branch: GitBranch | GitRemoteBranch
): Promise<boolean> {
  try {
    // Get current branch
    const currentBranchResult = await GitExecutor.getInstance().executeCommand(
      'git rev-parse --abbrev-ref HEAD'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (currentBranch === 'HEAD') {
      writeErrorLine('Cannot compare: You are in detached HEAD state.');
      return false;
    }

    const targetBranch = 'fullName' in branch ? branch.fullName : branch.name;

    if (currentBranch === branch.name) {
      writeLine(yellow('You are comparing the branch with itself.'));
      return true;
    }

    // Removed verbose "Comparing..." message - results speak for themselves

    // Get comparison data
    const comparison = await getBranchComparison(currentBranch, targetBranch);

    // Display results
    displayComparisonResults(comparison);

    return true;
  } catch (error) {
    writeErrorLine(
      `Error comparing branches: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Get detailed comparison between two branches
 */
async function getBranchComparison(
  currentBranch: string,
  targetBranch: string
): Promise<BranchComparison> {
  // Get commits that are in current branch but not in target (ahead)
  const commitsAhead = await getCommitsBetween(targetBranch, currentBranch);

  // Get commits that are in target branch but not in current (behind)
  const commitsBehind = await getCommitsBetween(currentBranch, targetBranch);

  // Get file changes between branches
  const fileChanges = await getFileChangesBetween(currentBranch, targetBranch);

  return {
    currentBranch,
    targetBranch,
    commitsAhead,
    commitsBehind,
    fileChanges,
  };
}

/**
 * Get commits that exist in 'from' but not in 'to'
 */
async function getCommitsBetween(
  to: string,
  from: string
): Promise<CommitInfo[]> {
  try {
    const result = await GitExecutor.getInstance().executeCommand(
      `git log --oneline --no-merges --format="%h|%s|%an|%cr" ${to}..${from}`
    );

    if (!result.stdout.trim()) {
      return [];
    }

    return result.stdout
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
  } catch {
    return [];
  }
}

/**
 * Get file changes with addition/deletion counts between branches
 */
async function getFileChangesBetween(
  from: string,
  to: string
): Promise<FileChange[]> {
  try {
    // Get file changes with statistics
    const result = await GitExecutor.getInstance().executeCommand(
      `git diff --numstat ${from}..${to}`
    );

    if (!result.stdout.trim()) {
      return [];
    }

    const fileChanges: FileChange[] = [];

    for (const line of result.stdout
      .split('\n')
      .filter((l: string) => l.trim())) {
      const [additions, deletions, path] = line.split('\t');

      // Handle binary files (shown as '-')
      const addCount = additions === '-' ? 0 : parseInt(additions, 10);
      const delCount = deletions === '-' ? 0 : parseInt(deletions, 10);

      // Determine status
      let status: FileChange['status'];
      if (addCount > 0 && delCount === 0) {
        status = 'added';
      } else if (addCount === 0 && delCount > 0) {
        status = 'deleted';
      } else {
        status = 'modified';
      }

      fileChanges.push({
        path,
        additions: addCount,
        deletions: delCount,
        status,
      });
    }

    return fileChanges;
  } catch {
    return [];
  }
}

/**
 * Display formatted comparison results
 */
function displayComparisonResults(comparison: BranchComparison): void {
  const {
    currentBranch,
    targetBranch,
    commitsAhead,
    commitsBehind,
    fileChanges,
  } = comparison;

  // Calculate file change totals
  const totalAdditions = fileChanges.reduce(
    (sum, file) => sum + file.additions,
    0
  );
  const totalDeletions = fileChanges.reduce(
    (sum, file) => sum + file.deletions,
    0
  );

  // Compact header with summary
  writeLine('');
  writeLine(
    yellow(`${currentBranch} ↔ ${targetBranch}: `) +
      `${green(`+${commitsAhead.length}`)} ${red(`-${commitsBehind.length}`)} commits, ` +
      `${fileChanges.length} files ${green(`+${totalAdditions}`)} ${red(`-${totalDeletions}`)}`
  );

  // Show commits ahead (compact format)
  if (commitsAhead.length > 0) {
    writeLine(yellow(`\nAhead (${commitsAhead.length}):`));
    commitsAhead.forEach((commit) => {
      writeLine(`  ${green('+')} ${commit.hash} ${commit.message}`);
    });
  }

  // Show commits behind (compact format)
  if (commitsBehind.length > 0) {
    writeLine(yellow(`\nBehind (${commitsBehind.length}):`));
    commitsBehind.forEach((commit) => {
      writeLine(`  ${red('-')} ${commit.hash} ${commit.message}`);
    });
  }

  // Show file changes (compact format)
  if (fileChanges.length > 0) {
    writeLine(yellow(`\nFiles (${fileChanges.length}):`));
    fileChanges.forEach((file) => {
      const statusSymbol = {
        added: green('+'),
        modified: yellow('~'),
        deleted: red('-'),
        renamed: yellow('→'),
      }[file.status];

      const changes =
        file.additions + file.deletions > 0
          ? ` ${green(`+${file.additions}`)}${red(`-${file.deletions}`)}`
          : '';

      writeLine(`  ${statusSymbol} ${file.path}${changes}`);
    });
  }

  writeLine('');
}
