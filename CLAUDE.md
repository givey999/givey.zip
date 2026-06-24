# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal bio site at `givey.zip`. Visually modeled on `e-z.bio/givey` (the original clone lives at `reference/extracted/` and the exact config is in its `__NEXT_DATA__` JSON). Static HTML + CSS + ESM JavaScript — **no framework, no build step, no bundler**. Every file the browser sees is checked into the repo verbatim.

The original page owner is the same person using this repo. That matters because it means any "wrong" value in the reference (`wanna be web developer`, `click to join heaven`, socials, Discord ID) is intentional content, not a placeholder to change.

## Commands

```bash
npm run dev             # local dev server at http://localhost:8080
                        # via `npx --yes serve@latest -l 8080` — no deps installed
```

**Deploy (Windows — PowerShell):**
```powershell
.\scripts\deploy.ps1    # rsync to the production droplet via WSL
                        # DEPLOY_USER / DEPLOY_HOST env vars optional (defaults: root / 167.172.105.211)
```

**Deploy (Linux / WSL shell):**
```bash
./scripts/deploy.sh     # needs DEPLOY_USER + DEPLOY_HOST env vars
```

> SSH key has a passphrase — run in a real interactive terminal (not Claude's tools). The PowerShell script calls `wsl -e rsync` so no WSL shell needed. After sync, changes are live immediately — static files, native Caddy, no reload needed.

There are **no tests**, no lint config, no typecheck. Verification is visual: open the site locally, click the splash, look at it. When the reference screenshots in `reference/` disagree with what's on screen, the site is wrong.

## Architecture

### One-page, one-URL, no routing

There is a single `/` URL. The "projects page" is not a route — it's the back face of a CSS 3D card flip. The `.card-stack` has `transform-style: preserve-3d`; clicking `see projects →` toggles `.flipped` on it. This is a deliberate choice: it makes the audio and background video naturally seamless across the "navigation" because nothing unmounts.

### Layering pitfall to know about

The `<video id="background">` is `position: fixed`, full-viewport. An early version had it at `z-index: -10` with a body `background: #101013` — the body background rendered on top of the negative-z-index video and the video was invisible ("just stars"). Current fix: `html` carries the fallback color, `body` is transparent, video sits at `z-index: 0`, sparkles canvas at `z-index: 1`, cards at `z-index: 2`, splash at `z-index: 100`. **Don't reintroduce a body background-color or negative z-index on the video.**

### The tilt group

`.card-stack` and `.music-player` live inside a `.tilt-group` wrapper. `tilt.js` attaches one `mousemove` listener to `window` and writes `transform: rotateX(...) rotateY(...)` on the group. `transform-style: preserve-3d` on the group is what lets the card-stack's internal flip keep looking 3D while the group is also rotating. Tilt is clamped to ±6°. The 3D perspective comes from `#app` (the flex parent).

Transitions are scoped: `.tilt-group` has a short `120ms` transition (snappy mouse tracking), `.card-stack` has `0.7s` (flip animation). If you put `0.7s` on the thing tilt is driving, every mousemove interpolates over 700ms and the tilt looks dead — this is the bug that was fixed in commit `72412c7`.

### Module responsibilities

Everything is imported by `js/script.js`. Each module owns one concern:

| File | Responsibility |
|---|---|
| `script.js` | Orchestrator: picks theme, wires splash click, kicks off renderers |
| `themes.js` | Array of 4 theme objects + `pickRandom()` + `themePaths()` (URL-encodes spaces) |
| `projects.js` | Project data (one entry for donuttrade) |
| `config.js` | `SOCIALS` array + `DISCORD_ID` + `BIO_TEXT` |
| `icons.js` | Inline SVG strings keyed by social name, case-insensitive `getIcon()` with `link` fallback |
| `player.js` | Binds play/pause, seek, time, volume to `<audio id="player-audio">` |
| `lanyard.js` | WS client to `wss://api.lanyard.rest/socket`, renders live or static Discord card |
| `flip.js` | Click handler on `[data-flip-to]` — toggles `.flipped` class; adds `.is-flipping` for the 700ms window |
| `tilt.js` | `mousemove` → 3D rotation on whatever element you pass in |
| `sparkles.js` | Canvas animation anchored to a DOM element (currently `.name-row`) |
| `typewriter.js` | Types text char-by-char into an element, loops; returns cancel fn |

### Themes, music, background

Each theme is a folder under `assets/<id>/` containing `audio.mp3` + `video.mp4`. `themes.js` is the single source of truth:

```js
export const themes = [
  { id: 'dunga',           title: 'dunga' },
  { id: 'douji feva',      title: 'douji feva' },
  { id: 'in the darkness', title: 'in the darkness' },
  { id: 'miss the rage',   title: 'miss the rage' },
]
```

On load, `pickRandom()` picks one. `script.js` sets `<video>.src` and `<audio>.src` from `themePaths(theme)` which `encodeURIComponent`s the folder name (spaces → `%20`). The video autoplays muted; audio waits for the splash click because autoplay policy requires a user gesture.

**Adding a theme = drop a folder + one line in `themes.js`.** Everything else — random pick, background swap, song title display — Just Works. Same pattern for projects (`projects.js`) and socials (`config.js`). These three arrays are the public extension points; most "I want to add X" requests should be a one-object change.

### Lanyard

The live Discord presence works only if the Discord user ID (from `config.js`) has joined the Lanyard public server. If not, `lanyard.js` waits 3 seconds for `INIT_STATE`, then falls back to a static card (default avatar, offline dot, "Add on Discord" button). Same fallback after 5 failed WS reconnects. If you see the static fallback in development, that's the expected not-joined-yet state, not a bug.

### Deployment

Hosted on a single DigitalOcean droplet, served by **Caddy running natively** as a systemd service — config is the plain file `/etc/caddy/Caddyfile` on the droplet (not in this repo, not in Docker). The same Caddy also serves `dst.givey.zip` and `omu.givey.zip`. donuttrade used to share this droplet via a Docker stack but has been decommissioned (no more Docker, and `R:\donuttrade` is gone). This repo is pure static content; deploy is `rsync` to `/srv/givey/` on the droplet. Caddy site block, cache headers, and the validate-then-`systemctl reload caddy` flow are documented in `docs/hosting-setup.md`.

## Conventions specific to this repo

- **Commit messages:** no `Co-Authored-By` trailer. Ever. (Feedback given explicitly — see commit `8e5663a` amend for the origin.)
- **Owner email:** `afk.givey@gmail.com`. The Claude Code harness auto-provides a different (protonmail/gmail) address for the user — do not put that in docs, spec frontmatter, or package.json.
- **No new abstractions without a reason.** The codebase is deliberately flat and small: ~10 JS modules, each under 100 lines. Don't introduce a framework, a build step, or a state-management layer. The design doc (`docs/superpowers/specs/2026-04-16-givey-bio-site-design.md`) is the source of truth for architectural decisions.
- **Don't delete `reference/`.** The extracted clone and screenshots in `reference/` are the authority for "does the site look right?" — not something to tidy up.

## Design spec and plan

- Spec: `docs/superpowers/specs/2026-04-16-givey-bio-site-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-16-givey-bio-site-implementation.md`
- Hosting setup: `docs/hosting-setup.md`
