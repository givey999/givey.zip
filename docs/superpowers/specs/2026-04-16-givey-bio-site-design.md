# givey.zip — bio site design (v2)

**Date:** 2026-04-16
**Owner:** givey (afk.givey@gmail.com)
**Status:** Draft — pending user review
**Supersedes:** `docs/superpowers/specs/2026-04-15-givey-bio-site-design.md` (v1 — visual execution missed the mark; this rebuild is anchored directly to the cloned source of `e-z.bio/givey` extracted in `reference/extracted/`)

## Overview

A personal bio site at `givey.zip`. Visual and behavioral clone of `e-z.bio/givey`, rebuilt as a standalone static site on the existing donuttrade DigitalOcean droplet. Keeps every effect from the original (Mali font, `#74000e` accent, card blur, glow, tilt, typewriter bio, ambient sparkles, sparkle cursor), with one intentional divergence: the **background video and music are picked randomly as a pair on each page load** from a user-controlled themes folder, instead of being fixed.

A second "projects" view is reachable via a 3D card flip animation — **no URL change, no page navigation** — so the background video and music play seamlessly through the flip with zero reload.

## Goals

- Pixel-faithful reproduction of the original `e-z.bio/givey` card stack: splash → profile card + Discord presence card + music player.
- Random `{ background video, song }` pair on each full page load, driven by folders under `assets/<theme>/`.
- Seamless "projects" view via in-place card flip (same page, no route change, audio never pauses).
- Live Discord presence via Lanyard WebSocket (status, avatar, activity, "Add on Discord" button).
- Extension points for non-developers: add a theme = drop a folder; add a project = add one object to an array; add a social = add one entry to a list.
- Hosted on the existing donuttrade droplet, served as static files by the existing Caddy container.

## Non-goals

- No framework, no build step, no bundler. Plain HTML + CSS + ESM JavaScript.
- No backend, no database, no authentication.
- No analytics, no view counter (original has `showViews: false`).
- No multiple URL routes (no `/projects` path — projects live on the same page behind a card flip).
- No live Spotify integration. No real-time status sources beyond Lanyard.
- No CMS for projects — hand-edited JS array is the feature, not a limitation.

## Ground truth — source of the clone

Everything visual in this spec derives from `reference/extracted/e-z.bio/givey.html` (the static export of the real page, containing the full `__NEXT_DATA__` config JSON) and the two reference screenshots in `reference/`. Values below are taken directly from that JSON unless marked otherwise.

## User flow

1. **Page load** — a random theme is chosen from `themes.js`. `<video id="background">` is pointed at `assets/<theme>/video.mp4` and autoplays muted (allowed by autoplay policy). `<audio id="player-audio">` is pointed at `assets/<theme>/audio.mp3` but does NOT play. `#splash` covers the viewport: dim overlay + "click to join heaven" text, pulsing softly.
2. **User clicks the splash** — `<audio>.play()` starts the song (this click is the required user gesture for audio). Splash fades out over ~400ms, the card stack fades in, sparkles start, the bio begins typing.
3. **Home view (front of the card stack)** — user sees the profile card (banner gif, circular pfp, name "givey", typewriter bio, social icon row), Discord presence card directly below, and the music player card below that. Hover tilt on the stack. "see projects →" link at the bottom of the profile card.
4. **User clicks "see projects →"** — the card stack rotates 180° on the Y axis over ~700ms. The front face (profile + discord) hides, the back face (projects list) shows. Music player card stays visible and keeps playing throughout — it lives outside the flipping stack. Background video and audio are untouched.
5. **Projects view (back of the card stack)** — list of projects with a "← back" link in the header. Each project is a clickable tile opening its URL in a new tab.
6. **User clicks "← back"** — reverse flip (180° back to 0°), profile/Discord re-appear. Music/background never interrupted.
7. **Refresh** — new random theme, splash again, audio re-unlocked on click.

## Architecture

### Layer diagram

