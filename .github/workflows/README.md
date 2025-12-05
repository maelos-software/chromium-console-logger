# CI/CD Workflows

## Overview

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push to `main` and on all pull requests.

**Test Job** - Runs on Node.js 16.x, 18.x, and 20.x:
- Type checking with TypeScript
- Linting with ESLint
- Format checking with Prettier
- Unit tests with Jest
- Coverage reporting to Codecov (Node 20.x only)

**Build Job** - Runs after tests pass:
- Builds the project
- Verifies all build artifacts are present

## Local Development

Run the same checks locally before pushing:

```bash
# Run all validation checks
npm run validate

# Or run individually
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Status Badges

Add these to your README.md:

```markdown
![CI](https://github.com/rmk40/chromium-console-logger/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/rmk40/chromium-console-logger/branch/main/graph/badge.svg)](https://codecov.io/gh/rmk40/chromium-console-logger)
```
