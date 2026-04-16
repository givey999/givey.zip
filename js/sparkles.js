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
