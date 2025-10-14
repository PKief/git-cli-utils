# Changelog


## v1.16.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.15.0...v1.16.0)

### 🚀 Enhancements

- Add functionality to retrieve existing git alias commands and confirm overrides ([9e1aefc](https://github.com/PKief/git-cli-utils/commit/9e1aefc))
- Enhance editAlias function to validate alias names and handle renaming ([5844e93](https://github.com/PKief/git-cli-utils/commit/5844e93))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.15.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.14.0...v1.15.0)

### 🚀 Enhancements

- Add resetToRemoteBranch action to reset current branch to match remote ([c86d3ca](https://github.com/PKief/git-cli-utils/commit/c86d3ca))
- Add compareBranches utility for comparing local and remote branches ([f5b0e46](https://github.com/PKief/git-cli-utils/commit/f5b0e46))
- Implement alias management commands including create, edit, delete, copy, and execute ([226a545](https://github.com/PKief/git-cli-utils/commit/226a545))

### 🩹 Fixes

- Update remote branch fetching to include commit info and timestamps ([276d99a](https://github.com/PKief/git-cli-utils/commit/276d99a))
- Streamline error messages and improve code formatting in resetToRemoteBranch function ([35f7085](https://github.com/PKief/git-cli-utils/commit/35f7085))
- Add missing line breaks for improved readability in README ([5219ef1](https://github.com/PKief/git-cli-utils/commit/5219ef1))
- Improve worktree management by filtering out the main repository in getGitWorktrees function ([f4a28a1](https://github.com/PKief/git-cli-utils/commit/f4a28a1))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.14.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.13.1...v1.14.0)

### 🚀 Enhancements

- Refactor command registration to use Plugin/Module Pattern for better organization and maintainability ([91b65a6](https://github.com/PKief/git-cli-utils/commit/91b65a6))
- Enhance branch display with relative commit dates in remote branches ([9038979](https://github.com/PKief/git-cli-utils/commit/9038979))

### 🩹 Fixes

- Reorder worktree action in branch commands for improved clarity ([f369879](https://github.com/PKief/git-cli-utils/commit/f369879))
- Reorder command registration for improved structure and clarity ([f5a5da1](https://github.com/PKief/git-cli-utils/commit/f5a5da1))
- Add descriptive header for commit selection and update command description ([8693118](https://github.com/PKief/git-cli-utils/commit/8693118))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.13.1

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.13.0...v1.13.1)

### 🩹 Fixes

- Enhance editor path configuration by normalizing input path ([8d9c71c](https://github.com/PKief/git-cli-utils/commit/8d9c71c))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.13.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.12.1...v1.13.0)

### 🚀 Enhancements

- Add sync command to interactively sync from a remote branch ([b775bbc](https://github.com/PKief/git-cli-utils/commit/b775bbc))
- Add interactive remote management commands and associated actions ([e3c0b1d](https://github.com/PKief/git-cli-utils/commit/e3c0b1d))
- Add 'Sync from Remote' and 'Manage Remotes' commands with descriptions ([eee8cc4](https://github.com/PKief/git-cli-utils/commit/eee8cc4))
- Add 'Set as default' action to set upstream for current branch ([c0756c9](https://github.com/PKief/git-cli-utils/commit/c0756c9))
- Implement 'Add remote' action to allow users to add a new remote repository ([8cdcecc](https://github.com/PKief/git-cli-utils/commit/8cdcecc))
- Add 'Set as upstream' action to set a remote branch as upstream for the current branch ([61b7b8a](https://github.com/PKief/git-cli-utils/commit/61b7b8a))
- Add worktree management and editor configuration ([814b8d0](https://github.com/PKief/git-cli-utils/commit/814b8d0))

### 💅 Refactors

- Simplify interactive list selection highlighting and navigation logic ([64904af](https://github.com/PKief/git-cli-utils/commit/64904af))
- Update getRemoteBranches to use ls-remote for fetching branch info ([ef148ba](https://github.com/PKief/git-cli-utils/commit/ef148ba))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.12.1

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.12.0...v1.12.1)

### 🩹 Fixes

- Add initial and default values for alias input prompts ([6773b83](https://github.com/PKief/git-cli-utils/commit/6773b83))
- Update highlight colors for selected and search text ([9d56c62](https://github.com/PKief/git-cli-utils/commit/9d56c62))
- Change selected item background color to blue in interactive list ([9788273](https://github.com/PKief/git-cli-utils/commit/9788273))
- Update action bar to use subtle colors for selected and non-selected actions ([7d5daae](https://github.com/PKief/git-cli-utils/commit/7d5daae))
- Update README to include demo GIF and remove outdated terminal output ([72450dc](https://github.com/PKief/git-cli-utils/commit/72450dc))
- Update highlight color for selected item in ANSI tests ([7226a6b](https://github.com/PKief/git-cli-utils/commit/7226a6b))
- Update demo gif ([97fd229](https://github.com/PKief/git-cli-utils/commit/97fd229))

### 🏡 Chore

- Update logo ([adc1d8c](https://github.com/PKief/git-cli-utils/commit/adc1d8c))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.12.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.11.0...v1.12.0)

### 🚀 Enhancements

- Add interactive tag selection command to available commands list ([eb39668](https://github.com/PKief/git-cli-utils/commit/eb39668))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.11.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.10.0...v1.11.0)

### 🚀 Enhancements

- Update command aliases and add new stash management commands ([9e7cf63](https://github.com/PKief/git-cli-utils/commit/9e7cf63))
- Add create branch from selected branch functionality ([449e79d](https://github.com/PKief/git-cli-utils/commit/449e79d))
- Add current branch indicator to branch listing ([3bc2b57](https://github.com/PKief/git-cli-utils/commit/3bc2b57))
- Update clearScreen function to preserve command prompt ([bd7ed8a](https://github.com/PKief/git-cli-utils/commit/bd7ed8a))
- Update git log command to use relative date format ([a408e07](https://github.com/PKief/git-cli-utils/commit/a408e07))
- Add tag information display in commits list ([c8c6e04](https://github.com/PKief/git-cli-utils/commit/c8c6e04))
- Implement tag management features including search, checkout, copy, and display details ([eb729f9](https://github.com/PKief/git-cli-utils/commit/eb729f9))
- Update tag display format and enhance branch tests with current status ([8033e92](https://github.com/PKief/git-cli-utils/commit/8033e92))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.10.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.9.0...v1.10.0)

### 🚀 Enhancements

- Implement pager utility for paged content display and enhance commit detail viewing ([447e7ec](https://github.com/PKief/git-cli-utils/commit/447e7ec))
- Add stash management actions for creating and showing stashes ([6932e7f](https://github.com/PKief/git-cli-utils/commit/6932e7f))
- Implement save command to stash current working directory changes ([d2095a5](https://github.com/PKief/git-cli-utils/commit/d2095a5))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.9.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.8.0...v1.9.0)

### 🚀 Enhancements

- Enhance README with interactive command selector and usage examples ([76e2e96](https://github.com/PKief/git-cli-utils/commit/76e2e96))
- Add author timeline functionality to display activity years and commit statistics ([98457da](https://github.com/PKief/git-cli-utils/commit/98457da))
- Add interactive stash selection command with fuzzy search ([831eba1](https://github.com/PKief/git-cli-utils/commit/831eba1))
- Add help command to display information for all commands ([5d51084](https://github.com/PKief/git-cli-utils/commit/5d51084))
- Add commit and stash management commands ([82c417c](https://github.com/PKief/git-cli-utils/commit/82c417c))

### 🩹 Fixes

- Remove duplicate branch checkout messages and improve test reliability by replacing global module mocks with spies ([b6d9139](https://github.com/PKief/git-cli-utils/commit/b6d9139))
- Optimize getFileAuthors to use a single git command for improved performance and data retrieval ([5d34ca8](https://github.com/PKief/git-cli-utils/commit/5d34ca8))
- Remove duplicated clipboard success message in searchCommits ([3b13c9e](https://github.com/PKief/git-cli-utils/commit/3b13c9e))
- Add noUnusedFunctionParameters rule to linter correctness settings ([100d8f1](https://github.com/PKief/git-cli-utils/commit/100d8f1))
- Improve highlighting logic in display text for better search term matching ([b419eaa](https://github.com/PKief/git-cli-utils/commit/b419eaa))
- Refine stash filtering logic by removing date search and updating search criteria ([d90036e](https://github.com/PKief/git-cli-utils/commit/d90036e))
- Restructure stash display format for improved searchability and highlight selected separators ([4c0ccd3](https://github.com/PKief/git-cli-utils/commit/4c0ccd3))
- Enhance highlighting for selected items in display text ([69001be](https://github.com/PKief/git-cli-utils/commit/69001be))
- Improve text highlighting logic and ANSI escape code handling in interactive list ([35705a7](https://github.com/PKief/git-cli-utils/commit/35705a7))

### 💅 Refactors

- Simplify success and error messages across branch and commit actions ([219861d](https://github.com/PKief/git-cli-utils/commit/219861d))

### 📖 Documentation

- Update CONTRIBUTING.md to clarify local testing commands ([40ff9b7](https://github.com/PKief/git-cli-utils/commit/40ff9b7))

### 🏡 Chore

- **deps-dev:** Bump lint-staged from 16.2.1 to 16.2.3 ([#7](https://github.com/PKief/git-cli-utils/pull/7))
- **deps-dev:** Bump typescript from 5.9.2 to 5.9.3 ([#8](https://github.com/PKief/git-cli-utils/pull/8))
- **deps-dev:** Bump @types/node from 24.5.2 to 24.6.1 ([#9](https://github.com/PKief/git-cli-utils/pull/9))
- **deps-dev:** Bump @types/bun from 1.2.22 to 1.2.23 ([#10](https://github.com/PKief/git-cli-utils/pull/10))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.8.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.5...v1.8.0)

### 🚀 Enhancements

- Add list-aliases command to display current git aliases ([19257fa](https://github.com/PKief/git-cli-utils/commit/19257fa))
- Enhance list-aliases command to display aliases interactively ([5c8c1c8](https://github.com/PKief/git-cli-utils/commit/5c8c1c8))
- Add terminal utility functions for consistent stdout handling ([252770d](https://github.com/PKief/git-cli-utils/commit/252770d))
- Implement terminal utility functions for consistent error handling and output ([fedc8c5](https://github.com/PKief/git-cli-utils/commit/fedc8c5))

### 💅 Refactors

- Rename commands from 'search-branches', 'search-commits', and 'top-authors' to 'branches', 'commits', and 'authors' respectively ([a45f2fc](https://github.com/PKief/git-cli-utils/commit/a45f2fc))
- Handle user cancellation gracefully in interactive commands ([e43f8d8](https://github.com/PKief/git-cli-utils/commit/e43f8d8))
- Improve console output handling in interactive list ([67b5b6d](https://github.com/PKief/git-cli-utils/commit/67b5b6d))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.5

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.4...v1.7.5)

### 🩹 Fixes

- Reduce maximum display items from 10 to 7 in interactive list ([bf72f62](https://github.com/PKief/git-cli-utils/commit/bf72f62))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.4

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.3...v1.7.4)

### 🩹 Fixes

- Windows compatibility issue with authors command shell dependencies and quote handling ([#6](https://github.com/PKief/git-cli-utils/pull/6))

### 📖 Documentation

- Improve readme ([18b2993](https://github.com/PKief/git-cli-utils/commit/18b2993))

### ❤️ Contributors

- Copilot ([@MicrosoftCopilot](https://github.com/MicrosoftCopilot))
- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.3

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.2...v1.7.3)

### 🩹 Fixes

- Add missing prepublish script to package.json ([c3a02ac](https://github.com/PKief/git-cli-utils/commit/c3a02ac))

### 📖 Documentation

- Update readme and contributing ([d708854](https://github.com/PKief/git-cli-utils/commit/d708854))
- Improve readme ([b8851b9](https://github.com/PKief/git-cli-utils/commit/b8851b9))

### 🏡 Chore

- Add dependabot configuration ([6ed7bb9](https://github.com/PKief/git-cli-utils/commit/6ed7bb9))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.2

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.1...v1.7.2)

### 💅 Refactors

- Remove emoji from console messages for cleaner output ([f34fb8a](https://github.com/PKief/git-cli-utils/commit/f34fb8a))
- Simplify header formatting in authors command ([e61a6e3](https://github.com/PKief/git-cli-utils/commit/e61a6e3))
- Introduce git executor to bundle git logic ([fcba180](https://github.com/PKief/git-cli-utils/commit/fcba180))
- Format test code for better readability ([269c942](https://github.com/PKief/git-cli-utils/commit/269c942))
- Update GitExecutor tests for consistency and clarity ([812973f](https://github.com/PKief/git-cli-utils/commit/812973f))

### 🏡 Chore

- Update dependencies to latest versions ([2a1da82](https://github.com/PKief/git-cli-utils/commit/2a1da82))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.1

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.7.0...v1.7.1)

### 💅 Refactors

- Update import paths for core modules to relative paths ([e548156](https://github.com/PKief/git-cli-utils/commit/e548156))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.7.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.6.1...v1.7.0)

### 🚀 Enhancements

- Add 'authors' command to display top contributors by commit count ([7e82ba2](https://github.com/PKief/git-cli-utils/commit/7e82ba2))

### 💅 Refactors

- Replace ANSI utility with color helper functions for improved readability ([124f2d5](https://github.com/PKief/git-cli-utils/commit/124f2d5))

### 🏡 Chore

- Refactor import paths and add ANSI utility for improved UI ([0452026](https://github.com/PKief/git-cli-utils/commit/0452026))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.6.1

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.6.0...v1.6.1)

### 🩹 Fixes

- Handle remaining buffer content in getGitCommits function ([8421ad3](https://github.com/PKief/git-cli-utils/commit/8421ad3))

### ❤️ Contributors

- Philipp Kief

## v1.6.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.5.1...v1.6.0)

### 🚀 Enhancements

- Implement search ranking logic and tests ([3568ed7](https://github.com/PKief/git-cli-utils/commit/3568ed7))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.5.1

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.5.0...v1.5.1)

### 🩹 Fixes

- Read version dynamically from package.json instead of hardcoded value ([bf9378d](https://github.com/PKief/git-cli-utils/commit/bf9378d))
- Allow all printable ASCII characters for search input in interactive list ([6c0a169](https://github.com/PKief/git-cli-utils/commit/6c0a169))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.5.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.4.0...v1.5.0)

### 🚀 Enhancements

- Improve search ranking to prioritize recent branches with similar relevance ([#3](https://github.com/PKief/git-cli-utils/pull/3))

### 🩹 Fixes

- Tests with interactive mode ([9cc9d31](https://github.com/PKief/git-cli-utils/commit/9cc9d31))

### 🏡 Chore

- Migrate to Bun native testing framework with TypeScript direct execution and optimized test configuration ([#4](https://github.com/PKief/git-cli-utils/pull/4))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))
- Copilot ([@MicrosoftCopilot](https://github.com/MicrosoftCopilot))

## v1.4.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.3.0...v1.4.0)

### 🚀 Enhancements

- Update npm ignore ([3adf90a](https://github.com/PKief/git-cli-utils/commit/3adf90a))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.3.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- Update package json ([d6db6da](https://github.com/PKief/git-cli-utils/commit/d6db6da))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.2.0

[compare changes](https://github.com/PKief/git-cli-utils/compare/v1.1.0...v1.2.0)

### 🚀 Enhancements

- Update meta ([db88d4b](https://github.com/PKief/git-cli-utils/commit/db88d4b))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

## v1.1.0


### 🚀 Enhancements

- Initial commit ([d9f5241](https://github.com/PKief/git-cli-utils/commit/d9f5241))
- Add additional tooling ([2d06f8c](https://github.com/PKief/git-cli-utils/commit/2d06f8c))
- Format code ([3ebce50](https://github.com/PKief/git-cli-utils/commit/3ebce50))
- Add husky ([92292e7](https://github.com/PKief/git-cli-utils/commit/92292e7))
- Update start script to use bun and refactor test scripts ([a9e59c8](https://github.com/PKief/git-cli-utils/commit/a9e59c8))
- Implement code changes to enhance functionality and improve performance ([7b4ff5d](https://github.com/PKief/git-cli-utils/commit/7b4ff5d))

### 🏡 Chore

- Remove shebang from index.ts ([d8d82b4](https://github.com/PKief/git-cli-utils/commit/d8d82b4))

### ❤️ Contributors

- Philipp Kief ([@PKief](https://github.com/PKief))

