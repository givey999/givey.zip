const MAX_DEG = 6

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export function initTilt(stack) {
  function onMove(e) {
    if (stack.classList.contains('is-flipping')) return
    const rect = stack.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    const rotY = clamp((x / (rect.width / 2)) * MAX_DEG, -MAX_DEG, MAX_DEG)
    const rotX = clamp(-(y / (rect.height / 2)) * MAX_DEG, -MAX_DEG, MAX_DEG)
    let base = ''
    if (stack.classList.contains('flipped-projects')) base = 'rotateY(180deg) '
    else if (stack.classList.contains('flipped-crypto')) base = 'rotateY(-180deg) '
    stack.style.transform = `${base}rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
  }

  window.addEventListener('mousemove', onMove)
}
