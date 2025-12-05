# npm Trusted Publisher Setup

This repository uses npm's Trusted Publisher feature with OpenID Connect (OIDC) for secure, automated publishing.

## What is Trusted Publisher?

Instead of storing long-lived npm tokens as GitHub secrets, Trusted Publisher uses short-lived tokens automatically generated during GitHub Actions workflow runs. This provides:

- **Better security** - No long-lived tokens to manage or leak
- **Provenance** - Cryptographic proof that packages were built by specific GitHub workflows
- **Automation** - Seamless publishing on git tag pushes

## Setup Instructions

### 1. Configure on npm

1. Go to https://www.npmjs.com/package/chromium-console-logger/access
2. Click "Trusted Publisher" section
3. Click "Set up connection"
4. Fill in the form:
   - **Publisher**: GitHub Actions
   - **Organization or user**: `maelos-software`
   - **Repository**: `chromium-console-logger`
   - **Workflow filename**: `publish.yml`
   - **Environment name**: (leave empty - not using environments)
5. Click "Set up connection"

### 2. Verify GitHub Workflow

The workflow is already configured at `.github/workflows/publish.yml` with:

- Proper OIDC permissions (`id-token: write`)
- Provenance attestation (`--provenance` flag)
- Runs on version tags (`v*`)

### 3. Test the Setup

To publish a new version:

```bash
# Create a new release (bumps version, updates CHANGELOG)
npm run release

# Push with tags
git push --follow-tags

# GitHub Actions will automatically publish to npm
```

## How It Works

1. You run `npm run release` locally (creates version bump and git tag)
2. You push with `git push --follow-tags`
3. GitHub Actions detects the new tag
4. Workflow runs validation and build
5. GitHub generates a short-lived OIDC token
6. npm verifies the token and publishes the package
7. Package includes provenance attestation linking it to the GitHub workflow

## Workflow Triggers

The publish workflow triggers on:

- Any tag starting with `v` (e.g., `v1.2.0`, `v2.0.0-beta.1`)

## Security Benefits

- **No secrets in GitHub** - OIDC tokens are generated on-demand
- **Scoped access** - Tokens only work for this specific repo and workflow
- **Audit trail** - npm knows exactly which workflow published each version
- **Provenance** - Users can verify packages came from your GitHub repo

## Manual Publishing

You can still publish manually if needed:

```bash
npm publish
```

But automated publishing via tags is recommended for consistency and security.
