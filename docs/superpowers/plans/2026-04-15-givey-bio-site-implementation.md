# givey.zip Bio Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `givey.zip` personal bio site per the design spec at `docs/superpowers/specs/2026-04-15-givey-bio-site-design.md` — dark single-card aesthetic, splash-unlocked audio, random theme pairs, `/projects` sub-route with preserved playback, deployed via Caddy on the donuttrade droplet.

**Architecture:** Plain HTML/CSS/JS, no build step, no framework. One `index.html` contains both `/` and `/projects` as sibling `<section>` elements; a ~20-line router toggles visibility. Background video and audio live outside the route sections so they persist across navigation. Themes are a data-driven array — add a folder + one line to add a theme. Deployed as static files by Caddy with `try_files` SPA fallback.

**Tech Stack:** HTML5, CSS3 (custom properties, `backdrop-filter`, `transform: perspective`), vanilla ES modules (no bundler), Caddy v2.

**Testing approach:** No unit-test framework (would contradict no-build-step decision). Each task ends with **browser acceptance checks** — exact things to see/hear in a local dev server (`python -m http.server 8000` from the project root, then open `http://localhost:8000`). Pure-logic helpers (theme picker, router path matching) get a tiny inline assertion harness via `console.assert` you can eyeball in DevTools.

**Dev loop:** After each task, reload the browser, verify the acceptance check, commit. Never commit a broken state — if the acceptance check fails, fix before committing.

**Working directory:** `R:/givey.zip` (already a git repo, initial commit `07adb64` contains the spec and `.gitignore`).

---

## File structure

```
givey.zip/
├── index.html                   # Task 1
├── css/
│   └── style.css                # Task 1 (scaffold), grown in later tasks
├── js/
│   ├── script.js                # Task 1 (entry), grown in later tasks
│   ├── themes.js                # Task 2
│   ├── config.js                # Task 5
│   ├── router.js                # Task 11
│   └── projects.js              # Task 12
├── assets/
│   ├── pfp.jpg                  # exists
│   ├── dunga/{audio.mp3, video.mp4}      # exists
│   ├── douji feva/{audio.mp3, video.mp4} # exists
│   └── projects/                # created in Task 12 (placeholder for future thumbnails)
├── Caddyfile.givey              # Task 15
└── docs/                        # spec + this plan (already committed)
```

**Responsibilities per file:**
- `index.html`: single-page shell, all DOM in one place, imports `js/script.js` as a module.
- `css/style.css`: all styling, uses `--accent` CSS custom property driven by JS.
- `js/script.js`: orchestrator — imports all other modules, wires DOM on `DOMContentLoaded`, owns splash handler, typing animation, counter, music player binding, tilt effect.
- `js/themes.js`: exports `themes` array + `pickRandom()`. Pure data + one pure function.
- `js/config.js`: exports `SOCIALS` object. Pure data.
- `js/router.js`: exports `initRouter()` that sets up click + popstate listeners and exposes `navigate(path)`.
- `js/projects.js`: exports `projects` array. Pure data.
- `Caddyfile.givey`: single site block for Caddy production config.

---

## Task 1: Project scaffold

**Files:**
- Create: `R:/givey.zip/index.html`
- Create: `R:/givey.zip/css/style.css`
- Create: `R:/givey.zip/js/script.js`

- [ ] **Step 1.1: Create `index.html` with the full DOM skeleton**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>givey.zip</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <video id="background" autoplay muted loop playsinline></video>
    <audio id="player-audio"></audio>

    <div id="splash">
      <span class="splash-text">click to join heaven</span>
    </div>

    <main id="app" hidden>
      <section data-route="home">
        <div class="profile-card">
          <div class="banner"></div>
          <img class="pfp" src="assets/pfp.jpg" alt="givey" />
          <div class="name-row">
            <span class="name">givey</span>
            <span class="verified" aria-label="verified">✓</span>
          </div>
          <div class="bio"><span class="bio-text"></span><span class="cursor">|</span></div>
          <div class="socials"></div>
          <div class="view-counter">👁 <span class="view-count">0</span></div>
        </div>

        <div class="discord-card">
          <div class="discord-user">
            <span class="discord-dot"></span>
            <span class="discord-handle">@givey</span>
          </div>
          <a class="discord-button" href="#" target="_blank" rel="noopener">Add on Discord</a>
        </div>

        <a class="projects-link" data-route-link="projects" href="/projects">see projects →</a>
      </section>

      <section data-route="projects" hidden>
        <div class="projects-card">
          <div class="projects-header">
            <span class="projects-title">projects</span>
            <a class="back-link" data-route-link="home" href="/">← back</a>
          </div>
          <div class="projects-list"></div>
        </div>
      </section>

      <div class="music-player">
        <div class="song-title"></div>
        <div class="player-controls">
          <button class="play-pause" aria-label="play/pause">▶</button>
          <div class="progress-wrap">
            <div class="progress-bar"></div>
          </div>
          <div class="time-display">0:00 / 0:00</div>
        </div>
      </div>
    </main>

    <script type="module" src="js/script.js"></script>
  </body>
