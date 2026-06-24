#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_USER:?set DEPLOY_USER (e.g. root)}"
: "${DEPLOY_HOST:?set DEPLOY_HOST (e.g. droplet IP or hostname)}"

rsync -avz --delete \
  --exclude='.git' \
  --exclude='docs' \
  --exclude='reference' \
  --exclude='scripts' \
  --exclude='*.zip' \
  --exclude='CLAUDE.md' \
  --exclude='.gitignore' \
  --exclude='node_modules' \
  --exclude='package.json' \
  --exclude='package-lock.json' \
  ./ "${DEPLOY_USER}@${DEPLOY_HOST}:/srv/givey/"

echo "✓ deployed to ${DEPLOY_HOST}:/srv/givey/"
echo "  (static files served by native Caddy — no reload needed)"
