# givey.zip — personal bio site design

**Date:** 2026-04-15
**Owner:** givey (bogdan.moldovan@gmail.com)
**Status:** Draft — pending user review

## Overview

A personal bio / link-in-bio website at `givey.zip`, visually inspired by `e-z.bio/givey`. Single-card aesthetic with a theme-pair system (random background video + matching song on each refresh), a splash overlay that unlocks audio on first click, and a secondary `/projects` route that preserves audio playback and background across navigation.

Hosted on the existing DigitalOcean droplet alongside `donuttrade.com`, served as static files by Caddy.

## Goals

- Recreate the e-z.bio aesthetic: dark centered card, blurred/animated background, music player, profile with typing bio.
- Randomized theme pairs: on each full page load, a random `{ background video + song }` pair is applied site-wide.
- Real audio playback that starts after the user clicks `click to join heaven` on the splash overlay.
- `/projects` sub-route that shows a list of projects **without interrupting audio or resetting the background**.
- Simple to extend: adding a new theme = drop a folder + add one line. Adding a project = add one object to an array.
- Deploy on the same droplet as donuttrade with a single new Caddy site block.

## Non-goals

- No authentication, no backend, no database, no build step, no framework.
- No real view counter (fake, session-based).
- No live Discord presence (Lanyard) or live Spotify integration.
- No CMS for projects (hand-edited JS array).
- No mobile-specific redesign beyond responsive layout (the card should still look good on phones, but desktop is the primary target).

## Content

- **Handle:** `givey`
- **Bio:** `wanna be web developer` (typed out with blinking cursor animation)
- **Badges:** verified checkmark next to name
- **Profile picture:** `assets/pfp.jpg`
- **Socials** (URLs loaded from `js/config.js`, all open in new tabs):
  - GitHub (`https://github.com/givey999` — confirm)
  - Instagram (TBD)
  - TikTok (TBD)
  - Roblox (TBD)
  - NameMC (TBD)
  - Discord — rendered as its own card, button opens `https://discord.com/users/934479569539444786`
- **Projects** (initial):
  - `donuttrade.com` — Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL. Links to `https://donuttrade.com`. Thumbnail TBD.

## User flow

1. **First visit / refresh** — full-viewport `#splash` covers everything. Black background. Centered text `click to join heaven` with soft pulse animation. Nothing else is visible or audible.
2. **User clicks anywhere on the splash:**
   - A random theme pair is selected (if not already selected at page load — see "Themes system").
   - Background `<video>` starts playing (was already loaded, muted autoplay blocked until user gesture).
   - `<audio>` element starts playing the theme song.
   - Splash fades out (opacity transition, ~400ms).
   - Home card fades in.
   - Fake view counter increments by 1.
3. **Home route (`/`)** — user sees profile card + Discord card + music player, all stacked centered over the background. Hover tilt + glow on the card stack. Social icons clickable (open new tabs). Discord card button opens Discord profile in a new tab. Music player play/pause controls real audio. Time display shows real `currentTime` / `duration`.
4. **User clicks `see projects →`:**
   - URL updates to `/projects` via `history.pushState` (no page reload).
   - Home section fades out; projects section fades in.
   - Background video keeps playing unchanged.
   - Audio keeps playing unchanged.
   - Music player card stays in its position (it lives outside the route sections).
5. **Projects route (`/projects`)** — projects card in center, wider than home card, same dark style. Header: `projects` + `← back`. Scrollable list of project entries. Each entry clickable → opens project URL in new tab. Music player still visible and functional below.
6. **User clicks `← back` or browser back button** — reverse transition to home. Audio/background untouched.
7. **User refreshes the page** — splash shows again, new random theme pair selected, audio must be re-unlocked by clicking the splash.

## Architecture

### File structure

