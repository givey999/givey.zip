import { pickRandom, themePaths } from './themes.js'
import { pickRandom as pickPfp, pfpPaths } from './pfps.js'
import { SOCIALS, BIO_TEXT, DISCORD_ID, CRYPTO } from './config.js'
import { getIcon } from './icons.js'
import { initTypewriter } from './typewriter.js'
import { initPlayer } from './player.js'
import { initDiscord } from './lanyard.js'
import { projects } from './projects.js'
import { initFlip } from './flip.js'
import { initTilt } from './tilt.js'
import { initSparkles } from './sparkles.js'
import { initCursor } from './cursor.js'
import { initViews } from './views.js'
import { glitchText } from './glitch.js'

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

const pfpPair = pickPfp()
const pfpAssets = pfpPaths(pfpPair)
const pfpImg = document.querySelector('.pfp')
const bannerEl = document.querySelector('.banner')
pfpImg.src = pfpAssets.pfp
bannerEl.style.backgroundImage = `url('${pfpAssets.banner}')`

function renderSocials() {
  const host = document.querySelector('.socials')
  host.innerHTML = SOCIALS.map(
    (s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">${getIcon(s.name)}</a>`
  ).join('')
}

function renderProjects() {
  const host = document.querySelector('.projects-list')
  host.innerHTML = projects.map((p) => `
    <a class="project-tile" href="${p.url}" target="_blank" rel="noopener noreferrer">
      <span class="project-tile-title">${p.title}</span>
      <span class="project-tile-desc">${p.description}</span>
    </a>
  `).join('')
}

function renderCrypto() {
  const host = document.querySelector('.crypto-list')
  host.innerHTML = CRYPTO.map((c) => `
    <div class="crypto-tile" data-address="${c.address}">
      <span class="crypto-tile-name">${c.name} <span class="crypto-tile-symbol">${c.symbol}</span></span>
      <span class="crypto-tile-address">${c.address}</span>
      <span class="crypto-tile-copied">copied!</span>
    </div>
  `).join('')

  host.addEventListener('click', (e) => {
    const tile = e.target.closest('.crypto-tile')
    if (!tile) return
    const addr = tile.dataset.address
    navigator.clipboard.writeText(addr).then(() => {
      const label = tile.querySelector('.crypto-tile-copied')
      label.classList.add('show')
      setTimeout(() => label.classList.remove('show'), 1200)
    })
  })
}

function revealApp() {
  splash.classList.add('hidden')
  app.hidden = false
  requestAnimationFrame(() => app.classList.add('visible'))
  splash.addEventListener('transitionend', () => { splash.style.display = 'none' }, { once: true })

  const bioEl = document.querySelector('.bio-text')
  initTypewriter(bioEl, BIO_TEXT)

  const playerHost = document.querySelector('.music-player')
  initPlayer(audio, { host: playerHost, title: theme.title })

  const discordHost = document.querySelector('.discord-card')
  initDiscord(discordHost, DISCORD_ID)

  const stack = document.querySelector('.card-stack')
  const tiltGroup = document.querySelector('.tilt-group')
  initFlip(stack)
  initTilt(tiltGroup)
  initSparkles(document.querySelector('.sparkles'), tiltGroup, stack)
}

renderSocials()
renderProjects()
renderCrypto()
initCursor(document.querySelector('.custom-cursor'))
initViews(document.querySelector('.views-count'))
glitchText(document.querySelector('.splash-text'), 'click to join heaven', 1400)

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
