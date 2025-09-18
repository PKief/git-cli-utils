<h1 align="center">
  <br>
    <img src="./logo.png" alt="logo" width="200">
  <br><br>
  Git CLI Utils
  <br>
  <br>
</h1>

<h4 align="center">Tool to manage Git repositories from the command line</h4>

A collection of command-line utilities for managing Git repositories, focusing on searching branches and commits, as well as initializing and managing Git aliases.

## Features

- **Search Branches**: Quickly find branches in your Git repository using fuzzy matching.
- **Search Commits**: Easily search through your commit history with flexible search options.
- **Initialize Tool**: Set up Git aliases and manage them interactively.
- **Interactive CLI**: User-friendly command-line interface for seamless interaction.

## Installation

You can use this package directly via `npx` or install it globally for better performance:

### Quick Usage (npx)

```bash
npx git-cli-utils search-branches
npx git-cli-utils search-commits
npx git-cli-utils init
```

### Global Installation (Recommended for Performance)

```bash
npm install -g git-cli-utils
```

**Performance Benefits**: Global installation provides significantly faster git alias execution since it avoids the package resolution overhead of `npx`. The tool automatically detects if you have it installed globally and uses the faster method.

After global installation, you can use commands directly:

```bash
git-utils search-branches
git-utils search-commits
git-utils init
```

## Commands

### Search Branches

To search for branches in your Git repository and automatically checkout the selected branch:

```bash
npx git-cli-utils search-branches
```

### Search Commits

To search for commits in your Git repository and copy the commit SHA to clipboard:

```bash
npx git-cli-utils search-commits
```

### Initialize

To initialize the tool and set up Git aliases, use:

```bash
npx git-cli-utils init
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
