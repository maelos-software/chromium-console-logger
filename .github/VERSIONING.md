# Versioning Guide

This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

## Commit Message Format

Use conventional commit messages to enable automatic versioning:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature (triggers MINOR version bump)
- `fix`: A bug fix (triggers PATCH version bump)
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates, etc

### Breaking Changes

Add `BREAKING CHANGE:` in the commit footer or `!` after the type to trigger a MAJOR version bump:

```
feat!: remove deprecated API

BREAKING CHANGE: The old API has been removed
```

## Examples

```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: resolve connection timeout issue"

# Minor release (1.0.0 -> 1.1.0)
git commit -m "feat: add TUI search functionality"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat!: redesign CLI interface

BREAKING CHANGE: Command line arguments have changed"
```

## Creating a Release

### Automatic (Recommended)

Let standard-version determine the version based on commits:

```bash
npm run release
```

This will:
1. Analyze commits since last release
2. Determine version bump (major/minor/patch)
3. Update package.json version
4. Generate/update CHANGELOG.md
5. Create a git commit and tag
6. Push to remote (you need to do this manually)

### Manual Version Bump

Force a specific version bump:

```bash
# Patch: 1.0.0 -> 1.0.1
npm run release:patch

# Minor: 1.0.0 -> 1.1.0
npm run release:minor

# Major: 1.0.0 -> 2.0.0
npm run release:major
```

### First Release

For the first release:

```bash
npm run release -- --first-release
```

## Publishing Workflow

1. **Make changes and commit** using conventional commit format:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

2. **Create release** (when ready):
   ```bash
   npm run release
   ```

3. **Push changes and tags**:
   ```bash
   git push --follow-tags origin main
   ```

4. **Publish to npm** (if desired):
   ```bash
   npm publish
   ```

## Version History

All version changes are tracked in [CHANGELOG.md](../CHANGELOG.md).

## CI/CD Integration

The CI workflow automatically:
- Validates all commits
- Runs tests on multiple Node.js versions
- Builds the project

Consider adding a GitHub Action to automatically create GitHub releases when tags are pushed.

## Tips

- Commit often with clear, conventional messages
- Run `npm run release` when you're ready to publish
- The CHANGELOG is automatically generated from commits
- Use `fix:` for bug fixes, `feat:` for new features
- Add `!` or `BREAKING CHANGE:` for breaking changes