</html>
```

- [ ] **Step 1.2: Create `css/style.css` with minimal reset + black background**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

#background {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  z-index: -1;
}

#splash {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
}

.splash-text {
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  opacity: 0.8;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

#app {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
```

- [ ] **Step 1.3: Create `js/script.js` as empty entry**

```js
// Entry point. Populated in later tasks.
console.log('givey.zip loaded');
```

- [ ] **Step 1.4: Start local dev server and verify the page loads**

Open a terminal in `R:/givey.zip` and run:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in a browser.

**Expected:** Black page with "click to join heaven" text pulsing faintly in the middle. DevTools Console shows `givey.zip loaded`. No errors. (You won't see the profile card yet — it's inside `<main hidden>`.)

- [ ] **Step 1.5: Commit**

```bash
cd R:/givey.zip
git add index.html css/style.css js/script.js
git commit -m "scaffold: add index.html, css, and js entry point"
```

---

## Task 2: Themes config + background video

**Files:**
- Create: `R:/givey.zip/js/themes.js`
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 2.1: Create `js/themes.js`**

```js
export const themes = [
  { id: 'dunga',      title: 'DUNGA',      accent: '#ff2a2a' },
  { id: 'douji feva', title: 'douji feva', accent: '#7a2aff' },
];

export function pickRandom() {
  return themes[Math.floor(Math.random() * themes.length)];
}

// Sanity check (DevTools console will show this):
console.assert(themes.length >= 1, 'themes array is empty');
console.assert(typeof pickRandom().id === 'string', 'pickRandom did not return a theme');
```

- [ ] **Step 2.2: Wire the theme into `js/script.js` — set background video src on load**

Replace the contents of `js/script.js` with:

```js
import { pickRandom } from './themes.js';

const theme = pickRandom();
console.log('selected theme:', theme.id);

const video = document.getElementById('background');
video.src = `assets/${theme.id}/video.mp4`;
```

- [ ] **Step 2.3: Verify the background video loads**

Reload `http://localhost:8000`. DevTools Console should show `selected theme: dunga` or `selected theme: douji feva`. The background `<video>` element now has a src; hard refresh (Ctrl+Shift+R) a few times and confirm both themes appear.

**Expected:** Video plays muted in the background behind the splash overlay. If the video doesn't appear, check the Network tab — a 404 on `assets/dunga/video.mp4` means the spaces in `douji feva` need URL encoding (see next step).

- [ ] **Step 2.4: Handle the space in `douji feva` folder name**

Update `js/script.js` to URL-encode the theme id when building asset paths:

```js
import { pickRandom } from './themes.js';

const theme = pickRandom();
console.log('selected theme:', theme.id);

const themePath = (file) => `assets/${encodeURIComponent(theme.id)}/${file}`;

const video = document.getElementById('background');
video.src = themePath('video.mp4');
```

Refresh until you get the `douji feva` theme and confirm the video loads (spaces become `%20` in the URL).

- [ ] **Step 2.5: Commit**

```bash
git add js/themes.js js/script.js
git commit -m "themes: add theme config and random background video on load"
```

---

## Task 3: Splash overlay dismiss + audio unlock

**Files:**
- Modify: `R:/givey.zip/js/script.js`
- Modify: `R:/givey.zip/css/style.css`

- [ ] **Step 3.1: Add splash-hidden transition CSS**

Append to `css/style.css`:

```css
#splash {
  transition: opacity 400ms ease;
}

#splash.hidden {
  opacity: 0;
  pointer-events: none;
}

#app[hidden] {
  display: none !important;
}

#app.visible {
  display: flex;
}
```

- [ ] **Step 3.2: Wire the splash click handler in `js/script.js`**

Append to `js/script.js`:

