# givey.zip

Personal bio site at [givey.zip](https://givey.zip). Static HTML + CSS + ESM JavaScript — no framework, no build step, no bundler.

## Features

- **Random themes** — each page load picks a random background video + music pair
- **Card flip** — profile flips right to projects, left to crypto addresses (CSS 3D, no routing)
- **3D tilt** — card stack and music player rotate together following the cursor
- **Sparkles** — ambient particles around the name + cursor trail particles
- **Custom cursor** — PNG cursor following the mouse
- **Music player** — play/pause, seek, volume, synced to the theme
- **Live Discord presence** — via Lanyard WebSocket (avatar, status, activity)
- **Click-to-copy crypto addresses**

## Run locally

```bash
npm run dev
```

Opens at [http://localhost:8080](http://localhost:8080). No dependencies to install.

## Deploy

```bash
DEPLOY_USER=your-user DEPLOY_HOST=your-host ./scripts/deploy.sh
```

See [docs/hosting-setup.md](docs/hosting-setup.md) for full droplet/Caddy/DNS setup.

## Adding content

**Theme** — drop `audio.mp3` + `video.mp4` into `assets/<name>/`, add one line to `js/themes.js`.

**Project** — add an object to the array in `js/projects.js`.

**Social** — add to `SOCIALS` in `js/config.js`. If the icon doesn't exist in `js/icons.js`, it falls back to a link icon.

**Crypto address** — add to `CRYPTO` in `js/config.js`.

## License

[CC BY-NC 4.0](LICENSE) — attribution required, no commercial use. Applies only to original code and design; third-party music, video, and banner assets are not covered.
