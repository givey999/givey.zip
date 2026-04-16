# givey.zip Bio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static bio site at `givey.zip` that clones the look and effects of `e-z.bio/givey` with 4 random background+music theme pairs, a card-flip projects view, and live Discord presence, deployed alongside donuttrade on the existing DigitalOcean droplet.

**Architecture:** Single `index.html`, vanilla ESM JavaScript, no framework, no build step. One 3D card stack with CSS flip: front = profile + Discord cards, back = projects. `<audio>`, `<video>`, and the music player live outside the flipping stack so audio and background play uninterrupted through the rotation. Static files served by the existing Caddy container via a new site block + bind mount.

**Tech Stack:** Plain HTML + CSS3 (3D transforms, backdrop-filter, custom properties) + ESM JavaScript. Google Fonts (Mali). Lanyard WebSocket API (`wss://api.lanyard.rest/socket`) for Discord presence. Canvas 2D for sparkles. `rsync` + Caddy for deploy/serve.

**Testing approach:** No test framework — this is a visual static site and unit-testing DOM wiring would be ceremony, not coverage. Each task ends with a **visual verification** step run against `npx serve -p 8080` (serves the site locally via HTTP so ESM imports work). Ship criteria = eyes on the reference screenshots and the running site match.

**Reference material (already on disk):**
- `reference/Screenshot 2026-04-15 110439.png` — target main page visual
- `reference/Screenshot 2026-04-15 123926.png` — target splash visual
- `reference/extracted/e-z.bio/givey.html` — cloned source with `__NEXT_DATA__` ground-truth config
- `reference/extracted/r2-bios.e-z.host/8d1ed596-232f-4330-ace9-4da21b087ecc/jxejw1wav1.gif` — banner gif to reuse

**Existing state:** `index.html`, `css/style.css`, `js/script.js` already exist from prior scaffold work. Splash CSS is partially there. JS is a `console.log` stub. The plan rewrites these files wholesale rather than patching — the prior shape is close but not exact and cleaner to rewrite once.

---

## Task 1: Scaffolding — banner asset, gitignore, HTML skeleton, design tokens

**Files:**
- Create: `assets/banner.gif` (copy of `reference/extracted/r2-bios.e-z.host/8d1ed596-232f-4330-ace9-4da21b087ecc/jxejw1wav1.gif`)
- Create: `.gitignore`
- Modify (rewrite): `index.html`
- Modify (rewrite): `css/style.css`

- [ ] **Step 1: Copy banner gif into assets**

```bash
cp "reference/extracted/r2-bios.e-z.host/8d1ed596-232f-4330-ace9-4da21b087ecc/jxejw1wav1.gif" assets/banner.gif
```

Verify: `ls assets/banner.gif` prints the file.

- [ ] **Step 2: Create `.gitignore`**

Contents:
```
reference/extracted/
node_modules/
.DS_Store
*.log
.env
```

(The zip itself — `e_z.bio.zip` — and the screenshots stay committed; only the extracted clone is ignored to avoid a second copy of the whole site in the repo.)

- [ ] **Step 3: Rewrite `index.html`**

Contents:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>givey</title>
    <link rel="icon" href="assets/pfp.jpg" />
    <meta name="description" content="wanna be web developer" />
    <meta name="theme-color" content="#101013" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mali:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="css/style.css" />
  </head>
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
            <div class="socials"></div>
            <a class="flip-link forward" data-flip-to="back" href="#projects">see projects →</a>
          </section>

          <section class="discord-card" data-state="loading">
            <div class="discord-placeholder">loading…</div>
          </section>
        </div>

        <div class="face back">
          <section class="projects-card">
            <header class="projects-header">
              <span class="projects-title">projects</span>
              <a class="flip-link back" data-flip-to="front" href="#">← back</a>
            </header>
            <div class="projects-list"></div>
          </section>
        </div>
      </div>

      <section class="music-player"></section>
    </main>

    <div id="splash">
      <span class="splash-text">click to join heaven</span>
    </div>

    <script type="module" src="js/script.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Rewrite `css/style.css` with design tokens and base styles**

Contents:

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
  --glow: 0 0 24px rgba(116, 0, 14, 0.55);
  --glow-strong: 0 0 36px rgba(116, 0, 14, 0.8);
  --font: "Mali", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

::selection { background: var(--bg); color: var(--accent); }

#background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -10;
}

.background-dim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: -5;
  pointer-events: none;
}

.sparkles {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

#app {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  opacity: 0;
  transition: opacity 500ms ease-out;
  z-index: 2;
}

#app.visible { opacity: 1; }
#app[hidden] { display: none; }

/* ---- splash ---- */

#splash {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
  transition: opacity 400ms ease-out;
}

#splash.hidden { opacity: 0; pointer-events: none; }

.splash-text {
  font-family: var(--font);
  font-size: 2rem;
  font-weight: 600;
  color: var(--fg);
  text-shadow: 0 0 18px rgba(116, 0, 14, 0.55);
  animation: splash-pulse 3s ease-in-out infinite;
  text-align: center;
  padding: 0 24px;
}

@keyframes splash-pulse {
  0%, 100% { opacity: 0.85; text-shadow: 0 0 14px rgba(116, 0, 14, 0.4); }
  50%      { opacity: 1;    text-shadow: 0 0 28px rgba(116, 0, 14, 0.75); }
}

/* ---- card-stack and faces (3D flip) ---- */

.card-stack {
  position: relative;
  width: 100%;
  max-width: 360px;
  perspective: 1400px;
  transform-style: preserve-3d;
  transition: transform 0.7s ease-in-out;
}