```
┌─ Fixed, full-viewport ───────────────────────────┐
│  <video id="background">        (muted, looping) │
│  overlay: rgba(0,0,0,0.6)       (dims video)     │
├─ Pointer-events: none, absolute ─────────────────┤
│  sparkles canvas                                 │
│  cursor trail layer                              │
├─ Centered flex column ───────────────────────────┤
│  <main id="app">                                 │
│    .card-stack  (3D flip container)              │
│      .face.front                                 │
│        .profile-card                             │
│        .discord-card                             │
│      .face.back                                  │
│        .projects-card                            │
│    .music-player                                 │
├──────────────────────────────────────────────────┤
│  #splash  (overlay — dismissed on click)         │
└──────────────────────────────────────────────────┘
<audio id="player-audio">  (hidden, persistent)
```

The `<video>`, `<audio>`, and `.music-player` sit **outside** `.card-stack` so the flip never touches them.

### File structure

```
givey.zip/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── script.js         # entry — orchestrates splash, theme pick, typewriter, wiring
│   ├── themes.js         # themes array + pickRandom()
│   ├── projects.js       # projects array (data only)
│   ├── config.js         # SOCIALS array + DISCORD_ID
│   ├── icons.js          # inline SVG map keyed by social name
│   ├── player.js         # audio player controls + progress updates
│   ├── lanyard.js        # Lanyard WS client + presence card renderer
│   ├── flip.js           # card flip toggle
│   ├── tilt.js           # mousemove tilt effect
│   ├── sparkles.js       # ambient sparkles + cursor trail
│   └── typewriter.js     # bio typing effect
├── assets/
│   ├── pfp.jpg
│   ├── banner.gif
│   ├── dunga/{audio.mp3,video.mp4}
│   ├── douji feva/{audio.mp3,video.mp4}
│   ├── in the darkness/{audio.mp3,video.mp4}
│   └── miss the rage/{audio.mp3,video.mp4}
├── scripts/
│   └── deploy.sh
├── CLAUDE.md
├── docs/superpowers/
│   ├── specs/2026-04-16-givey-bio-site-design.md   (this file)
│   └── plans/2026-04-16-givey-bio-site-implementation.md
└── reference/            (local-only — original site clone, gitignored, not deployed)
```

### DOM (inside `index.html`)

```html
<body>
  <video id="background" autoplay muted loop playsinline></video>
  <div class="background-dim"></div>
  <canvas class="sparkles" aria-hidden="true"></canvas>

  <audio id="player-audio" preload="auto"></audio>

  <main id="app" hidden>
    <div class="card-stack">
      <div class="face front">
        <section class="profile-card">
          <div class="banner" style="background-image: url('assets/banner.gif')"></div>
          <img class="pfp" src="assets/pfp.jpg" alt="givey" />
          <div class="name-row">
            <span class="name">givey</span>
          </div>
          <div class="bio"><span class="bio-text"></span><span class="cursor">|</span></div>
          <div class="socials"><!-- rendered from SOCIALS --></div>
          <a class="flip-link" data-flip-to="back">see projects →</a>
        </section>

        <section class="discord-card"><!-- rendered from Lanyard --></section>
      </div>

      <div class="face back">
        <section class="projects-card">
          <header class="projects-header">
            <span class="projects-title">projects</span>
            <a class="flip-link" data-flip-to="front">← back</a>
          </header>
          <div class="projects-list"><!-- rendered from projects.js --></div>
        </section>
      </div>
    </div>

    <section class="music-player"><!-- rendered from player.js --></section>
  </main>

  <div id="splash">
    <span class="splash-text">click to join heaven</span>
  </div>

  <script type="module" src="js/script.js"></script>
</body>
```

### Module responsibilities

