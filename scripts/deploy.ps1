#Requires -Version 5.1
<# Deploy givey.zip to the production droplet via rsync (runs through WSL). #>

$deployUser = if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { 'root' }
$deployHost = if ($env:DEPLOY_HOST) { $env:DEPLOY_HOST } else { '167.172.105.211' }

# Convert Windows path (R:\givey.zip) to WSL mount path (/mnt/r/givey.zip)
$repoRoot   = Split-Path $PSScriptRoot -Parent
$drive      = $repoRoot[0].ToString().ToLower()
$wslPath    = "/mnt/$drive/" + ($repoRoot.Substring(3) -replace '\\', '/')

Write-Host "Deploying $repoRoot -> ${deployUser}@${deployHost}:/srv/givey/"

wsl -e rsync -avz --delete `
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
    "$wslPath/" "${deployUser}@${deployHost}:/srv/givey/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Changes are live immediately (static files, no Caddy reload needed)."
} else {
    Write-Error "rsync exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
