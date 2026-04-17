const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890!@#$%^&*()_+-=[]{}|;:,.<>?/~`'

export function glitchText(el, finalText, duration = 1400) {
  const start = performance.now()
  let timer = null

  function tick() {
    const progress = Math.min(1, (performance.now() - start) / duration)
    let out = ''
    for (let i = 0; i < finalText.length; i++) {
      const ch = finalText[i]
      if (ch === ' ') { out += ' '; continue }
      const localProgress = Math.max(0, Math.min(1, progress * 1.4 - i / finalText.length * 0.4))
      if (Math.random() < localProgress) {
        out += ch
      } else {
        out += CHARS[Math.floor(Math.random() * CHARS.length)]
      }
    }
    el.textContent = out
    if (progress < 1) {
      timer = setTimeout(tick, 45)
    } else {
      el.textContent = finalText
    }
  }
  tick()
  return () => { if (timer) clearTimeout(timer) }
}
