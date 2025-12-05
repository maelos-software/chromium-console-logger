# Quick Release Workflow

## Daily Development

1. **Make changes and commit** using conventional commits:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   ```

2. **Push to GitHub**:
   ```bash
   git push
   ```

## Creating a Release

When you're ready to release (after accumulating several commits):

```bash
# Automatic version bump based on commits
npm run release

# Push the release
git push --follow-tags origin main
```

That's it! The version will be automatically determined based on your commit messages:
- `fix:` commits → patch version (1.0.0 → 1.0.1)
- `feat:` commits → minor version (1.0.0 → 1.1.0)
- `feat!:` or `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)

## Manual Version Control

If you want to force a specific version:

```bash
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0
```

## What Happens During Release

1. ✅ Analyzes commits since last release
2. ✅ Determines version bump
3. ✅ Updates `package.json` version
4. ✅ Generates/updates `CHANGELOG.md`
5. ✅ Creates git commit: `chore(release): X.Y.Z`
6. ✅ Creates git tag: `vX.Y.Z`

## Commit Message Cheat Sheet

```bash
# Features (minor bump)
git commit -m "feat: add search to TUI"
git commit -m "feat(cli): add --tabs flag"

# Bug Fixes (patch bump)
git commit -m "fix: resolve connection timeout"
git commit -m "fix(tui): correct alignment issue"

# Breaking Changes (major bump)
git commit -m "feat!: redesign CLI interface"

# Other (no version bump)
git commit -m "docs: update README"
git commit -m "test: add edge case tests"
git commit -m "chore: update dependencies"
```

## Publishing to npm

After creating a release:

```bash
npm publish
```

## View Releases

- GitHub: https://github.com/rmk40/chromium-console-logger/releases
- Tags: `git tag -l`
- Changelog: See `CHANGELOG.md`