.card-stack.flipped { transform: rotateY(180deg); }

.face {
  display: flex;
  flex-direction: column;
  gap: 10px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.face.back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

/* ---- card base style (shared) ---- */

.profile-card,
.discord-card,
.projects-card,
.music-player {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--border-radius);
  box-shadow: var(--glow);
  color: var(--fg);
  transition: box-shadow 300ms ease-out;
}

.profile-card:hover,
.discord-card:hover,
.projects-card:hover,
.music-player:hover {
  box-shadow: var(--glow-strong);
}
```

- [ ] **Step 5: Install a local dev server (once, repo-scoped)**

Run:
```bash
npm init -y
npm pkg set scripts.dev="npx serve -p 8080 -n"
```

Then you can run the site with `npm run dev`. The `-n` flag silences `serve`'s update check. No other npm dependencies needed (serve is invoked via npx).

- [ ] **Step 6: Visually verify the scaffolding**

Run:
```bash
npm run dev
```

Open `http://localhost:8080/` in a browser.

Expected:
- Dark page, no video (no theme wired yet — next task)
- `click to join heaven` text centered, pulsing in Mali font
- No console errors
- View source: banner image URL resolves (check network tab: `assets/banner.gif` returns 200)

- [ ] **Step 7: Commit**

```bash
git add .gitignore index.html css/style.css assets/banner.gif package.json
git commit -m "scaffold: rewrite HTML + base styles with design tokens"
```

---

## Task 2: Theme system + splash unlock (audio + background wiring)

**Files:**
- Create: `js/themes.js`
- Modify (rewrite): `js/script.js`

- [ ] **Step 1: Create `js/themes.js`**

Contents:

```js
export const themes = [
  { id: 'dunga',           title: 'dunga' },
  { id: 'douji feva',      title: 'douji feva' },
  { id: 'in the darkness', title: 'in the darkness' },
  { id: 'miss the rage',   title: 'miss the rage' },
]

export function themePaths(theme) {
  const folder = encodeURIComponent(theme.id)
  return {
    video: `assets/${folder}/video.mp4`,
    audio: `assets/${folder}/audio.mp3`,
  }
}

export function pickRandom() {
  return themes[Math.floor(Math.random() * themes.length)]
}
```

- [ ] **Step 2: Rewrite `js/script.js` with splash unlock + theme wiring**

Contents:

```js
import { pickRandom, themePaths } from './themes.js'

const video = document.getElementById('background')
const audio = document.getElementById('player-audio')
const splash = document.getElementById('splash')
const app = document.getElementById('app')

const theme = pickRandom()
const paths = themePaths(theme)

video.src = paths.video
video.play().catch((err) => console.warn('background video autoplay blocked:', err))

audio.src = paths.audio
audio.load()

function revealApp() {
  splash.classList.add('hidden')
  app.hidden = false
  requestAnimationFrame(() => app.classList.add('visible'))
  splash.addEventListener('transitionend', () => { splash.style.display = 'none' }, { once: true })
}

splash.addEventListener('click', async () => {
  try {
    await audio.play()
  } catch (err) {
    console.warn('audio play blocked, user will need to click again:', err)
    return
  }
  revealApp()
}, { once: false })

// Expose the chosen theme for later modules (player, etc.)
window.__givey = { theme }
```

- [ ] **Step 3: Verify theme wiring**

Run: `npm run dev`

Open `http://localhost:8080/` in a browser. Open devtools → Console.