```js
const audio = document.getElementById('player-audio');
audio.src = themePath('audio.mp3');

const splash = document.getElementById('splash');
const app = document.getElementById('app');

splash.addEventListener('click', async () => {
  try {
    await video.play();
  } catch (e) {
    console.warn('video play failed:', e);
  }
  try {
    await audio.play();
  } catch (e) {
    console.warn('audio play failed:', e);
  }

  splash.classList.add('hidden');
  splash.addEventListener('transitionend', () => {
    splash.style.display = 'none';
  }, { once: true });

  app.hidden = false;
  app.classList.add('visible');
});
```

- [ ] **Step 3.3: Verify splash click unlocks audio**

Reload the page. You should see the splash. Click anywhere on it.

**Expected:**
- Splash fades out over ~400ms.
- Background video is visible (was playing silently behind it).
- **Audio starts playing** — you should hear the theme song.
- The profile card is now visible (even though it's mostly unstyled — that's Task 4).
- DevTools Console: no errors.

If audio doesn't play, check DevTools Console for `audio play failed` warnings. The most common cause is a malformed src path (check Network tab).

- [ ] **Step 3.4: Commit**

```bash
git add js/script.js css/style.css
git commit -m "splash: unlock audio and video on click, fade out overlay"
```

---

## Task 4: Profile card visual styling

**Files:**
- Modify: `R:/givey.zip/css/style.css`

- [ ] **Step 4.1: Add profile card styles**

Append to `css/style.css`:

```css
.profile-card {
  position: relative;
  width: 340px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 0 0 20px;
  overflow: hidden;
}

.banner {
  height: 80px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pfp {
  display: block;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.9);
  margin: -44px auto 12px;
  object-fit: cover;
  background: #111;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

.name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.verified {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
}

.bio {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  min-height: 1.3em;
  margin-bottom: 14px;
}

.cursor {
  display: inline-block;
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  to { visibility: hidden; }
}

.socials {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
}

.socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
}

.socials a:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.view-counter {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
```

- [ ] **Step 4.2: Verify the profile card is visible and styled**

Refresh, click splash.

**Expected:** Centered dark card with:
- Grey banner at top
- Circular profile picture overlapping the banner bottom
- `givey` name in white with a blue verified checkmark
- Empty bio line with a blinking `|` cursor
- Empty socials row (icons come in Task 5)
- View counter placeholder `👁 0` in top-right

The card should look close to the reference screenshot aside from missing social icons and the still-empty bio text.

- [ ] **Step 4.3: Commit**

```bash
git add css/style.css
git commit -m "profile: add profile card styles (card, pfp, name, bio, socials row)"
```

---

## Task 5: Socials config + wiring + icons

**Files:**
- Create: `R:/givey.zip/js/config.js`
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 5.1: Create `js/config.js`**

```js
export const SOCIALS = {
  github:    'https://github.com/givey999',
  instagram: '',
  tiktok:    '',
  roblox:    '',
  namemc:    '',
  discord:   'https://discord.com/users/934479569539444786',
};

// Inline SVG icons so we don't ship a separate file per social
export const SOCIAL_ICONS = {
  github:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58C20.56 22.3 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.89 5.89 0 0 0-2.13 1.38A5.89 5.89 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.89 5.89 0 0 0 1.38 2.13 5.89 5.89 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.89 5.89 0 0 0 2.13-1.38 5.89 5.89 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.89 5.89 0 0 0-1.38-2.13A5.89 5.89 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>',
  tiktok:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.67a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>',
  roblox:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4.938 0L0 19.063 19.063 24 24 4.938 4.938 0zm9.54 14.47l-4.946-1.27 1.27-4.946 4.946 1.27-1.27 4.946z"/></svg>',
  namemc:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" font-family="monospace" fill="#000" font-weight="900">NM</text></svg>',
};
```

- [ ] **Step 5.2a: Add the config import at the TOP of `js/script.js`**

ES modules require all `import` statements at the top of the file. Add this line right after the existing `import { pickRandom } from './themes.js';`:

```js
import { SOCIALS, SOCIAL_ICONS } from './config.js';
```

- [ ] **Step 5.2b: Append the social wiring code at the bottom of `js/script.js`**