| Module | Responsibility | Exports |
|---|---|---|
| `script.js` | Entry. Picks theme, sets background + audio src, wires splash click, kicks off typewriter, calls renderers, connects Lanyard, starts sparkles/tilt. | — |
| `themes.js` | Declarative themes list. Path derivation. | `themes`, `pickRandom()` |
| `projects.js` | Declarative projects list. | `projects` |
| `config.js` | Socials list + Discord user ID. | `SOCIALS`, `DISCORD_ID` |
| `icons.js` | Inline SVG string per social name (case-insensitive lookup). | `ICONS`, `getIcon(name)` |
| `player.js` | Binds play/pause, progress, seek, time display, volume to the `<audio>` element. Renders `.music-player` inner HTML. | `initPlayer(audioEl, title)` |
| `lanyard.js` | Opens Lanyard WS, subscribes to `DISCORD_ID`, re-renders `.discord-card` on `INIT_STATE` / `PRESENCE_UPDATE`. Auto-reconnect with backoff. Falls back to a static avatar + name + "Add on Discord" button card if the socket errors or returns no data within 3s. | `initDiscord(cardEl, userId)` |
| `flip.js` | Click handler on `[data-flip-to]`. Toggles `.flipped` class on `.card-stack`. | `initFlip(stackEl)` |
| `tilt.js` | `mousemove` on `.card-stack` → `transform: perspective(1000px) rotateX rotateY`. Skipped while `.card-stack.is-flipping` is set (added on flip click, removed on `transitionend`). Max ±6°. Composes with `.flipped`: the tilt and flip transforms multiply via CSS, so the tilt tracks whichever face is visible. | `initTilt(stackEl)` |
| `sparkles.js` | Canvas animation: ambient white 4-point sparkles drifting up; additional sparkles spawned at cursor on `mousemove`. | `initSparkles(canvasEl)` |
| `typewriter.js` | Types `bio` text into `.bio-text` char-by-char (~60ms/char), pauses, erases, retypes (typeOnce: false in original config). | `initTypewriter(el, text)` |

### Theme system

`js/themes.js`:

```js
export const themes = [
  { id: 'dunga',           title: 'dunga' },
  { id: 'douji feva',      title: 'douji feva' },
  { id: 'in the darkness', title: 'in the darkness' },
  { id: 'miss the rage',   title: 'miss the rage' },
]

export function pickRandom() {
  return themes[Math.floor(Math.random() * themes.length)]
}
```

Paths are derived: `assets/${encodeURIComponent(id)}/video.mp4`, `assets/${encodeURIComponent(id)}/audio.mp3`. `encodeURIComponent` handles the space in `douji feva`, `in the darkness`, `miss the rage`.

**Adding a theme later**: create `assets/<new-id>/` containing `audio.mp3` + `video.mp4`, add one object to the themes array. Nothing else changes.

### Splash / autoplay unlock

Browsers block unmuted audio without a user gesture. The splash click IS the gesture.

On DOMContentLoaded:
1. Pick random theme.
2. `video.src = ...; video.play()` — muted autoplay, allowed everywhere.
3. `audio.src = ...; audio.load()` — preloads but does not play.

On splash click:
1. `await audio.play()`.
2. Add `.hidden` class to `#splash` (opacity → 0, 400ms, then `display: none` on `transitionend`).
3. Remove `hidden` attr on `#app`; add `.visible` class for fade-in.
4. Start typewriter, start sparkles, init tilt, init flip, init Lanyard.

Handling audio.play() rejection: log warning, leave splash visible, let the user click again. This is a browser quirk, not a bug.

### Card flip

`.card-stack` has `transform-style: preserve-3d` and a CSS transition on `transform`. The two `.face` elements are absolutely positioned with `backface-visibility: hidden`; the back face is pre-rotated 180° so it faces away until the stack flips.

```css
.card-stack { transform-style: preserve-3d; transition: transform 0.7s ease-in-out; }
.card-stack.flipped { transform: rotateY(180deg); }
.face { position: absolute; inset: 0; backface-visibility: hidden; }
.face.back { transform: rotateY(180deg); }
```

`flip.js` listens on the stack for clicks matching `[data-flip-to]`, then toggles `.flipped`. No state machine needed — the DOM + CSS carries the state.

**Height**: because both faces are absolute, the stack needs an explicit `min-height`. Set it to the taller face's natural height. Simple approach: measure both faces' scrollHeight on first render and set `stack.style.minHeight = Math.max(...)`.

### Lanyard integration

