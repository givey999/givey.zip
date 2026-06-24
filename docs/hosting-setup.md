# Hosting setup: givey.zip

givey.zip is static and lives on a single DigitalOcean droplet, served by
**Caddy running natively** (a systemd service — *not* Docker). The same Caddy
also serves `dst.givey.zip` and `omu.givey.zip` from sibling site blocks.

> Historical note: this droplet used to also run **donuttrade** via a Docker
> stack, and earlier versions of this doc described editing donuttrade's
> `Caddyfile.production` + a compose bind-mount. donuttrade has since been
> decommissioned and Docker removed. Caddy now runs natively and its config is
> the plain file `/etc/caddy/Caddyfile` on the droplet (it is **not** checked
> into any repo). Edit that file directly.

Setup is a few one-time changes on the droplet + a recurring deploy via rsync
from this repo.

## 1. DNS

At the domain registrar:

- `A` record: `givey.zip` → droplet IP
- `A` record: `www.givey.zip` → droplet IP

## 2. Droplet filesystem

SSH into the droplet:

```bash
sudo mkdir -p /srv/givey
sudo chown <your-user>:<your-user> /srv/givey
```

## 3. Caddy site block

Edit `/etc/caddy/Caddyfile` on the droplet and add the givey blocks (alongside
the existing `dst.givey.zip` / `omu.givey.zip` blocks):

```caddy
www.givey.zip {
    redir https://givey.zip{uri} permanent
}

givey.zip {
    root * /srv/givey

    # JS/CSS change content but keep the same filename (no build step, no
    # content hashing). Without an explicit directive browsers fall back to
    # heuristic caching and serve stale modules — mobile Safari especially —
    # which is how an old script.js once kept rendering the pre-"see more"
    # projects list on phones. "no-cache" = cache but always revalidate via
    # ETag, so a tiny conditional request returns 304 when unchanged and picks
    # up real changes immediately. (Named matcher, same style as @media below —
    # an inline `/*.html`-style matcher does NOT match the bare `/` homepage.)
    @nocache path *.js *.css
    header @nocache Cache-Control "no-cache"

    file_server
    encode gzip

    @media path *.mp3 *.mp4 *.weba *.webm *.jpg *.jpeg *.png *.gif *.webp *.svg *.ico
    header @media Cache-Control "public, max-age=2592000, immutable"
    header /*.html Cache-Control "public, max-age=60"

    log {
        output stdout
        format console
    }
}
```

Caddy auto-provisions a Let's Encrypt cert for `givey.zip` on first request.

> Known minor gap: `header /*.html` only matches paths ending in `.html`, so the
> bare `/` homepage gets no `Cache-Control` and is cached heuristically. Low
> impact (index.html rarely changes and self-heals). To close it fully, add a
> named matcher: `@html path / *.html` and apply the 60s header to `@html`.

## 4. Apply on the droplet

Validate first (so a malformed edit can't take the site down), then reload
with zero downtime:

```bash
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
```

## 5. Deploy this site

**From PowerShell (Windows — recommended):**

```powershell
.\scripts\deploy.ps1
```

Defaults to `root@167.172.105.211`. Override with env vars if needed:

```powershell
$env:DEPLOY_USER = 'root'; $env:DEPLOY_HOST = '167.172.105.211'; .\scripts\deploy.ps1
```

The script calls `wsl -e rsync` internally — no need to open a WSL shell, but WSL must be installed. The SSH passphrase prompt appears in your PowerShell window. To cache it for the session, run once in WSL beforehand: `eval "$(ssh-agent -s)" && ssh-add`.

**From a WSL / Linux shell:**

```bash
export DEPLOY_USER=root
export DEPLOY_HOST=167.172.105.211
./scripts/deploy.sh
```

After rsync finishes, changes are live immediately — static files served by native Caddy, **no reload needed**.

Then visit `https://givey.zip` — should load with a valid cert.