Expected:
- One of the four background videos plays muted behind the splash
- Typing `window.__givey.theme` in console prints one of the 4 theme objects
- Refresh several times: different themes appear (may hit the same one twice by chance — confirm across ~6 refreshes that at least 2 distinct themes appear)
- Click the splash: audio starts, splash fades over ~400ms, empty card area appears (cards not styled yet beyond base shell)
- Network tab shows `assets/<theme-id>/video.mp4` and `assets/<theme-id>/audio.mp3` loaded (filenames may contain `%20` for themes with spaces — that's correct)

- [ ] **Step 4: Commit**

```bash
git add js/themes.js js/script.js
git commit -m "theme: random background+song pair per load + splash audio unlock"
```

---

## Task 3: Profile card — layout, socials, config, icons, typewriter bio

**Files:**
- Create: `js/config.js`
- Create: `js/icons.js`
- Create: `js/typewriter.js`
- Modify: `css/style.css` (append profile-card styles)
- Modify: `js/script.js` (render socials + start typewriter)

- [ ] **Step 1: Create `js/config.js`**

Contents:

```js
export const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com/afk.luca/' },
  { name: 'Steam',     url: 'https://steamcommunity.com/id/givey02/' },
  { name: 'Shop',      url: 'https://www.acbuy.com/login?loginStatus=register&code=VF6GLN' },
  // Future: { name: 'Roblox', url: '...' },
  // Future: { name: 'NameMC', url: '...' },
]

export const DISCORD_ID = '934479569539444786'

export const BIO_TEXT = 'wanna be web developer'
```

- [ ] **Step 2: Create `js/icons.js`**

Contents:

```js
const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.053 1.805.247 2.228.41.56.217.96.477 1.38.897.42.42.68.82.896 1.38.164.422.358 1.057.411 2.228.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.247 1.805-.41 2.228a3.718 3.718 0 0 1-.897 1.38 3.72 3.72 0 0 1-1.38.896c-.422.164-1.057.358-2.228.411-1.265.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.247-2.228-.41a3.72 3.72 0 0 1-1.38-.897 3.718 3.718 0 0 1-.896-1.38c-.164-.422-.358-1.057-.411-2.228C2.212 15.584 2.2 15.2 2.2 12s.012-3.585.07-4.85c.053-1.17.247-1.805.41-2.228.217-.56.477-.96.897-1.38.42-.42.82-.68 1.38-.896.422-.164 1.057-.358 2.228-.411C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.144 0-3.517.012-4.76.069-1.063.049-1.64.226-2.024.376-.509.198-.872.434-1.254.816-.382.382-.618.745-.816 1.254-.15.384-.327.96-.376 2.024C2.712 8.483 2.7 8.856 2.7 12s.012 3.517.069 4.76c.049 1.063.226 1.64.376 2.024.198.509.434.872.816 1.254.382.382.745.618 1.254.816.384.15.96.327 2.024.376 1.243.057 1.616.069 4.76.069s3.517-.012 4.76-.069c1.063-.049 1.64-.226 2.024-.376.509-.198.872-.434 1.254-.816.382-.382.618-.745.816-1.254.15-.384.327-.96.376-2.024.057-1.243.069-1.616.069-4.76s-.012-3.517-.069-4.76c-.049-1.063-.226-1.64-.376-2.024a3.375 3.375 0 0 0-.816-1.254 3.375 3.375 0 0 0-1.254-.816c-.384-.15-.96-.327-2.024-.376C15.517 4.012 15.144 4 12 4zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.85-2.2a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1z"/></svg>`,
  steam: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-9.97 9.24l5.37 2.22a2.8 2.8 0 0 1 1.58-.49h.07l2.4-3.46v-.05a3.76 3.76 0 1 1 3.76 3.76h-.08l-3.41 2.44v.06a2.83 2.83 0 0 1-5.66.13L2.2 14.4A10 10 0 1 0 12 2zm-2.61 14.02a2.18 2.18 0 0 1-2.88 1.14l-1.24-.52a2.31 2.31 0 0 0 1.2 1.16 2.33 2.33 0 1 0 1.77-4.3l-1.28-.53a2.17 2.17 0 0 1 2.43 3.05zm5.92-3.33a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5zm0-4.38a1.88 1.88 0 1 0 1.88 1.88 1.88 1.88 0 0 0-1.88-1.88z"/></svg>`,
  shop: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2l-2 4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6zm.5 2h11l1 2h-13l1-2zM6 8h12v12H6V8zm3 2v2a3 3 0 0 0 6 0v-2h-2v2a1 1 0 0 1-2 0v-2H9z"/></svg>`,
  roblox: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.33 3L3 14.49 14.49 21 21 9.51 9.51 3H5.33zm5.2 7.38l4.13 1.1-1.1 4.13-4.13-1.1 1.1-4.13z"/></svg>`,
  namemc: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.3l7.5 3.75v1.2l-7.5 3.75-7.5-3.75v-1.2L12 4.3zm-6.5 6.88l5.5 2.75v5.44l-5.5-2.75v-5.44zm13 0v5.44l-5.5 2.75v-5.44l5.5-2.75z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.59 13.41a1 1 0 0 0 1.41 0l4.24-4.24a3 3 0 1 0-4.24-4.24l-1.42 1.41a1 1 0 0 0 1.42 1.42l1.41-1.42a1 1 0 0 1 1.42 1.42l-4.24 4.24a1 1 0 0 0 0 1.41zm2.82-2.82a1 1 0 0 0-1.41 0l-4.24 4.24a3 3 0 1 0 4.24 4.24l1.42-1.41a1 1 0 0 0-1.42-1.42l-1.41 1.42a1 1 0 0 1-1.42-1.42l4.24-4.24a1 1 0 0 0 0-1.41z"/></svg>`,
}

export function getIcon(name) {
  return ICONS[name.toLowerCase()] ?? ICONS.link
}
```

- [ ] **Step 3: Create `js/typewriter.js`**

Contents:

```js
export function initTypewriter(el, text, { charDelay = 70, holdFull = 2200, holdEmpty = 600 } = {}) {
  let cancelled = false

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  async function loop() {
    while (!cancelled) {
      for (let i = 0; i <= text.length && !cancelled; i++) {
        el.textContent = text.slice(0, i)
        await sleep(charDelay)
      }
      await sleep(holdFull)
      for (let i = text.length; i >= 0 && !cancelled; i--) {
        el.textContent = text.slice(0, i)
        await sleep(charDelay / 2)
      }
      await sleep(holdEmpty)
    }
  }

  loop()
  return () => { cancelled = true }
}
```

- [ ] **Step 4: Append profile-card styles to `css/style.css`**

Append at the end of `css/style.css`:

```css
/* ---- profile card ---- */

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 16px;
  overflow: hidden;
}

.profile-card .banner {
  width: 100%;
  height: 100px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.profile-card .pfp {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.15);
  margin-top: -45px;
  box-shadow: 0 0 18px rgba(116, 0, 14, 0.55);
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 1.6rem;
  font-weight: 700;
  text-shadow: 0 0 12px rgba(116, 0, 14, 0.7);
}

.bio {
  margin-top: 4px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.82);
  min-height: 1.3em;
}

.bio .cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s steps(2) infinite;
}

@keyframes blink { 50% { opacity: 0; } }

.socials {
  display: flex;
  gap: 14px;
  margin-top: 12px;
}

.socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: var(--fg);
  transition: background 200ms, transform 200ms, box-shadow 200ms;
}