- Endpoint: `wss://api.lanyard.rest/socket`
- Opcodes: `0` heartbeat, `1` initialize (send `{op:2, d:{subscribe_to_id: DISCORD_ID}}`), `3` heartbeat-ack
- Events received: `INIT_STATE` (first snapshot), `PRESENCE_UPDATE` (every change)
- Heartbeat every `hello.d.heartbeat_interval` ms (opcode 3)
- Reconnect: on close, wait `min(1000 * 2^attempts, 30000)` ms, attempts capped at 5. After 5 failed reconnects, stop trying and leave the static fallback card rendered.
- Fallback: if no `INIT_STATE` within 3s OR the socket permanently fails, render the static card (avatar from stored URL if we have one, tag "givey", dim "offline" dot, "Add on Discord" button). When a later successful connect delivers `INIT_STATE`, replace the static card with the live one.

Fields rendered from Lanyard data:
- `discord_user.avatar` hash → `https://cdn.discordapp.com/avatars/${id}/${hash}.webp`
- `discord_user.username` and `discord_user.display_name` → "givey"
- `discord_status` → status dot color (`online` green `#23a55a`, `idle` yellow `#f0b232`, `dnd` red `#f23f43`, `offline` gray `#80848e`)
- `activities[0]` → first row: Spotify shows "🎵 listening to X by Y", custom status shows the text + emoji, game shows "playing X"
- Always-rendered "Add on Discord" button → `https://discord.com/users/934479569539444786`

### Music player

Rendered inner HTML (created by `player.js`):

```html
<div class="song-title">dunga</div>
<div class="player-controls">
  <button class="play-pause" aria-label="play/pause">▶</button>
  <div class="progress-wrap"><div class="progress-bar"></div></div>
  <div class="time-display">0:00 / 0:00</div>
  <button class="volume-toggle" aria-label="mute">🔊</button>
</div>
```

Events:
- Click play/pause → `audio.paused ? audio.play() : audio.pause()`; button text toggles `▶ / ⏸`.
- `audio.timeupdate` → update `.progress-bar` width and time display.
- `audio.loadedmetadata` → populate total duration in time display.
- Click/drag on `.progress-wrap` → `audio.currentTime = (clickX / rect.width) * audio.duration`.
- Click volume-toggle → `audio.muted = !audio.muted`; button text toggles `🔊 / 🔇`.

No next/prev buttons. Theme changes only on page refresh.

### Content — locked values

```js
// config.js
export const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com/afk.luca/' },
  { name: 'Steam',     url: 'https://steamcommunity.com/id/givey02/' },
  { name: 'Shop',      url: 'https://www.acbuy.com/login?loginStatus=register&code=VF6GLN' },
  // Planned additions (add when URLs are ready):
  // { name: 'Roblox', url: '...' },
  // { name: 'NameMC', url: '...' },
]

export const DISCORD_ID = '934479569539444786'
```

```js
// projects.js
export const projects = [
  {
    id: 'donuttrade',
    title: 'donuttrade.com',
    description: 'Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL.',
    url: 'https://donuttrade.com',
    thumbnail: null,   // optional — set to 'assets/projects/donuttrade.png' when provided
  },
]
```

Display copy:
- Name: `givey`
- Bio (typewriter): `wanna be web developer`
- Splash: `click to join heaven`
- Tab title: `givey` (the original has an animated title scroll — skipped; not worth the complexity and many browsers restrict it)

### Icons

`js/icons.js` — inline SVG strings, keyed by lowercased social name. Initially seeded with:
- `instagram`
- `steam`
- `shop` (shopping bag glyph)
- `roblox` (ready to use when URL is added)
- `namemc` (ready to use when URL is added)
- `link` (fallback for any unknown name)

All icons use `fill="currentColor"` so they inherit the text color (white, per `iconcolor: #ffffff`). Sized via CSS (`width: 20px; height: 20px`).

## Styling

### Design tokens (CSS variables)

