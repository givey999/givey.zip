#Requires -Version 5.1
<# Deploy givey.zip to the production droplet via rsync (runs through WSL).
   -DryRun lists what would change without touching the server. #>
param([switch]$DryRun)

$deployUser = if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { 'root' }
$deployHost = if ($env:DEPLOY_HOST) { $env:DEPLOY_HOST } else { '167.172.105.211' }

# Convert Windows path (R:\givey.zip) to WSL mount path (/mnt/r/givey.zip)
$repoRoot   = Split-Path $PSScriptRoot -Parent
$drive      = $repoRoot[0].ToString().ToLower()
$wslPath    = "/mnt/$drive/" + ($repoRoot.Substring(3) -replace '\\', '/')

Write-Host "Deploying $repoRoot -> ${deployUser}@${deployHost}:/srv/givey/"

# ~/.ssh/givey_deploy (in WSL) is passphrase-less but locked server-side to
# `rrsync /srv/givey`, so the remote path is relative to /srv/givey (empty = root).
$flags = if ($DryRun) { '-avzn' } else { '-avz' }
wsl -e rsync $flags --delete `
    -e "ssh -i ~/.ssh/givey_deploy -o IdentitiesOnly=yes -o BatchMode=yes" `
    --exclude='.git' `
    --exclude='docs' `
    --exclude='reference' `
    --exclude='scripts' `
    --exclude='*.zip' `
    --exclude='CLAUDE.md' `
    --exclude='.gitignore' `
    --exclude='node_modules' `
    --exclude='package.json' `
    --exclude='package-lock.json' `
    "$wslPath/" "${deployUser}@${deployHost}:"

if ($LASTEXITCODE -eq 0 -and $DryRun) {
    Write-Host "Dry run only - nothing was changed on the server."
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Changes are live immediately (static files, no Caddy reload needed)."
} else {
    Write-Error "rsync exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