.socials a:hover {
  background: rgba(116, 0, 14, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 0 16px rgba(116, 0, 14, 0.7);
}

.socials svg {
  width: 18px;
  height: 18px;
}

.flip-link {
  margin-top: 14px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: color 200ms;
  cursor: pointer;
}

.flip-link:hover { color: var(--accent); }
```

- [ ] **Step 5: Extend `js/script.js` to render socials and start typewriter**

Append (before the existing `window.__givey` line) — full updated file:

```js
import { pickRandom, themePaths } from './themes.js'
import { SOCIALS, BIO_TEXT } from './config.js'
import { getIcon } from './icons.js'
import { initTypewriter } from './typewriter.js'

const video = document.getElementById('background')
const audio = document.getElementById('player-audio')
const splash = document.getElementById('splash')
const app = document.getElementById('app')

const theme = pickRandom()
const paths = themePaths(theme)

video.src = paths.video
video.play().catch((err) => console.warn('background video autoplay blocked:', err))

audio.src = paths.audio
audio.load()

function renderSocials() {
  const host = document.querySelector('.socials')
  host.innerHTML = SOCIALS.map(
    (s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">${getIcon(s.name)}</a>`
  ).join('')
}

function revealApp() {
  splash.classList.add('hidden')
  app.hidden = false
  requestAnimationFrame(() => app.classList.add('visible'))
  splash.addEventListener('transitionend', () => { splash.style.display = 'none' }, { once: true })

  const bioEl = document.querySelector('.bio-text')
  initTypewriter(bioEl, BIO_TEXT)
}

renderSocials()

splash.addEventListener('click', async () => {
  try {
    await audio.play()
  } catch (err) {
    console.warn('audio play blocked, user will need to click again:', err)
    return
  }
  revealApp()
}, { once: false })

window.__givey = { theme }
```

- [ ] **Step 6: Visual verification**

Run: `npm run dev`

Expected after clicking the splash:
- Card appears centered, with banner gif animating across the top
- Circular pfp overlapping the bottom of the banner
- Name "givey" in bold Mali, subtle red glow
- Bio types out "wanna be web developer" char by char, cursor blinks after the last char, then erases and re-types in a loop
- Three circular social icons below bio (Instagram, Steam, Shop)
- Hovering a social icon: red glow + slight lift
- Clicking a social icon: opens the URL in a new tab
- "see projects →" link under the socials, dim white, hover turns it red

- [ ] **Step 7: Commit**

```bash
git add js/config.js js/icons.js js/typewriter.js js/script.js css/style.css
git commit -m "profile: card layout, socials, icons, typewriter bio"
```

---

## Task 4: Music player

**Files:**
- Create: `js/player.js`
- Modify: `css/style.css` (append music-player styles)
- Modify: `js/script.js` (init player after splash)

- [ ] **Step 1: Create `js/player.js`**

Contents:

```js
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function initPlayer(audio, { host, title }) {
  host.innerHTML = `
    <div class="song-title">${title}</div>
    <div class="player-controls">
      <button class="play-pause" aria-label="play/pause">⏸</button>
      <div class="progress-wrap">
        <div class="progress-bar"></div>
      </div>
      <div class="time-display">0:00 / 0:00</div>
      <button class="volume-toggle" aria-label="mute">🔊</button>
    </div>
  `

  const playBtn = host.querySelector('.play-pause')
  const progressWrap = host.querySelector('.progress-wrap')
  const progressBar = host.querySelector('.progress-bar')
  const timeDisplay = host.querySelector('.time-display')
  const volBtn = host.querySelector('.volume-toggle')

  function syncPlayButton() {
    playBtn.textContent = audio.paused ? '▶' : '⏸'
  }
  function syncTime() {
    const cur = audio.currentTime || 0
    const dur = audio.duration || 0
    timeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`
    progressBar.style.width = dur > 0 ? `${(cur / dur) * 100}%` : '0%'
  }
  function syncVolume() {
    volBtn.textContent = audio.muted || audio.volume === 0 ? '🔇' : '🔊'
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  })
  volBtn.addEventListener('click', () => { audio.muted = !audio.muted })

  progressWrap.addEventListener('click', (e) => {
    const rect = progressWrap.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    if (Number.isFinite(audio.duration)) audio.currentTime = ratio * audio.duration
  })

  audio.addEventListener('play', syncPlayButton)
  audio.addEventListener('pause', syncPlayButton)
  audio.addEventListener('timeupdate', syncTime)
  audio.addEventListener('loadedmetadata', syncTime)
  audio.addEventListener('volumechange', syncVolume)

  syncPlayButton()
  syncTime()
  syncVolume()
}
```

- [ ] **Step 2: Append music-player styles to `css/style.css`**

```css
/* ---- music player ---- */

.music-player {
  width: 100%;
  max-width: 360px;
  padding: 10px 14px;
}

.song-title {
  font-size: 0.95rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  padding: 2px 0 8px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-controls button {
  background: transparent;
  border: none;
  color: var(--fg);
  cursor: pointer;
  font-size: 1rem;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 200ms, box-shadow 200ms;
}

.player-controls button:hover {
  background: rgba(116, 0, 14, 0.35);
  box-shadow: 0 0 12px rgba(116, 0, 14, 0.6);
}

.progress-wrap {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(116, 0, 14, 0.8);
  transition: width 100ms linear;
}

.time-display {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.65);
  min-width: 70px;
  text-align: right;
}
```

- [ ] **Step 3: Wire player init into `js/script.js`**

Modify `revealApp()` in `js/script.js` — replace the existing function with:

```js
function revealApp() {
  splash.classList.add('hidden')
  app.hidden = false
  requestAnimationFrame(() => app.classList.add('visible'))
  splash.addEventListener('transitionend', () => { splash.style.display = 'none' }, { once: true })

  const bioEl = document.querySelector('.bio-text')
  initTypewriter(bioEl, BIO_TEXT)

  const playerHost = document.querySelector('.music-player')
  initPlayer(audio, { host: playerHost, title: theme.title })
}
```

And at the top, add the import:

```js
import { initPlayer } from './player.js'
```

- [ ] **Step 4: Visual verification**

Run: `npm run dev` and click the splash.

Expected:
- Music player card visible under the profile card
- Song title matches the chosen theme (lowercase, e.g. `dunga`)
- Play/pause button toggles audio and its glyph (▶ ↔ ⏸)
- Progress bar fills as the song plays, with red glow
- Time display ticks up each second, format `0:42 / 3:18`
- Clicking the progress bar seeks to that position
- Volume button toggles mute, glyph changes 🔊 ↔ 🔇

- [ ] **Step 5: Commit**

```bash
git add js/player.js js/script.js css/style.css
git commit -m "player: music player controls bound to audio element"
```

---

## Task 5: Lanyard Discord presence

**Files:**
- Create: `js/lanyard.js`
- Modify: `css/style.css` (append discord-card styles)
- Modify: `js/script.js` (init Lanyard after splash)

- [ ] **Step 1: Create `js/lanyard.js`**

Contents:

```js
const WS_URL = 'wss://api.lanyard.rest/socket'
const MAX_RECONNECT_ATTEMPTS = 5
const INIT_TIMEOUT_MS = 3000

const STATUS_COLORS = {
  online:  '#23a55a',
  idle:    '#f0b232',
  dnd:     '#f23f43',
  offline: '#80848e',
}

function avatarUrl(user) {
  if (!user) return ''
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`
  return `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 6}.png`
}

function activityLine(data) {
  const activities = data?.activities ?? []
  const spotify = data?.spotify
  if (spotify) return `🎵 listening to ${spotify.song} — ${spotify.artist}`
  const custom = activities.find((a) => a.type === 4)
  if (custom?.state) return `${custom.emoji?.name ?? ''} ${custom.state}`.trim()
  const game = activities.find((a) => a.type === 0)
  if (game?.name) return `playing ${game.name}`
  const listening = activities.find((a) => a.type === 2)
  if (listening?.name) return `listening to ${listening.name}`
  return ''
}

function renderStatic(host, userId, avatar, tag) {
  host.dataset.state = 'static'
  host.innerHTML = `
    <img class="discord-avatar" src="${avatar}" alt="${tag}" />
    <div class="discord-text">
      <div class="discord-tag"><span class="discord-dot" style="background:${STATUS_COLORS.offline}"></span>${tag}</div>
      <div class="discord-activity">offline</div>
    </div>
    <a class="discord-button" href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer">Add on Discord</a>
  `
}

function renderLive(host, userId, data) {
  host.dataset.state = 'live'
  const user = data.discord_user
  const status = data.discord_status ?? 'offline'
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.offline
  const tag = user?.display_name || user?.global_name || user?.username || 'unknown'
  const activity = activityLine(data)

  host.innerHTML = `
    <img class="discord-avatar" src="${avatarUrl(user)}" alt="${tag}" />
    <div class="discord-text">
      <div class="discord-tag"><span class="discord-dot" style="background:${color}"></span>${tag}</div>
      <div class="discord-activity">${activity || status}</div>
    </div>
    <a class="discord-button" href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer">Add on Discord</a>
  `
}

export function initDiscord(host, userId) {
  let ws = null
  let heartbeat = null
  let attempts = 0
  let gotInit = false
  let initTimer = null
  let fallbackShown = false

  function showFallback() {
    if (fallbackShown) return
    fallbackShown = true
    renderStatic(host, userId, `https://cdn.discordapp.com/embed/avatars/0.png`, 'givey')
  }

  initTimer = setTimeout(() => { if (!gotInit) showFallback() }, INIT_TIMEOUT_MS)

  function connect() {
    ws = new WebSocket(WS_URL)

    ws.addEventListener('message', (evt) => {
      let msg
      try { msg = JSON.parse(evt.data) } catch { return }

      if (msg.op === 1) {
        // HELLO — subscribe + start heartbeat
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }))
        const interval = msg.d?.heartbeat_interval ?? 30000
        heartbeat = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }))
        }, interval)
      } else if (msg.op === 0) {
        // EVENT
        if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
          gotInit = true
          fallbackShown = false
          clearTimeout(initTimer)
          const data = msg.t === 'INIT_STATE' ? msg.d : msg.d
          renderLive(host, userId, data)
        }
      }
    })

    ws.addEventListener('close', () => {
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null }
      attempts += 1
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        showFallback()
        return
      }
      const delay = Math.min(1000 * 2 ** attempts, 30000)
      setTimeout(connect, delay)
    })

    ws.addEventListener('error', () => { /* close handler will deal with it */ })
  }

  connect()
}
```

- [ ] **Step 2: Append discord-card styles to `css/style.css`**

```css
/* ---- discord card ---- */