```js
const socialsContainer = document.querySelector('.socials');
const socialOrder = ['github', 'instagram', 'tiktok', 'roblox', 'namemc'];

for (const key of socialOrder) {
  const url = SOCIALS[key];
  if (!url) continue;  // Hide socials with empty URLs
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', key);
  a.innerHTML = SOCIAL_ICONS[key];
  socialsContainer.appendChild(a);
}

// Wire Discord button too (used by Task 6's Discord card, but config reads live here)
const discordButton = document.querySelector('.discord-button');
if (SOCIALS.discord) {
  discordButton.href = SOCIALS.discord;
}
```

- [ ] **Step 5.3: Verify social icons appear and work**

Refresh + click splash.

**Expected:**
- Profile card now shows a single icon (GitHub) since Instagram/TikTok/Roblox/NameMC URLs are empty in config.
- Click the GitHub icon — opens `https://github.com/givey999` in a new tab.
- Click the "Add on Discord" button — opens the Discord profile URL in a new tab.

Fill in Instagram/TikTok/Roblox/NameMC URLs in `js/config.js` when you have them; icons will appear automatically on refresh.

- [ ] **Step 5.4: Commit**

```bash
git add js/config.js js/script.js
git commit -m "socials: add config, inline svg icons, and wire links to open in new tabs"
```

---

## Task 6: Typing animation for bio

**Files:**
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 6.1: Add typing animation**

Append to `js/script.js`:

```js
const BIO_TEXT = 'wanna be web developer';
const bioEl = document.querySelector('.bio-text');

function typeBio() {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= BIO_TEXT.length) {
      clearInterval(interval);
      return;
    }
    bioEl.textContent = BIO_TEXT.slice(0, i + 1);
    i++;
  }, 60);
}

// Trigger typing after splash dismiss (wire into the existing splash click listener).
// Find the splash click listener above and add `typeBio();` inside, after the app becomes visible.
```

- [ ] **Step 6.2: Call `typeBio()` from the splash handler**

Edit the existing splash click listener in `js/script.js` to call `typeBio()` after `app.classList.add('visible')`. The updated handler should look like:

```js
splash.addEventListener('click', async () => {
  try { await video.play(); } catch (e) { console.warn('video play failed:', e); }
  try { await audio.play(); } catch (e) { console.warn('audio play failed:', e); }

  splash.classList.add('hidden');
  splash.addEventListener('transitionend', () => {
    splash.style.display = 'none';
  }, { once: true });

  app.hidden = false;
  app.classList.add('visible');
  typeBio();
});
```

- [ ] **Step 6.3: Verify the typing animation**

Refresh + click splash.

**Expected:** After the splash fades, `wanna be web developer` types out character-by-character over ~1.3 seconds. The `|` cursor blinks continuously. If you navigate to `/projects` later and come back, the bio should still be typed (the animation only runs once per page load).

- [ ] **Step 6.4: Commit**

```bash
git add js/script.js
git commit -m "bio: add typing animation triggered after splash dismiss"
```

---

## Task 7: Discord card styling

**Files:**
- Modify: `R:/givey.zip/css/style.css`

- [ ] **Step 7.1: Add Discord card styles**

Append to `css/style.css`:

```css
.discord-card {
  width: 340px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.discord-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
}

.discord-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.discord-button {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.8rem;
  text-decoration: none;
  transition: background 0.2s;
}

.discord-button:hover {
  background: rgba(255, 255, 255, 0.14);
}
```

- [ ] **Step 7.2: Verify the Discord card**

Refresh + click splash.

**Expected:**
- Below the profile card, a dark rounded card shows `🟢 @givey` on the left and `Add on Discord` button on the right.
- The green dot has a subtle glow.
- Clicking the button opens `https://discord.com/users/934479569539444786` in a new tab.

- [ ] **Step 7.3: Commit**

```bash
git add css/style.css
git commit -m "discord: style discord presence card with online dot and button"
```

---

## Task 8: Music player — UI + real audio binding

**Files:**
- Modify: `R:/givey.zip/css/style.css`
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 8.1: Add music player CSS**

Append to `css/style.css`:

```css
.music-player {
  width: 340px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
}

.song-title {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-pause {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--accent, #ff2a2a);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}

.play-pause:hover {
  transform: scale(1.08);
}

.progress-wrap {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: var(--accent, #ff2a2a);
  transition: width 0.1s linear;
}

.time-display {
  flex: 0 0 auto;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 8.2: Wire the music player in `js/script.js`**

Append to `js/script.js`:

```js
const songTitleEl = document.querySelector('.song-title');
const playPauseBtn = document.querySelector('.play-pause');
const progressBar = document.querySelector('.progress-bar');
const timeDisplay = document.querySelector('.time-display');