```
givey.zip/
├── index.html                    # single HTML, both route sections inside
├── css/
│   └── style.css
├── js/
│   ├── script.js                 # main: splash unlock, typing, counter, player wiring
│   ├── router.js                 # SPA router (~20 lines, history.pushState)
│   ├── themes.js                 # themes array + pickRandom()
│   ├── projects.js               # projects array (data only)
│   └── config.js                 # SOCIALS object + any other site config
├── assets/
│   ├── pfp.jpg
│   ├── dunga/
│   │   ├── audio.mp3
│   │   └── video.mp4
│   ├── douji feva/
│   │   ├── audio.mp3
│   │   └── video.mp4
│   └── projects/                 # project thumbnails (TBD)
├── Caddyfile.givey               # new Caddy site block to merge into droplet config
└── docs/superpowers/specs/2026-04-15-givey-bio-site-design.md
```

### DOM structure (inside `index.html`)

```html
<body>
  <video id="background" autoplay muted loop playsinline></video>
  <audio id="player-audio"></audio>

  <div id="splash">
    <span>click to join heaven</span>
  </div>

  <main id="app">
    <section data-route="home">
      <div class="profile-card">...</div>
      <div class="discord-card">...</div>
    </section>

    <section data-route="projects" hidden>
      <div class="projects-card">...</div>
    </section>

    <div class="music-player">...</div>   <!-- outside both sections, always visible -->
  </main>
</body>
```

The `#background`, `#player-audio`, and `.music-player` live **outside** the route sections so the router never touches them. The router only toggles `hidden` on `[data-route]` sections.

### Routing

`js/router.js` responsibilities:
- On click of any element with `[data-route-link="projects"]` or `[data-route-link="home"]`, call `history.pushState({}, '', '/projects' | '/')` and call `showRoute()`.
- `showRoute()` reads `location.pathname`, hides all `[data-route]` sections, shows the matching one.
- Listen for `popstate` and call `showRoute()` (handles browser back/forward).
- On page load, call `showRoute()` once so deep-linking to `/projects` works.

Caddy serves `index.html` for both `/` and `/projects` via `try_files`, so deep links load the same HTML. The router handles which section is visible.

### Themes system

`js/themes.js`:

```js
export const themes = [
  { id: 'dunga',      title: 'DUNGA',      accent: '#ff2a2a' },
  { id: 'douji feva', title: 'douji feva', accent: '#7a2aff' },
]

export function pickRandom() {
  return themes[Math.floor(Math.random() * themes.length)]
}
```

Paths are derived: `assets/${id}/video.mp4` and `assets/${id}/audio.mp3`. No cover art (per user decision).

On page load, `script.js` picks a theme, sets:
- `#background` `src` → `assets/${id}/video.mp4`
- `#player-audio` `src` → `assets/${id}/audio.mp3`
- Music player title text → `title`
- CSS variable `--accent` → `accent` (used throughout stylesheet for glows, badge, highlights)

Adding a theme later = create `assets/<new-id>/` with `audio.mp3` + `video.mp4`, add one object to the themes array. No other code changes.

### Projects system

`js/projects.js`:

```js
export const projects = [
  {
    id: 'donuttrade',
    title: 'donuttrade.com',
    description: 'Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL.',
    thumbnail: 'assets/projects/donuttrade.png',
    url: 'https://donuttrade.com',
  },
]
```

`script.js` iterates this array on page load and renders project entries into the projects card. Adding a project = add one object.

### Config

`js/config.js`:

```js
export const SOCIALS = {
  github:    'https://github.com/givey999',
  instagram: '',
  tiktok:    '',
  roblox:    '',
  namemc:    '',
  discord:   'https://discord.com/users/934479569539444786',
}
```

`script.js` reads this and wires up social icon `href`s. Blank URLs = icon hidden or disabled (decision: hide entirely until filled).

### Splash / audio unlock

The splash overlay exists because browsers block autoplay of audio (and unmuted video) without a user gesture. The `click to join heaven` overlay IS the user gesture.

Click handler on `#splash`:
1. Set `<video>` and `<audio>` `src` attributes (if not already set).
2. `await backgroundVideo.play()` — if it rejects, log and continue (some browsers still allow muted video).
3. `await playerAudio.play()` — this is the one that actually needs the user gesture.
4. Increment fake view counter.
5. Add `.hidden` class to `#splash` (CSS transitions opacity to 0 over ~400ms, then `display: none` via `transitionend`).

### Fake view counter