.discord-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  min-height: 62px;
}

.discord-placeholder {
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.discord-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.discord-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.discord-tag {
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3ccf60;  /* green text for the handle — matches the reference screenshot */
}

.discord-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}

.discord-activity {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discord-button {
  flex-shrink: 0;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--fg);
  background: transparent;
  border: 1px solid rgba(116, 0, 14, 0.6);
  border-radius: 4px;
  text-decoration: none;
  transition: background 200ms, box-shadow 200ms, border-color 200ms;
}

.discord-button:hover {
  background: rgba(116, 0, 14, 0.35);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(116, 0, 14, 0.7);
}
```

- [ ] **Step 3: Wire Lanyard into `js/script.js`**

Add import at the top:

```js
import { initDiscord } from './lanyard.js'
import { DISCORD_ID } from './config.js'
```

(The `DISCORD_ID` import needs to be added to the existing `config.js` import line: `import { SOCIALS, BIO_TEXT, DISCORD_ID } from './config.js'`)

Add inside `revealApp()` after the player init:

```js
  const discordHost = document.querySelector('.discord-card')
  initDiscord(discordHost, DISCORD_ID)
```

- [ ] **Step 4: Visual verification**

Run: `npm run dev` and click the splash.

Two expected outcomes depending on whether you've joined the Lanyard Discord server (`https://discord.gg/lanyard`):