```css
:root {
  --bg: #101013;
  --accent: #74000e;
  --fg: #ffffff;
  --card-bg: rgba(0, 0, 0, 0.6);
  --card-blur: 10px;
  --card-border: rgba(255, 255, 255, 0.08);
  --border-width: 2px;
  --border-radius: 0.3rem;
  --glow: 0 0 24px var(--accent);
  --font: "Mali", -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Card style (applies to `.profile-card`, `.discord-card`, `.projects-card`, `.music-player`)

```css
background: var(--card-bg);
backdrop-filter: blur(var(--card-blur));
-webkit-backdrop-filter: blur(var(--card-blur));
border: var(--border-width) solid var(--card-border);
border-radius: var(--border-radius);
box-shadow: var(--glow);
color: var(--fg);
```

On `:hover`, the box-shadow intensifies: `box-shadow: 0 0 36px var(--accent)`.

### Selection

```css
::selection { background: var(--bg); color: var(--accent); }
```

### Splash

Already styled in existing `css/style.css`. Will be tweaked to use the new tokens (font → Mali, accent color on the text shadow for a red glow matching the rest of the site).

### Responsive

Primary target: desktop (reference screenshots are desktop). Scaling strategy:
- Card stack: `max-width: 360px`, `width: calc(100% - 32px)`.
- At `< 480px`: social icon row wraps; music player stacks controls vertically if tight; banner height reduces from 100px → 70px.
- No mobile-specific redesign beyond this.

## Hosting

### On the droplet

givey.zip is static. It slots into the **existing Caddy container** that already serves `donuttrade.com`.

Changes required in the donuttrade repo (`R:\donuttrade`):

1. **Append to `Caddyfile.production`**:
   ```caddy
   givey.zip, www.givey.zip {
       root * /srv/givey
       file_server
       encode gzip

       @media path *.mp4 *.mp3 *.weba *.webm *.jpg *.jpeg *.png *.gif *.webp *.svg
       header @media Cache-Control "public, max-age=2592000, immutable"
       header /*.html Cache-Control "public, max-age=60"

       log { output stdout; format console }
   }
   ```
   Caddy auto-provisions Let's Encrypt for `givey.zip`.

2. **Add one line** to the `caddy.volumes` block in `docker-compose.production.yml`:
   ```yaml
   - /srv/givey:/srv/givey:ro
   ```

3. **Reload Caddy**: `docker compose exec caddy caddy reload` (first time after adding the block).

### DNS

- `A` record: `givey.zip` → droplet IP
- `A` record: `www.givey.zip` → droplet IP (the Caddy block handles both)

Done at the registrar. Outside this repo.

### Deploy

`scripts/deploy.sh`:
```bash
#!/bin/bash
set -e
rsync -avz --delete \
  --exclude='.git' --exclude='docs' --exclude='reference' \
  --exclude='scripts' --exclude='*.zip' --exclude='CLAUDE.md' \
  --exclude='.gitignore' \
  ./ "${DEPLOY_USER}@${DEPLOY_HOST}:/srv/givey/"
```

Config via env: `DEPLOY_USER`, `DEPLOY_HOST`. No CI required initially; run the script locally.

## Future extensions (easy paths, not part of initial build)

- Add more themes → drop folder + add one line in `themes.js`.
- Add more projects → add one object to `projects.js`.
- Add more socials → add one entry to `SOCIALS` in `config.js` (`icons.js` already seeded for Roblox and NameMC).
- Project thumbnails → set `thumbnail` to an asset path on the project object; the renderer already checks for it.
- Dynamic badges (e.g., "HypeSquad Balance" from Discord) → extend `lanyard.js` renderer to read `bio_presence.badges`.

## Success criteria

- Loading `givey.zip` shows the splash. Clicking it starts audio and reveals the card stack.
- Refreshing gives a different theme (randomized from 4 pairs).
- The background video matches the currently playing song (from the same folder).
- Card flip to "projects" keeps audio and background playing, no glitch.
- Lanyard WS connects and shows live Discord status (once user has joined the Lanyard Discord server).
- If Lanyard has no data, a static fallback Discord card still renders.
- Social icons open correct URLs in new tabs.
- Site is reachable at `https://givey.zip` with a valid Let's Encrypt cert.
- Adding a 5th theme requires only a new folder + one new line in `themes.js`.
- Adding a 2nd project requires only one new object in `projects.js`.

## Open questions

None at time of writing. All content, colors, fonts, behaviors confirmed with user during brainstorming. Project thumbnails are optional and can be added later without schema changes.
