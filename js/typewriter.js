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