songTitleEl.textContent = theme.title;

// Accent color drives progress bar and play button
document.documentElement.style.setProperty('--accent', theme.accent);

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = `${pct}%`;
  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

audio.addEventListener('loadedmetadata', () => {
  timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
});

audio.addEventListener('play',  () => { playPauseBtn.textContent = '❚❚'; });
audio.addEventListener('pause', () => { playPauseBtn.textContent = '▶'; });

playPauseBtn.addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
});
```

- [ ] **Step 8.3: Verify the music player works**

Refresh + click splash.

**Expected:**
- Below the Discord card, the music player shows the song title (`DUNGA` or `douji feva`), a circular play/pause button in the theme accent color, a progress bar, and a time display.
- The play button icon changes from `▶` to `❚❚` when playing.
- The progress bar fills up as the song plays.
- The time display counts up (e.g., `0:23 / 3:06`).
- Clicking the play/pause button actually pauses and resumes the song.

- [ ] **Step 8.4: Commit**

```bash
git add css/style.css js/script.js
git commit -m "player: wire music player UI to real audio element with progress and controls"
```

---

## Task 9: Accent-driven glows + hover tilt

**Files:**
- Modify: `R:/givey.zip/css/style.css`
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 9.1: Add accent-driven glow styles**

Append to `css/style.css`:

```css
.name {
  text-shadow: 0 0 12px var(--accent, #ff2a2a);
}

.verified {
  background: var(--accent, #ff2a2a);
  box-shadow: 0 0 8px var(--accent, #ff2a2a);
}

.profile-card,
.discord-card,
.music-player {
  transition: box-shadow 0.4s ease, transform 0.15s ease-out;
}

#app.visible .profile-card,
#app.visible .discord-card,
#app.visible .music-player {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 rgba(255, 42, 42, 0);
}

#app.visible .profile-card:hover,
#app.visible .discord-card:hover,
#app.visible .music-player:hover {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px var(--accent, #ff2a2a);
}
```

- [ ] **Step 9.2: Add JS-driven hover tilt**

Append to `js/script.js`:

```js
const tiltTargets = document.querySelectorAll('.profile-card, .discord-card, .music-player');

for (const card of tiltTargets) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotX = (-y * 6).toFixed(2);
    const rotY = (x * 6).toFixed(2);
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}
```

- [ ] **Step 9.3: Verify glows and tilt**

Refresh + click splash.

**Expected:**
- Name `givey` has a subtle colored glow around it (red for `dunga`, purple for `douji feva`).
- Verified badge background matches the accent color.
- Hovering over any card: the card subtly tilts toward your cursor (max ~6 degrees) and gains a colored glow around the edges matching the accent.
- Moving the cursor away returns it to flat/normal.

- [ ] **Step 9.4: Commit**

```bash
git add css/style.css js/script.js
git commit -m "polish: add accent-driven glows and hover tilt on cards"
```

---

## Task 10: Fake view counter

**Files:**
- Modify: `R:/givey.zip/js/script.js`

- [ ] **Step 10.1: Add fake counter logic**

Append to `js/script.js`:

```js
const viewCountEl = document.querySelector('.view-count');
let viewCount = Math.floor(1000 + Math.random() * 1000);
viewCountEl.textContent = viewCount.toLocaleString();

// Increment when splash is dismissed — add this INSIDE the splash click listener you already wrote.
```

- [ ] **Step 10.2: Update the splash click listener to increment the counter**

Edit the existing splash click listener to call the counter update. Add this line inside the handler, after `typeBio();`:

```js
  viewCount += 1;
  viewCountEl.textContent = viewCount.toLocaleString();
```

- [ ] **Step 10.3: Verify the counter**

Refresh. Before clicking the splash, the counter already shows a random number between 1000-2000 (though you can't see it because the app is hidden — that's fine).

Click the splash.

**Expected:** View counter in the top-right of the profile card shows a number like `1,247` (localized with comma). Refresh → new random number.

- [ ] **Step 10.4: Commit**

```bash
git add js/script.js
git commit -m "counter: add fake view counter with random baseline and splash increment"
```

---

## Task 11: SPA router (home ↔ projects)

**Files:**
- Create: `R:/givey.zip/js/router.js`
- Modify: `R:/givey.zip/js/script.js`
- Modify: `R:/givey.zip/css/style.css`

- [ ] **Step 11.1: Create `js/router.js`**

```js
const ROUTES = ['home', 'projects'];

