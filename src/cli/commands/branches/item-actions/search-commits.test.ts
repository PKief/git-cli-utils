import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as commitsCommand from '../../commits/index.js';
import { searchBranchCommits } from './search-commits.js';

let mockSearchCommits: ReturnType<typeof spyOn>;

beforeEach(() => {
  mockSearchCommits = spyOn(commitsCommand, 'searchCommits');
});

afterEach(() => {
  mockSearchCommits.mockRestore();
});

describe('searchBranchCommits', () => {
  const mockBranch = {
    name: 'feature/my-feature',
    date: '2 hours ago',
    current: false,
  };

  it('should call searchCommits with the branch name', async () => {
    // Arrange
    mockSearchCommits.mockResolvedValue(undefined);

    // Act
    await searchBranchCommits(mockBranch);

    // Assert
    expect(mockSearchCommits).toHaveBeenCalledWith({
      branch: 'feature/my-feature',
    });
  });

  it('should return success after searchCommits completes', async () => {
    // Arrange
    mockSearchCommits.mockResolvedValue(undefined);

    // Act
    const result = await searchBranchCommits(mockBranch);

    // Assert
    expect(result.success).toBe(true);
  });
});
