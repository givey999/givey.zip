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
