const AMBIENT_COUNT = 30
const SPARKLE_LIFE_MS = 1600
const ANCHOR_PADDING = 30

const CURSOR_LIFE_MS = 1100
const CURSOR_BURST_MIN_GAP_MS = 32
const CURSOR_BURST_COUNT = 2
const CURSOR_IDLE_GAP_MS = 140
const CURSOR_IDLE_THRESHOLD_MS = 90

function randomPointInRect(rect) {
  return {
    x: (rect.left - ANCHOR_PADDING + Math.random() * (rect.width + ANCHOR_PADDING * 2)) * devicePixelRatio,
    y: (rect.top  - ANCHOR_PADDING + Math.random() * (rect.height + ANCHOR_PADDING * 2)) * devicePixelRatio,
  }
}

function anchorVisible(anchor, stack) {
  if (!anchor.offsetParent && anchor.offsetWidth === 0 && anchor.offsetHeight === 0) return false
  if (stack?.classList.contains('flipped-projects') || stack?.classList.contains('flipped-about')) return false
  return true
}

export function initSparkles(canvas, anchor, stack) {
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

  function spawnAmbient() {
    const rect = anchor.getBoundingClientRect()
    const { x, y } = randomPointInRect(rect)
    particles.push({
      kind: 'ambient',
      x, y,
      vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
      vy: (-0.45 + (Math.random() - 0.5) * 0.2) * devicePixelRatio,
      life: 0,
      ttl: SPARKLE_LIFE_MS + Math.random() * 900,
      size: (1.5 + Math.random() * 1.3) * devicePixelRatio,
    })
  }

  function spawnCursor(clientX, clientY) {
    particles.push({
      kind: 'cursor',
      x: (clientX + (Math.random() - 0.5) * 6) * devicePixelRatio,
      y: (clientY + (Math.random() - 0.5) * 6) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 1.8 * devicePixelRatio,
      vy: (0.35 + Math.random() * 0.75) * devicePixelRatio,
      life: 0,
      ttl: CURSOR_LIFE_MS + Math.random() * 400,
      size: (1.4 + Math.random() * 1.1) * devicePixelRatio,
    })
  }

  for (let i = 0; i < AMBIENT_COUNT; i++) spawnAmbient()

  let cursorX = null, cursorY = null
  let lastMoveTime = 0
  let lastBurstSpawn = 0
  let lastIdleSpawn = 0

  window.addEventListener('mousemove', (e) => {
    cursorX = e.clientX
    cursorY = e.clientY
    lastMoveTime = performance.now()
    if (lastMoveTime - lastBurstSpawn < CURSOR_BURST_MIN_GAP_MS) return
    lastBurstSpawn = lastMoveTime
    for (let i = 0; i < CURSOR_BURST_COUNT; i++) spawnCursor(cursorX, cursorY)
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

    const now = performance.now()
    const ambientVisible = anchorVisible(anchor, stack)
    const cursorKnown = cursorX !== null
    const cursorIdle = cursorKnown && (now - lastMoveTime > CURSOR_IDLE_THRESHOLD_MS)
    if (cursorIdle && now - lastIdleSpawn > CURSOR_IDLE_GAP_MS) {
      lastIdleSpawn = now
      spawnCursor(cursorX, cursorY)
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life += dt
      p.x += p.vx * (dt / 16)
      p.y += p.vy * (dt / 16)
      const alpha = 1 - p.life / p.ttl
      if (alpha <= 0) {
        if (p.kind === 'ambient') {
          const rect = anchor.getBoundingClientRect()
          const next = randomPointInRect(rect)
          p.life = 0
          p.x = next.x
          p.y = next.y
          p.vx = (Math.random() - 0.5) * 0.12 * devicePixelRatio
          p.vy = (-0.25 + (Math.random() - 0.5) * 0.25) * devicePixelRatio
          p.ttl = SPARKLE_LIFE_MS + Math.random() * 900
        } else {
          particles.splice(i, 1)
        }
        continue
      }
      if (p.kind === 'ambient' && !ambientVisible) continue
      drawSparkle(p, Math.max(0, Math.min(1, alpha)))
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