function pathToRoute(pathname) {
  if (pathname === '/' || pathname === '/index.html' || pathname === '') return 'home';
  if (pathname === '/projects') return 'projects';
  return 'home';
}

function showRoute(route) {
  for (const name of ROUTES) {
    const section = document.querySelector(`[data-route="${name}"]`);
    if (!section) continue;
    if (name === route) {
      section.hidden = false;
      requestAnimationFrame(() => section.classList.add('route-visible'));
    } else {
      section.classList.remove('route-visible');
      // Delay hiding to allow fade-out transition
      setTimeout(() => { section.hidden = true; }, 300);
    }
  }
}

export function initRouter() {
  showRoute(pathToRoute(location.pathname));

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route-link]');
    if (!link) return;
    e.preventDefault();
    const route = link.dataset.routeLink;
    const path = route === 'home' ? '/' : `/${route}`;
    history.pushState({}, '', path);
    showRoute(route);
  });

  window.addEventListener('popstate', () => {
    showRoute(pathToRoute(location.pathname));
  });
}

// Sanity checks
console.assert(pathToRoute('/') === 'home', 'root should map to home');
console.assert(pathToRoute('/projects') === 'projects', '/projects should map to projects');
console.assert(pathToRoute('/garbage') === 'home', 'unknown path should fall back to home');
```

- [ ] **Step 11.2: Add route transition CSS**

Append to `css/style.css`:

```css
[data-route] {
  opacity: 0;
  transition: opacity 300ms ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

[data-route][hidden] {
  display: none !important;
}

[data-route].route-visible {
  opacity: 1;
}

.projects-link {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-decoration: none;
  margin-top: 4px;
  transition: color 0.2s;
}

.projects-link:hover {
  color: var(--accent, #ff2a2a);
}
```

- [ ] **Step 11.3: Import and initialize the router in `js/script.js`**

Add this import at the top of `js/script.js` (alongside existing imports):

```js
import { initRouter } from './router.js';
```

And append at the bottom of `js/script.js`:

```js
initRouter();
```

- [ ] **Step 11.4: Verify router navigation**

Refresh + click splash.

**Expected:**
- Home section is visible.
- Click `see projects →` — URL changes to `/projects` (visible in address bar), home section fades out, projects section fades in (empty card for now, populated in Task 12).
- **Music keeps playing** — the song does not stop or restart.
- **Background video keeps playing** — does not reset.
- Click `← back` — URL returns to `/`, projects fades out, home fades in.
- Browser back/forward buttons also work.

- [ ] **Step 11.5: Commit**

```bash
git add js/router.js js/script.js css/style.css
git commit -m "router: add SPA router with fade transitions between home and projects"
```

---

## Task 12: Projects data + render

**Files:**
- Create: `R:/givey.zip/js/projects.js`
- Modify: `R:/givey.zip/js/script.js`
- Modify: `R:/givey.zip/css/style.css`
- Create: `R:/givey.zip/assets/projects/` (empty folder)

- [ ] **Step 12.1: Create the assets/projects folder**

```bash
mkdir -p R:/givey.zip/assets/projects
```

(Leave it empty for now — thumbnails go here later.)

- [ ] **Step 12.2: Create `js/projects.js`**

```js
export const projects = [
  {
    id: 'donuttrade',
    title: 'donuttrade.com',
    description: 'Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL.',
    thumbnail: 'assets/projects/donuttrade.png',  // placeholder — add image later
    url: 'https://donuttrade.com',
  },
];
```

- [ ] **Step 12.3: Render projects in `js/script.js`**

Add this import at the top of `js/script.js`:

```js
import { projects } from './projects.js';
```

Append at the bottom of `js/script.js` (before `initRouter()`):

```js
const projectsListEl = document.querySelector('.projects-list');

for (const project of projects) {
  const entry = document.createElement('a');
  entry.href = project.url;
  entry.target = '_blank';
  entry.rel = 'noopener';
  entry.className = 'project-entry';
  entry.innerHTML = `
    <div class="project-thumb" style="background-image:url('${project.thumbnail}')"></div>
    <div class="project-text">
      <div class="project-title">${project.title}</div>
      <div class="project-description">${project.description}</div>
    </div>
    <span class="project-arrow">↗</span>
  `;
  projectsListEl.appendChild(entry);
}
```

- [ ] **Step 12.4: Add projects card styles**

Append to `css/style.css`:

```css
.projects-card {
  width: 420px;
  max-width: 90vw;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 18px 20px;
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.projects-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.back-link {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--accent, #ff2a2a);
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 50vh;
  overflow-y: auto;
}

.project-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: #fff;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
}

.project-entry:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent, #ff2a2a);
}

.project-thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #222 center/cover no-repeat;
}

