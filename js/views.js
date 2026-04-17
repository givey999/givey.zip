const BASE = 56000
const NAMESPACE = 'givey-zip'
const KEY = 'visits'

export async function initViews(el) {
  try {
    const res = await fetch(`https://abacus.jasoncameron.dev/hit/${NAMESPACE}/${KEY}`)
    const json = await res.json()
    const value = json.value ?? 0
    el.textContent = (BASE + value).toLocaleString()
  } catch (err) {
    console.warn('view counter fetch failed:', err)
    el.textContent = BASE.toLocaleString()
  }
}
