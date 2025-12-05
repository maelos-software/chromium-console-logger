# Publishing Guide

## Current Status

- ✅ Package published to npm: https://www.npmjs.com/package/chromium-console-logger
- ✅ Version 1.1.1 live
- ✅ GitHub Actions workflow configured (`.github/workflows/publish.yml`)
- ⚠️ npm Trusted Publisher needs verification

## Manual Publishing (Current Method)

```bash
# 1. Create release
npm run release        # or release:minor, release:major, release:patch

# 2. Push with tags
git push --follow-tags

# 3. Publish to npm
npm publish
```

## Automated Publishing (Once Trusted Publisher is Configured)

### Setup Required

1. Go to https://www.npmjs.com/package/chromium-console-logger/access
2. Scroll to "Trusted Publisher" section
3. Verify the connection shows:
   - Publisher: GitHub Actions
   - Organization: maelos-software
   - Repository: chromium-console-logger
   - Workflow: publish.yml

### Once Configured

```bash
# 1. Create release
npm run release

# 2. Push with tags - GitHub Actions will auto-publish
git push --follow-tags
```

The workflow will:

- Run all validation (typecheck, lint, format, tests)
- Build the package
- Publish to npm with provenance attestation
- No manual `npm publish` needed!

## Troubleshooting

If automated publishing fails with "Access token expired":

- Verify Trusted Publisher is fully configured on npm.com
- Check that the workflow file matches the npm configuration exactly
- Ensure the repository and workflow names are correct

## Version History

- v1.0.0 - Initial release
- v1.1.0 - Added automated versioning, git hooks, version display
- v1.1.1 - Added automated npm publishing workflow, fixed README placeholders
