# npm Token Setup for GitHub Actions

## Create npm Access Token

1. Go to https://www.npmjs.com/settings/maelos/tokens (replace 'maelos' with your npm username)
2. Click **"Generate New Token"** → **"Classic Token"**
3. Select **"Automation"** type
4. Name it: `GitHub Actions - chromium-console-logger`
5. Click **"Generate Token"**
6. **Copy the token** (starts with `npm_...`)

## Add Token to GitHub Secrets

### Option 1: Using GitHub CLI (Recommended)

```bash
# Run this command and paste your token when prompted
gh secret set NPM_TOKEN --repo maelos-software/chromium-console-logger
```

### Option 2: Using GitHub Web UI

1. Go to https://github.com/maelos-software/chromium-console-logger/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click **"Add secret"**

## Verify Setup

Once the secret is added, the next time you push a version tag, GitHub Actions will automatically publish to npm:

```bash
npm run release
git push --follow-tags
```

The workflow will:

- ✅ Run all tests and validation
- ✅ Build the package
- ✅ Publish to npm with provenance attestation
- ✅ No manual intervention needed!

## Security Notes

- The token is encrypted and only accessible to GitHub Actions
- It's scoped to automation (publish only)
- You can revoke it anytime from npm settings
- The token never appears in logs or output
