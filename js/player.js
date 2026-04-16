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
