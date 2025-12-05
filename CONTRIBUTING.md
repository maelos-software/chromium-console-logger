# Contributing to Chromium Console Logger

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. **Prerequisites**
   - Node.js 16.x or higher
   - npm 7.x or higher
   - A Chromium-based browser (Chrome, Vivaldi, Brave, Edge) with remote debugging enabled

2. **Clone and Install**

   ```bash
   git clone https://github.com/rmk40/chromium-console-logger.git
   cd chromium-console-logger
   npm install
   ```

   Git hooks are automatically installed and will run checks before commits and pushes.

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Development Workflow

### Automated Git Hooks

This project uses git hooks to automatically check code quality:

- **Pre-commit**: Formats code, runs linting, checks types (only on staged files)
- **Pre-push**: Runs all tests

These run automatically, but you can also run checks manually:

```bash
# Run all validation checks
npm run validate

# Or run individually:
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run format:check # Prettier formatting check
npm test             # Jest tests
```

### Auto-fixing Issues

```bash
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Auto-format with Prettier
```

### Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Building

```bash
npm run build           # Build TypeScript and bundle TUI
```

## Code Style

- **TypeScript**: Use strict type checking
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with TypeScript rules
- **Naming**:
  - camelCase for variables and functions
  - PascalCase for classes and types
  - UPPER_CASE for constants

## Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Use property-based testing (fast-check) for complex logic
- Test edge cases and error conditions
- Mock external dependencies (CDP, file system)

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

**Format:**

```
<type>(<scope>): <subject>
```

**Examples:**

```bash
feat: add search functionality to TUI
fix: resolve connection timeout issue
docs: update installation instructions
refactor: simplify event filtering logic
```

**Types:**

- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Maintenance tasks

**Breaking Changes:**

```bash
feat!: redesign CLI interface

BREAKING CHANGE: Command arguments have changed
```

See [VERSIONING.md](.github/VERSIONING.md) for detailed guidelines.

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation checks (`npm run validate`)
5. Commit your changes with clear messages
6. Push to your fork
7. Open a Pull Request

## CI/CD

All pull requests must pass:

- Type checking (TypeScript)
- Linting (ESLint)
- Formatting (Prettier)
- Tests (Jest)
- Build process

The CI pipeline runs on Node.js 16.x, 18.x, and 20.x.

## Questions?

Feel free to open an issue for questions or discussions.