.project-text { flex: 1; min-width: 0; }

.project-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 3px;
}

.project-description {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
}

.project-arrow {
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
}
```

- [ ] **Step 12.5: Verify the projects page**

Refresh + click splash. Click `see projects →`.

**Expected:**
- Projects card appears with header `projects` and `← back` on the right.
- One project entry: `donuttrade.com` with a placeholder (dark grey) thumbnail box, the description, and a `↗` arrow on the right.
- Hovering the entry: border takes the accent color, background brightens.
- Clicking the entry opens `https://donuttrade.com` in a new tab.
- Music player is still visible and playing below.

(The thumbnail will be a plain grey box until you drop `assets/projects/donuttrade.png` in. The 404 on the missing image is expected at this point.)

- [ ] **Step 12.6: Commit**

```bash
git add js/projects.js js/script.js css/style.css assets/projects
git commit -m "projects: render project entries with thumbnails, descriptions, and external links"
```

---

## Task 13: Responsive scaling + layout polish

**Files:**
- Modify: `R:/givey.zip/css/style.css`

- [ ] **Step 13.1: Add mobile scaling**

Append to `css/style.css`:

```css
@media (max-width: 480px) {
  .profile-card,
  .discord-card,
  .music-player {
    width: min(340px, 92vw);
  }

  .projects-card {
    width: min(420px, 92vw);
    padding: 14px 16px;
  }

  .project-thumb { flex-basis: 44px; width: 44px; height: 44px; }
  .splash-text { font-size: 1rem; }
}

@media (max-height: 780px) {
  #app { gap: 8px; }
  .profile-card .banner { height: 60px; }
  .profile-card .pfp { width: 76px; height: 76px; margin: -38px auto 10px; }
}
```

- [ ] **Step 13.2: Verify responsive scaling**

Open DevTools, toggle device toolbar (Ctrl+Shift+M), try:
- iPhone 14 Pro (393x852): all cards visible, not cut off.
- iPad Mini (768x1024): still centered, not too wide.
- Short laptop (1366x768): card stack fits without scrolling.

**Expected:** All layouts stay usable and centered, nothing overlaps or overflows.

- [ ] **Step 13.3: Commit**

```bash
git add css/style.css
git commit -m "responsive: add mobile and short-viewport scaling"
```

---

## Task 14: Assets .gitattributes + commit assets

**Files:**
- Create: `R:/givey.zip/.gitattributes`

- [ ] **Step 14.1: Mark binary media as binary to avoid line-ending weirdness**

Create `R:/givey.zip/.gitattributes`:

```
*.mp3 binary
*.mp4 binary
*.jpg binary
*.jpeg binary
*.png binary
*.webm binary
```

- [ ] **Step 14.2: Commit assets**

```bash
cd R:/givey.zip
git add .gitattributes assets/
git status
```

Review the `git status` output — confirm it's adding `pfp.jpg`, both theme folders with their `audio.mp3` + `video.mp4`, and nothing unexpected.

```bash
git commit -m "assets: add pfp, dunga theme, and douji feva theme"
```

---

## Task 15: Caddy block + deploy instructions

**Files:**
- Create: `R:/givey.zip/Caddyfile.givey`
- Create: `R:/givey.zip/DEPLOY.md`

- [ ] **Step 15.1: Create `Caddyfile.givey`**

```
# givey.zip — personal bio site
# Merge this block into the droplet's Caddyfile.production (or import it).
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

- [ ] **Step 15.2: Create `DEPLOY.md`**

```markdown
# Deploying givey.zip

This site is a static bundle served by Caddy on the donuttrade droplet.

## Prerequisites

1. DNS `A` record for `givey.zip` → droplet public IP.
2. Caddy on the droplet has access to `/srv/givey` (directory exists, readable by the Caddy process).
3. The new site block from `Caddyfile.givey` is merged into the production Caddyfile (or imported).

## Initial droplet setup (run once on the droplet)

```bash
sudo mkdir -p /srv/givey
sudo chown -R $USER:$USER /srv/givey
```

