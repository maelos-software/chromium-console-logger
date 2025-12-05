# Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically run checks before commits and pushes.

## Automatic Checks

### Pre-Commit Hook

Runs automatically before every commit:

1. **Lint-Staged** - Formats and lints only staged files:
   - Runs Prettier on `.ts`, `.tsx`, `.mjs`, `.js`, `.json`, `.md` files
   - Runs ESLint with auto-fix on TypeScript/JavaScript files
2. **Type Checking** - Validates TypeScript types:
   - Runs `tsc --noEmit` to check for type errors

**What this means:**

- Your code is automatically formatted before commit
- Linting errors are auto-fixed when possible
- Type errors are caught before commit
- Only staged files are checked (fast!)

### Pre-Push Hook

Runs automatically before every push:

1. **Tests** - Runs the full test suite:
   - All 70 tests must pass
   - Ensures no broken code is pushed

**What this means:**

- Broken code cannot be pushed to remote
- CI failures are caught locally first
- Saves time by catching issues early

## Bypassing Hooks

**Not recommended**, but if you need to bypass hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Skip pre-push hook
git push --no-verify
```

## Manual Checks

You can run the same checks manually:

```bash
# Run all validation checks
npm run validate

# Individual checks
npm run typecheck      # Type checking
npm run lint           # Linting
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format all files
npm run format:check   # Check formatting
npm test               # Run tests
```

## Troubleshooting

### Hook not running

If hooks aren't running, reinstall them:

```bash
npm run prepare
```

### Formatting conflicts

If you get formatting errors:

```bash
# Auto-fix formatting
npm run format

# Then commit again
git add .
git commit -m "your message"
```

### Type errors

Fix type errors before committing:

```bash
# Check types
npm run typecheck

# Fix the errors in your code
# Then commit again
```

### Test failures

Fix failing tests before pushing:

```bash
# Run tests
npm test

# Fix the failing tests
# Then push again
```

## Benefits

✅ **Consistent code style** - All code is automatically formatted  
✅ **Catch errors early** - Type and lint errors caught before commit  
✅ **Prevent broken builds** - Tests run before push  
✅ **Faster CI** - Issues caught locally, not in CI  
✅ **Better code quality** - Automated quality checks

## Configuration

- **Husky config**: `.husky/` directory
- **Lint-staged config**: `package.json` → `lint-staged` field
- **Prettier config**: `.prettierrc.json`
- **ESLint config**: `.eslintrc.json`
- **TypeScript config**: `tsconfig.json`
