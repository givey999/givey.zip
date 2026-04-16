const MAX_DEG = 6

export function initTilt(stack) {
  function onMove(e) {
    if (stack.classList.contains('is-flipping')) return
    const rect = stack.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    const rotY = (x / (rect.width / 2)) * MAX_DEG
    const rotX = -(y / (rect.height / 2)) * MAX_DEG
    const base = stack.classList.contains('flipped') ? 'rotateY(180deg) ' : ''
    stack.style.transform = `${base}rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
  }

  function onLeave() {
    stack.style.transform = ''
  }

  window.addEventListener('mousemove', onMove)
  stack.addEventListener('mouseleave', onLeave)
}
