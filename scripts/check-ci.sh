#!/bin/bash
# Check CI status for the current branch

set -e

echo "🔍 Checking CI status..."
echo ""

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch: $BRANCH"
echo ""

# Get latest commit
COMMIT=$(git rev-parse HEAD)
echo "Commit: $COMMIT"
echo ""

# Check workflow runs
echo "Recent workflow runs:"
gh run list --branch "$BRANCH" --limit 5

echo ""
echo "✅ To view details of a run: gh run view <run-id>"
echo "✅ To watch a run: gh run watch <run-id>"
