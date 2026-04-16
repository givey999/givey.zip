# Hosting setup: givey.zip on the donuttrade droplet

givey.zip is static and lives on the same DigitalOcean droplet as donuttrade,
served by the existing Caddy container. Setup is three one-time changes on the
donuttrade side + a recurring deploy via rsync from this repo.

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

## 3. Caddy site block (in the donuttrade repo, `R:\donuttrade`)

Append to `Caddyfile.production`:

```caddy
givey.zip, www.givey.zip {
    root * /srv/givey
    file_server
    encode gzip

    @media path *.mp4 *.mp3 *.weba *.webm *.jpg *.jpeg *.png *.gif *.webp *.svg
    header @media Cache-Control "public, max-age=2592000, immutable"
    header /*.html Cache-Control "public, max-age=60"

    log {
        output stdout
        format console
    }
}
```

Caddy auto-provisions a Let's Encrypt cert for `givey.zip` on first request.

## 4. Bind-mount in donuttrade's compose file

In `docker-compose.production.yml`, add one line under `caddy.volumes`:

```yaml
  caddy:
    volumes:
      - ./Caddyfile.production:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - /srv/givey:/srv/givey:ro    # ← new
```

## 5. Apply on the droplet

```bash
cd /path/to/donuttrade
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d caddy
# or, if the caddy container is already running:
docker compose -f docker-compose.yml -f docker-compose.production.yml exec caddy caddy reload
```

## 6. Deploy this site

From this repo (`R:\givey.zip`) on your workstation:

```bash
export DEPLOY_USER=<droplet ssh user>
export DEPLOY_HOST=<droplet hostname or IP>
./scripts/deploy.sh
```

Then visit `https://givey.zip` — should load with a valid cert.