**If joined:**
- Discord card shows your real avatar, "givey" in green with status dot matching your current Discord state (green online / yellow idle / red dnd / gray offline)
- Activity line shows current game / Spotify track / custom status, or blank if idle
- "Add on Discord" button visible on the right

**If not joined yet:**
- After ~3s, a static fallback card shows: default avatar (Discord blue), "givey" in green with gray "offline" dot, activity line says "offline", "Add on Discord" button still works
- No console errors (WebSocket will connect successfully; just no data for the user)
- Console may show Lanyard responding without your user data — that's the expected "not subscribed" state

Both outcomes are correct. Join the Lanyard server when convenient and refresh to see the live card.

- [ ] **Step 5: Commit**

```bash
git add js/lanyard.js js/script.js css/style.css
git commit -m "discord: lanyard ws client + presence card with static fallback"
```

---

## Task 6: Projects back face + card flip

**Files:**
- Create: `js/projects.js`
- Create: `js/flip.js`
- Modify: `css/style.css` (append projects-card + flip styles)
- Modify: `js/script.js` (render projects + init flip)

- [ ] **Step 1: Create `js/projects.js`**

Contents:

```js
export const projects = [
  {
    id: 'donuttrade',
    title: 'donuttrade.com',
    description: 'Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL.',
    url: 'https://donuttrade.com',
    thumbnail: null,
  },
]
```

- [ ] **Step 2: Create `js/flip.js`**

Contents:

```js
const FLIP_DURATION_MS = 700

export function initFlip(stack) {
  stack.addEventListener('click', (e) => {
    const link = e.target.closest('[data-flip-to]')
    if (!link) return
    e.preventDefault()
    const to = link.dataset.flipTo
    const shouldFlip = to === 'back'
    if (stack.classList.contains('flipped') === shouldFlip) return

    stack.classList.add('is-flipping')
    stack.classList.toggle('flipped', shouldFlip)
    setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
  })
}
```

**Note on face sizing:** the front face (banner + pfp + name + bio + socials + link + discord card) is naturally taller than the back face (one-project list). Because `.face.front` is in normal flow and `.face.back` is absolutely positioned inside the stack, the stack sizes itself to the front face — the back face just fills it. If the projects list grows beyond that height in the future, `.projects-list` has `overflow-y: auto` (set in the CSS block in step 3) so it scrolls internally instead of overflowing the stack.

- [ ] **Step 3: Append projects + flip styles to `css/style.css`**

```css
/* ---- projects card ---- */

.projects-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  min-height: 160px;
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 10px;
}

.projects-title {
  font-weight: 700;
  font-size: 1.05rem;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.projects-list::-webkit-scrollbar { width: 4px; }
.projects-list::-webkit-scrollbar-thumb { background: rgba(116, 0, 14, 0.5); border-radius: 2px; }

.project-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  color: var(--fg);
  text-decoration: none;
  transition: background 200ms, border-color 200ms, box-shadow 200ms;
}

.project-tile:hover {
  background: rgba(116, 0, 14, 0.25);
  border-color: rgba(116, 0, 14, 0.6);
  box-shadow: 0 0 12px rgba(116, 0, 14, 0.5);
}

.project-tile-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.project-tile-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.35;
}

/* ---- flip interaction ---- */

.card-stack.is-flipping { pointer-events: none; }
```

- [ ] **Step 4: Wire projects + flip into `js/script.js`**

Add imports:

```js
import { projects } from './projects.js'
import { initFlip } from './flip.js'
```

Add before `renderSocials()` call:

```js
function renderProjects() {
  const host = document.querySelector('.projects-list')
  host.innerHTML = projects.map((p) => `
    <a class="project-tile" href="${p.url}" target="_blank" rel="noopener noreferrer">
      <span class="project-tile-title">${p.title}</span>
      <span class="project-tile-desc">${p.description}</span>
    </a>
  `).join('')
}
```

Call `renderProjects()` right after `renderSocials()`.

Inside `revealApp()` at the end, add:

```js
  const stack = document.querySelector('.card-stack')
  initFlip(stack)
```

- [ ] **Step 5: Visual verification**

Run: `npm run dev`, click the splash.

Expected:
- "see projects →" link on the profile card
- Click the link: card rotates 180° on Y axis over 0.7s; front face disappears, back face shows the projects card with "projects" header, "← back" link, one tile for donuttrade
- Music **does not stop or glitch** during the flip
- Background video keeps playing
- Click "← back": reverse rotation to the front
- Hover on the donuttrade tile: red tint + glow
- Click the tile: opens `https://donuttrade.com` in a new tab
- No console errors

- [ ] **Step 6: Commit**

```bash
git add js/projects.js js/flip.js js/script.js css/style.css
git commit -m "projects: back face + 3D card flip with seamless audio"
```

---

## Task 7: Tilt + sparkles (ambient + cursor trail)