Merge the contents of `Caddyfile.givey` into `/path/to/donuttrade/Caddyfile.production`
(or use a `import` directive). Then reload Caddy:

```bash
# If Caddy runs in donuttrade's docker-compose:
cd /path/to/donuttrade
docker compose -f docker-compose.yml -f docker-compose.production.yml restart caddy

# Or if Caddy runs as a systemd service:
sudo systemctl reload caddy
```

## Each deploy (from your local machine)

```bash
cd R:/givey.zip
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'docs' \
  --exclude 'reference' \
  --exclude 'DEPLOY.md' \
  --exclude 'Caddyfile.givey' \
  --exclude '.gitignore' \
  --exclude '.gitattributes' \
  ./ user@droplet-ip:/srv/givey/
```

No service reload needed after file sync — Caddy's `file_server` picks up changes on each request.

## Smoke test after deploy

1. `curl -I https://givey.zip/` → `200 OK`
2. `curl -I https://givey.zip/projects` → `200 OK` (served by `try_files` fallback)
3. `curl -sL https://givey.zip/ | grep 'click to join heaven'` → should find the splash text
4. Open `https://givey.zip` in a browser, click splash, verify audio plays and a random theme loads.
```

- [ ] **Step 15.3: Commit the deploy files**

```bash
git add Caddyfile.givey DEPLOY.md
git commit -m "deploy: add caddy block and deploy instructions"
```

---

## Task 16: Final end-to-end verification

- [ ] **Step 16.1: Clear cache and hard reload a few times**

With the dev server running, open an incognito window to `http://localhost:8000`. Verify every pass:

- [ ] Splash appears with pulsing text
- [ ] Clicking splash dismisses it and starts audio
- [ ] A random theme is selected (refresh 5x, confirm you see both `dunga` and `douji feva`)
- [ ] Profile card shows pfp, name, verified badge, bio typing out, social icons (GitHub visible, others hidden if not filled in), view counter
- [ ] Discord card shows handle + green dot + button that opens Discord URL
- [ ] Music player shows title, play/pause works, progress bar fills, time updates
- [ ] Hover tilt works on all cards
- [ ] Glow effects match the random theme's accent color
- [ ] Clicking `see projects →` navigates without stopping audio
- [ ] Projects section shows donuttrade entry, clickable
- [ ] `← back` returns home, still no audio interruption
- [ ] Browser back/forward buttons work
- [ ] Mobile viewport (DevTools device mode): cards fit, nothing clipped

- [ ] **Step 16.2: Lighthouse sanity check**

In DevTools, run Lighthouse on the page (after dismissing splash). Performance and Accessibility should both be 80+. Fix obvious issues if they appear (e.g., missing `alt` on an image).

- [ ] **Step 16.3: Final commit if anything changed**

```bash
cd R:/givey.zip
git status
```

If anything is modified from the Lighthouse pass, commit it:

```bash
git add -A
git commit -m "polish: address lighthouse findings"
```

---

## Summary of acceptance checks (quick reference)

| # | Task | What to see/hear |
|---|------|------------------|
| 1 | Scaffold | Black page, pulsing splash text, no console errors |
| 2 | Themes + video | Background video plays behind splash, random per refresh |
| 3 | Splash unlock | Click splash → audio plays, splash fades out |
| 4 | Profile card | Centered dark card with pfp, name, empty bio |
| 5 | Socials | GitHub icon clickable (others hidden), Discord button opens profile |
| 6 | Typing | Bio types out over ~1.3s |
| 7 | Discord card | Dark card with handle, green dot, button |
| 8 | Music player | Title, play/pause, real progress bar, time display |
| 9 | Glow + tilt | Accent colors on name/badge, hover tilts card |
| 10 | Counter | Random baseline + 1 on splash click |
| 11 | Router | `/` ↔ `/projects` without audio interruption |
| 12 | Projects data | donuttrade entry visible and clickable |
| 13 | Responsive | Mobile viewport stays usable |
| 14 | Assets in git | Binary files committed with `.gitattributes` |
| 15 | Caddy + deploy | Caddyfile block + rsync instructions ready |
| 16 | E2E verify | All of the above working together in incognito |

## Out of scope (for a future iteration)

- Real Lanyard / Discord presence
- Real Spotify currently-playing
- Real persistent view counter (needs backend)
- Blog / additional routes
- Analytics
- Multi-level routing (e.g., `/projects/donuttrade`)
