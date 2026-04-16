import { pickRandom, themePaths } from './themes.js'
import { SOCIALS, BIO_TEXT, DISCORD_ID } from './config.js'
import { getIcon } from './icons.js'
import { initTypewriter } from './typewriter.js'
import { initPlayer } from './player.js'
import { initDiscord } from './lanyard.js'
import { projects } from './projects.js'
import { initFlip } from './flip.js'

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

function renderProjects() {
  const host = document.querySelector('.projects-list')
  host.innerHTML = projects.map((p) => `
    <a class="project-tile" href="${p.url}" target="_blank" rel="noopener noreferrer">
      <span class="project-tile-title">${p.title}</span>
      <span class="project-tile-desc">${p.description}</span>
    </a>
  `).join('')
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
  initFlip(stack)
}

renderSocials()
renderProjects()

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
