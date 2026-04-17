function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const ICON_PLAY   = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
const ICON_PAUSE  = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>`
const ICON_VOL_ON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77S18.01 4.14 14 3.23z"/></svg>`
const ICON_VOL_OFF = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`

export function initPlayer(audio, { host, title }) {
  host.innerHTML = `
    <div class="song-title">${title}</div>
    <div class="player-controls">
      <button class="play-pause" aria-label="play/pause">${ICON_PAUSE}</button>
      <div class="progress-wrap">
        <div class="progress-bar"></div>
      </div>
      <div class="time-display">0:00 / 0:00</div>
      <button class="volume-toggle" aria-label="mute">${ICON_VOL_ON}</button>
    </div>
  `

  const playBtn = host.querySelector('.play-pause')
  const progressWrap = host.querySelector('.progress-wrap')
  const progressBar = host.querySelector('.progress-bar')
  const timeDisplay = host.querySelector('.time-display')
  const volBtn = host.querySelector('.volume-toggle')

  function syncPlayButton() {
    playBtn.innerHTML = audio.paused ? ICON_PLAY : ICON_PAUSE
  }
  function syncTime() {
    const cur = audio.currentTime || 0
    const dur = audio.duration || 0
    timeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`
    progressBar.style.width = dur > 0 ? `${(cur / dur) * 100}%` : '0%'
  }
  function syncVolume() {
    volBtn.innerHTML = audio.muted || audio.volume === 0 ? ICON_VOL_OFF : ICON_VOL_ON
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
