import { spawn } from 'child_process';

export interface FileAuthor {
  name: string;
  email: string;
  commitCount: number;
  lastCommitHash: string;
  lastCommitDate: string;
}

export interface LastAuthor {
  name: string;
  email: string;
  commitHash: string;
  date: string;
}

/**
 * Get the last author who worked on a specific file
 */
export const getLastAuthor = (filePath: string): Promise<LastAuthor | null> => {
  return new Promise((resolve, reject) => {
    const git = spawn('git', [
      'log',
      '-1',
      '--pretty=format:%an|%ae|%h|%cd',
      '--date=format:%d.%m.%Y %H:%M',
      '--',
      filePath,
    ]);

    let buffer = '';

    git.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
    });

    git.stdout.on('end', () => {
      if (!buffer.trim()) {
        resolve(null);
        return;
      }

      const [name, email, commitHash, date] = buffer.trim().split('|');
      resolve({
        name,
        email,
        commitHash,
        date,
      });
    });

    git.on('error', (error: Error) => {
      reject(error);
    });
  });
};

/**
 * Get authors sorted by their commit count on a specific file
 */
export const getFileAuthors = (filePath?: string): Promise<FileAuthor[]> => {
  return new Promise((resolve, reject) => {
    const args = ['shortlog', '-sne', '--all'];

    if (filePath) {
      args.push('--', filePath);
    }

    const git = spawn('git', args);

    const authors: Map<string, FileAuthor> = new Map();
    let buffer = '';

    git.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line

      lines.forEach((line) => {
        if (!line.trim()) return;

        // Parse format: "     5  John Doe <john.doe@example.com>"
        const match = line.match(/^\s*(\d+)\s+(.+?)\s+<(.+?)>$/);
        if (!match) return;

        const [, countStr, name, email] = match;
        const commitCount = parseInt(countStr, 10);

        authors.set(email, {
          name,
          email,
          commitCount,
          lastCommitHash: '',
          lastCommitDate: '',
        });
      });
    });

    git.stdout.on('end', async () => {
      // Process any remaining buffer content
      if (buffer.trim()) {
        const match = buffer.match(/^\s*(\d+)\s+(.+?)\s+<(.+?)>$/);
        if (match) {
          const [, countStr, name, email] = match;
          const commitCount = parseInt(countStr, 10);

          authors.set(email, {
            name,
            email,
            commitCount,
            lastCommitHash: '',
            lastCommitDate: '',
          });
        }
      }

      // Get last commit info for each author
      const authorList = Array.from(authors.values());

      // Get last commit details for each author
      const promises = authorList.map(async (author) => {
        try {
          const lastCommit = await getLastCommitByAuthor(
            author.email,
            filePath
          );
          return {
            ...author,
            lastCommitHash: lastCommit?.hash || '',
            lastCommitDate: lastCommit?.date || '',
          };
        } catch {
          return author;
        }
      });

      try {
        const authorsWithLastCommit = await Promise.all(promises);
        // Sort by commit count descending
        authorsWithLastCommit.sort((a, b) => b.commitCount - a.commitCount);
        resolve(authorsWithLastCommit);
      } catch (error) {
        reject(error);
      }
    });

    git.on('error', (error: Error) => {
      reject(error);
    });
  });
};

/**
 * Get the last commit by a specific author for a file or repository
 */
const getLastCommitByAuthor = (
  authorEmail: string,
  filePath?: string
): Promise<{ hash: string; date: string } | null> => {
  return new Promise((resolve, reject) => {
    const args = [
      'log',
      '-1',
      '--pretty=format:%h|%cd',
      '--date=format:%d.%m.%Y %H:%M',
      `--author=${authorEmail}`,
    ];

    if (filePath) {
      args.push('--', filePath);
    }

    const git = spawn('git', args);

    let buffer = '';

    git.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
    });

    git.stdout.on('end', () => {
      if (!buffer.trim()) {
        resolve(null);
        return;
      }

      const [hash, date] = buffer.trim().split('|');
      resolve({ hash, date });
    });

    git.on('error', (error: Error) => {
      reject(error);
    });
  });
};
