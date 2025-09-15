# git-cli-utils

A collection of command-line utilities for managing Git repositories, focusing on searching branches and commits, as well as initializing and managing Git aliases.

## Features

- **Search Branches**: Quickly find branches in your Git repository using fuzzy matching.
- **Search Commits**: Easily search through your commit history with flexible search options.
- **Initialize Tool**: Set up Git aliases and manage them interactively.
- **Interactive CLI**: User-friendly command-line interface for seamless interaction.

## Installation

You can use this package directly via `npx` without needing to install it globally:

```bash
npx git-cli-utils
```

## Commands

### Search Branches

To search for branches in your Git repository and automatically checkout the selected branch:

```bash
npx git-cli-utils search-branches
```

🌿 **New**: After selecting a branch, it will automatically be checked out and the process exits cleanly.  
🔍 **Search**: Only searches branch names (not timestamps) with visual highlighting of matches.

### Search Commits

To search for commits in your Git repository and copy the commit SHA to clipboard:

```bash
npx git-cli-utils search-commits
```

📋 **New**: After selecting a commit, its SHA will be copied to your clipboard and the process exits cleanly.  
🔍 **Search**: Searches commit hashes and subjects (not timestamps) with visual highlighting of matches.

### Initialize

To initialize the tool and set up Git aliases, use:

```bash
npx git-cli-utils init
```

## Usage

1. **Search Branches**: Filter branches with fuzzy matching and automatically checkout the selected branch. The process exits after checkout for a clean return to your terminal.

2. **Search Commits**: Filter through commits with fuzzy matching and copy the selected commit's SHA to your clipboard. Perfect for quickly grabbing commit hashes for other git operations.

3. **Initialize**: Set up custom Git aliases for quick access to the utilities. Choose which commands to alias and customize the alias names.

### Key Features

- 🔍 **Smart Search**: Search only matches branch names and commit content (not timestamps)
- 🎨 **Visual Highlighting**: Matching text highlighted with yellow background
- 🌿 **Auto Checkout**: Branch selection immediately checks out the branch  
- 📋 **Clipboard Integration**: Commit SHA automatically copied to clipboard
- 🚪 **Clean Exit**: Commands exit after action, returning you to normal terminal
- ⚡ **Fast Performance**: Optimized for quick git operations
- 🎯 **Fuzzy Matching**: Intelligent matching that ignores separators and finds partial matches

## Testing

The project includes comprehensive end-to-end testing infrastructure:

### Run All Tests
```bash
npm run test:e2e          # Full e2e test suite (100% pass rate)
npm run test:ci           # CI-friendly tests (100% pass rate)
npm run test              # Core functionality tests
```

### Test Coverage
- ✅ CLI help and version commands
- ✅ Git integration (branches, commits, aliases)  
- ✅ Performance benchmarks (startup time < 3s, response time < 1s)
- ✅ Error handling and edge cases
- ✅ Interactive terminal features (with non-interactive fallback)

See `/src/e2e/README.md` for detailed testing documentation.

## Platform Support

### Clipboard Functionality
- ✅ **macOS**: Uses `pbcopy` 
- ✅ **Linux**: Uses `xclip` or `xsel` (install with `apt install xclip` or `apt install xsel`)
- ✅ **Windows**: Uses `clip`

### Git Operations
- ✅ **All platforms**: Standard git commands work everywhere

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.