In-memory counter initialized to a baseline (e.g., a random number between 1000-2000 picked at first load, stored in `sessionStorage` so it persists across route transitions within the same tab session). Increments by 1 when splash is dismissed. Not shared across users or tabs. Purely decorative.

### Component styling notes

- **Dark card style:** `background: rgba(0, 0, 0, 0.65)`, `backdrop-filter: blur(20px)`, `border-radius: 16px`, `border: 1px solid rgba(255,255,255,0.08)`, subtle `box-shadow: 0 20px 60px rgba(0,0,0,0.5)`.
- **Accent-driven glows:** `text-shadow: 0 0 12px var(--accent)` on name, `box-shadow: 0 0 24px var(--accent)` on hover.
- **Hover tilt:** JS-driven, listens to mousemove on the card stack, applies `transform: perspective(1000px) rotateX(...) rotateY(...)` based on cursor position. Subtle (max ~6deg).
- **Typing animation:** JS writes the bio character-by-character over ~1.5s on first home-section entry, then the `|` blinks forever. On re-entering home from projects, the bio is already typed (no re-type).
- **Verified badge:** inline SVG checkmark, accent-colored.

## Hosting & deploy

### Caddy block

New block to add alongside the existing `donuttrade.com` block on the droplet. Either appended to `Caddyfile.production` or kept as a separate file imported by the main Caddyfile.

```
givey.zip {
    root * /srv/givey
    try_files {path} /index.html
    file_server
    encode gzip
    header Cache-Control "public, max-age=3600"

    log {
        output stdout
        format console
    }
}
```

- `try_files {path} /index.html` — SPA fallback. `/` and `/projects` both serve `index.html`.
- Caddy auto-provisions a Let's Encrypt cert for `givey.zip` on standard ports 443/80.
- Large media files (mp4, mp3) are served directly by Caddy's `file_server` — no streaming needed at this scale.

### Droplet filesystem

- Site files live at `/srv/givey/` on the droplet.
- Owner: same user that runs the Caddy container (Docker volume mounted in or copied in at build).
- If Caddy runs inside the donuttrade docker-compose stack, a new bind mount is needed: `/srv/givey:/srv/givey:ro` on the Caddy service.

### DNS

- `A` record for `givey.zip` → droplet IP (handled at registrar, not in this spec).
- No wildcard needed.

### Deploy workflow

Since the site is static, deployment is a file copy. Recommended approach: a small shell script `scripts/deploy.sh` that does `rsync -avz --delete ./ user@droplet:/srv/givey/` (excluding `docs/`, `node_modules/`, etc.). No CI/CD required initially.

Reloading Caddy after adding the new block: `caddy reload` (or restart the Caddy container if using docker-compose).

## Open questions / TBD

These are not blockers for writing the implementation plan but need to be filled in before launch:

1. Social URLs (Instagram, TikTok, Roblox, NameMC) — user will provide, added to `js/config.js`.
2. GitHub URL confirmation — assumed `https://github.com/givey999` from donuttrade CLAUDE.md.
3. Banner strip graphic on the profile card — placeholder until user picks one.
4. Project thumbnails — `assets/projects/donuttrade.png` TBD.
5. Accent color for `douji feva` theme — placeholder `#7a2aff`, user to confirm.

## Out of scope (for a future iteration)

- Mobile-optimized layout beyond basic responsive scaling.
- Real Discord presence via Lanyard API.
- Real Spotify currently-playing integration.
- Real persistent view counter.
- More than one level of routing (e.g., `/projects/donuttrade`).
- Blog / markdown content.
- Analytics.

## Success criteria

- User can load `givey.zip` in a browser, click the splash, hear the song, see the card.
- On each refresh, a different random theme is selected (given 2+ themes configured).
- Clicking `see projects` navigates to `/projects` without resetting audio or background.
- Browser back button returns to home, still no audio interruption.
- Social icons open correct URLs in new tabs.
- Site is accessible at `https://givey.zip` via HTTPS (Caddy-provisioned cert).
- Adding a third theme requires only a new folder + one line in `themes.js`.
- Adding a second project requires only one object in `projects.js`.