**Files:**
- Create: `js/tilt.js`
- Create: `js/sparkles.js`
- Modify: `js/script.js` (init both after reveal)

- [ ] **Step 1: Create `js/tilt.js`**

Contents:

```js
const MAX_DEG = 6

export function initTilt(stack) {
  function onMove(e) {
    if (stack.classList.contains('is-flipping')) return
    const rect = stack.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    const rotY = (x / (rect.width / 2)) * MAX_DEG
    const rotX = -(y / (rect.height / 2)) * MAX_DEG
    const base = stack.classList.contains('flipped') ? 'rotateY(180deg) ' : ''
    stack.style.transform = `${base}rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
  }

  function onLeave() {
    stack.style.transform = ''
  }

  window.addEventListener('mousemove', onMove)
  stack.addEventListener('mouseleave', onLeave)
}
```

Note: this overrides the CSS `transform` set by `.flipped`. The `base` variable re-includes the flip rotation when the stack is on the back face, so tilt composes correctly with flip.

- [ ] **Step 2: Create `js/sparkles.js`**

Contents:

```js
const AMBIENT_COUNT = 18
const CURSOR_SPAWN_EVERY_MS = 50
const SPARKLE_LIFE_MS = 1400

export function initSparkles(canvas) {
  const ctx = canvas.getContext('2d')
  let w = 0, h = 0
  const particles = []

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio
    h = canvas.height = window.innerHeight * devicePixelRatio
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
  }
  resize()
  window.addEventListener('resize', resize)

  function spawn(x, y, isCursor) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * (isCursor ? 1.2 : 0.15) * devicePixelRatio,
      vy: (isCursor ? 0.8 : -0.3) * devicePixelRatio + (Math.random() - 0.5) * 0.3 * devicePixelRatio,
      life: 0,
      ttl: isCursor ? 600 : SPARKLE_LIFE_MS + Math.random() * 800,
      size: (isCursor ? 1.5 : 2 + Math.random() * 1.5) * devicePixelRatio,
    })
  }

  for (let i = 0; i < AMBIENT_COUNT; i++) spawn(Math.random() * w, Math.random() * h, false)

  let lastCursor = 0
  window.addEventListener('mousemove', (e) => {
    const now = performance.now()
    if (now - lastCursor < CURSOR_SPAWN_EVERY_MS) return
    lastCursor = now
    spawn(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio, true)
  })

  function drawSparkle(p, alpha) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 8 * devicePixelRatio
    ctx.beginPath()
    const s = p.size
    // 4-point sparkle shape
    ctx.moveTo(0, -s * 2)
    ctx.lineTo(s * 0.5, -s * 0.5)
    ctx.lineTo(s * 2, 0)
    ctx.lineTo(s * 0.5, s * 0.5)
    ctx.lineTo(0, s * 2)
    ctx.lineTo(-s * 0.5, s * 0.5)
    ctx.lineTo(-s * 2, 0)
    ctx.lineTo(-s * 0.5, -s * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  let lastT = performance.now()
  function frame(t) {
    const dt = t - lastT
    lastT = t
    ctx.clearRect(0, 0, w, h)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life += dt
      p.x += p.vx * (dt / 16)
      p.y += p.vy * (dt / 16)
      const alpha = 1 - p.life / p.ttl
      if (alpha <= 0) {
        // replace ambient sparkle at a new position; drop cursor sparkle
        if (p.ttl >= SPARKLE_LIFE_MS) {
          p.life = 0
          p.x = Math.random() * w
          p.y = Math.random() * h
          p.vx = (Math.random() - 0.5) * 0.15 * devicePixelRatio
          p.vy = -0.3 * devicePixelRatio + (Math.random() - 0.5) * 0.3 * devicePixelRatio
          p.ttl = SPARKLE_LIFE_MS + Math.random() * 800
        } else {
          particles.splice(i, 1)
        }
        continue
      }
      drawSparkle(p, Math.max(0, Math.min(1, alpha)))
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
```

- [ ] **Step 3: Wire tilt + sparkles into `js/script.js`**

Add imports:

```js
import { initTilt } from './tilt.js'
import { initSparkles } from './sparkles.js'
```

Inside `revealApp()`, at the end, add:

```js
  initTilt(stack)
  initSparkles(document.querySelector('.sparkles'))
```

(`stack` is already in scope from the flip init.)

- [ ] **Step 4: Visual verification**

Run: `npm run dev`, click the splash.

Expected:
- Small white 4-point sparkles drift slowly upward across the background, ~18 at a time
- Moving the mouse leaves a short-lived trail of smaller sparkles falling away from the cursor
- Moving the mouse over the card stack tilts the stack up to ~6° toward the cursor (subtle parallax feel)
- Moving the mouse off the stack resets it to flat
- Flipping the card still works; tilt resumes on the back face without wobble
- No console errors, no noticeable frame drops

- [ ] **Step 5: Commit**

```bash
git add js/tilt.js js/sparkles.js js/script.js
git commit -m "fx: hover tilt on card stack + ambient + cursor-trail sparkles"
```

---

## Task 8: Responsive tuning for small screens

**Files:**
- Modify: `css/style.css` (append media query block)

- [ ] **Step 1: Append responsive rules to `css/style.css`**

```css
/* ---- responsive ---- */

@media (max-width: 480px) {
  .card-stack { max-width: calc(100% - 8px); }
  .music-player { max-width: calc(100% - 8px); }

  .profile-card .banner { height: 72px; }
  .profile-card .pfp { width: 76px; height: 76px; margin-top: -38px; }
  .name-row { font-size: 1.35rem; }

  .splash-text { font-size: 1.5rem; }

  .player-controls { gap: 8px; }
  .time-display { min-width: 58px; font-size: 0.7rem; }

  .discord-card { flex-wrap: wrap; }
  .discord-button { margin-left: auto; }
}
```

- [ ] **Step 2: Visual verification**

Run: `npm run dev`. In the browser, open devtools → toggle device toolbar → set to iPhone-ish width (375×812) and refresh.

Expected:
- Splash text remains readable
- Card stack fits within the viewport with small horizontal margins
- Banner compresses but still visible; pfp smaller; name still legible
- Music player controls fit in one row without horizontal scroll
- Flip still works

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "responsive: mobile breakpoint at 480px"
```

---

## Task 9: Deploy script + hosting integration (donuttrade repo side)

**Files:**
- Create: `scripts/deploy.sh`
- Create: `docs/hosting-setup.md`
- Document: changes to apply in `R:\donuttrade` (not in this repo)

- [ ] **Step 1: Create `scripts/deploy.sh`**

Contents:

```bash
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
echo "  (if first deploy, reload caddy: docker compose -f docker-compose.yml -f docker-compose.production.yml exec caddy caddy reload)"
```

Then mark executable:

```bash
chmod +x scripts/deploy.sh
```

- [ ] **Step 2: Create `docs/hosting-setup.md` documenting the donuttrade-side changes**

Contents:

```markdown
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
```

- [ ] **Step 3: Verify deploy script locally (dry-run, do not actually deploy)**

Run:
```bash
DEPLOY_USER=test DEPLOY_HOST=example.com bash -c 'rsync -avzn --delete \
  --exclude=".git" --exclude="docs" --exclude="reference" --exclude="scripts" \
  --exclude="*.zip" --exclude="CLAUDE.md" --exclude=".gitignore" \
  --exclude="node_modules" --exclude="package.json" --exclude="package-lock.json" \
  ./ /tmp/givey-deploy-dry/ 2>&1 | head -40'
```

(Substituting `/tmp/givey-deploy-dry/` for the remote destination so it runs locally in dry-run mode.)

Expected: a list of what would be transferred. Confirm:
- `index.html`, `css/`, `js/`, `assets/` all included
- `docs/`, `reference/`, `scripts/`, `*.zip`, `CLAUDE.md`, `package.json` all excluded

- [ ] **Step 4: Commit**

```bash
git add scripts/deploy.sh docs/hosting-setup.md
git commit -m "deploy: rsync deploy script + hosting setup doc for droplet integration"
```

---

## Task 10: Final visual QA pass + retire old spec/plan

**Files:**
- Delete: `docs/superpowers/specs/2026-04-15-givey-bio-site-design.md`
- Delete: `docs/superpowers/plans/2026-04-15-givey-bio-site-implementation.md`

- [ ] **Step 1: Run full visual QA against reference screenshots**

Run: `npm run dev`.

Compare against `reference/Screenshot 2026-04-15 110439.png`:

- [ ] Dark blurred video background matches the vibe (car dashboards or similar — depends on chosen theme)
- [ ] Main card stack is centered and roughly the same size as reference
- [ ] Banner gif animates at top of profile card
- [ ] Circular pfp overlaps bottom of banner
- [ ] Name "givey" in Mali font, red-tinted glow
- [ ] Bio types out "wanna be web developer" with blinking cursor, loops
- [ ] Three social icons in a row with red hover glow
- [ ] Discord card below profile card (shape, avatar, green handle text, dot, activity, red-outlined "Add on Discord" button)
- [ ] Music player card below card stack with title, play/pause, progress bar (red filled), time, volume
- [ ] "see projects →" link under socials
- [ ] Clicking the link flips the card — audio keeps playing, no glitch
- [ ] Back face has "projects" header, "← back" link, donuttrade tile
- [ ] Sparkles visible as small white points drifting up
- [ ] Cursor trail of sparkles on mouse move
- [ ] Hover tilt on the card stack
- [ ] Refresh 3+ times — different themes picked, background + song swap together

Compare against `reference/Screenshot 2026-04-15 123926.png`:

- [ ] Splash text "click to join heaven" centered, Mali font, ~2rem, pulsing with red-ish glow
- [ ] Dark overlay over video background
- [ ] Clicking anywhere dismisses splash smoothly

- [ ] **Step 2: Retire the old spec and plan**

The superseded v1 documents are confusing to leave around. Delete them:

```bash
git rm docs/superpowers/specs/2026-04-15-givey-bio-site-design.md
git rm docs/superpowers/plans/2026-04-15-givey-bio-site-implementation.md
```

- [ ] **Step 3: Commit the cleanup**

```bash
git commit -m "docs: retire v1 spec/plan superseded by 2026-04-16 rebuild"
```

- [ ] **Step 4: CLAUDE.md**

CLAUDE.md is created separately via the `init` skill after the plan is fully executed. Do not write it as part of this plan — it should describe the built-and-shipping site, not an aspiration.

---

## Post-plan tasks (not part of the build)

1. **Join the Lanyard Discord server** (`https://discord.gg/lanyard`) so the live Discord presence card works for real. Until then the static fallback shows.
2. **Apply the donuttrade-side changes** from `docs/hosting-setup.md` — DNS records, Caddy block, compose volume mount.
3. **Run `./scripts/deploy.sh`** to push the built site to `/srv/givey/` on the droplet.
4. **Verify `https://givey.zip`** loads with a valid Let's Encrypt cert.
5. **Run the `init` skill** to create `CLAUDE.md` describing the now-built site.
