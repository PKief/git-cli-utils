<h1 align="center">
  <br>
    <img src="./logo.png" alt="logo" width="200">
  <br><br>
  Git CLI Utils
  <br>
  <br>
</h1>

<h4 align="center">Interactive Git workflows with fuzzy search and smart highlighting</h4>

<p align="center">
  <img src="https://img.shields.io/npm/v/git-cli-utils?color=blue" alt="npm version">
  <img src="https://img.shields.io/npm/dt/git-cli-utils?color=green" alt="downloads">
  <img src="https://img.shields.io/github/license/PKief/git-cli-utils?color=orange" alt="license">
</p>

Fast CLI tools for Git with **real-time search**, **fuzzy matching**, and **keyboard navigation**.

## Features

- 🌿 **Interactive Branch Search** – Find and checkout branches with fuzzy matching
- 🔍 **Commit Explorer** – Search commit history with SHA copying to clipboard
- 👤 **Author Analytics** – Analyze top contributors by file or repository
- ⚡ **Git Aliases** – Setup shortcuts for faster workflows
- ✨ **Smart Highlighting** – Visual feedback for exact and fuzzy matches

## Quick Start

```bash
# Try instantly
npx git-cli-utils search-branches

# Install globally for better performance
npm install -g git-cli-utils
git-utils init  # Setup git aliases
```

> **Performance Tip**: Global installation eliminates npm resolution overhead for faster git aliases.

## Interactive Search in Action

### Commit Search with Highlighting

```bash
git-utils search-commits
```

**Live terminal output:**
```
Search: refactor
Use arrow keys to navigate, Enter to select, Esc to clear search, Ctrl+C to exit

=> 2025-09-26 812973f - refactor: update GitExecutor tests for consistency and clarity
   2025-09-26 269c942 - refactor: format test code for better readability
   2025-09-26 fcba180 - refactor: introduce git executor to bundle git logic
   2025-09-26 e61a6e3 - refactor: simplify header formatting in top-authors command
   2025-09-26 f34fb8a - refactor: remove emoji from console messages for cleaner output
   2025-09-26 e548156 - refactor: update import paths for core modules to relative paths
   2025-09-24 124f2d5 - refactor: replace ANSI utility with color helper functions
   2025-09-24 0452026 - chore: refactor import paths and add ANSI utility for improved UI
   2025-09-18 bf9378d - fix: read version dynamically from package.json instead of hardcoded value
   2025-09-17 d7f16f6 - chore: migrate to Bun native testing framework with TypeScript

↓ More items below
```

**What happens:**
- Type `refactor` → instantly filters to matching commits
- **Exact matches** highlighted with **magenta background**
- **Fuzzy matches** highlighted with **cyan background**
- Selected item shows **green background**
- Press Enter → copies `812973f` to clipboard

### Branch Search Examples

```bash
git-utils search-branches
```

**Exact matching:**
```
Search: feature
=> feature/user-authentication    2 days ago
   feature/payment-integration    5 days ago
   feature/dashboard-redesign     1 week ago
```

**Fuzzy matching:**
```
Search: fdb
=> feature/dashboard-redesign     1 week ago
   fix/dashboard-bug             3 days ago
```
*Matches: **f**eature/**d**ash**b**oard and **f**ix/**d**ash**b**oard*

**Smart ranking:**
```
Search: auth
=> feature/user-authentication    2 days ago    (exact match wins)
   oauth-integration             1 week ago     (fuzzy match)
   feature/author-analytics      2 weeks ago    (fuzzy match)
```

### Author Analytics

```bash
git-utils top-authors
git-utils top-authors src/file.ts  # File-specific analysis
```

```
Search: john
=> John Doe <john@example.com>        42 commits
   Johnny Smith <j.smith@email.com>   38 commits
   Johnson Wilson <wilson@dev.co>     15 commits
```

### Git Aliases Setup

```bash
git-utils init
```

**Interactive setup:**
```
✓ Search Branches → git sb
✓ Search Commits → git sc
✓ Top Authors → git ta

Now use:
  git sb  - Search and checkout branches
  git sc  - Search commits (copies SHA)
  git ta  - View top contributors
```

## All Commands

| Command | Description | Git Alias |
|---------|-------------|-----------|
| `search-branches` | Interactive branch finder with checkout | `git sb` |
| `search-commits` | Interactive commit explorer with SHA copy | `git sc` |
| `top-authors` | Show top contributors by commits | `git ta` |
| `init` | Setup git aliases interactively | - |
| `list-aliases` | Show current git aliases | - |

## Contributing

Found a bug or want a feature? **Contributions welcome!** See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Philipp Kief](https://github.com/PKief)

---

<p align="center">
  <strong>Made for Git productivity</strong><br>
  <a href="https://github.com/PKief/git-cli-utils">Star on GitHub</a> •
  <a href="https://www.npmjs.com/package/git-cli-utils">View on npm</a>
</p>
