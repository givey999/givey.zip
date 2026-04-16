const FLIP_DURATION_MS = 700

export function initFlip(stack) {
  stack.addEventListener('click', (e) => {
    const link = e.target.closest('[data-flip-to]')
    if (!link) return
    e.preventDefault()
    const to = link.dataset.flipTo
    const shouldFlip = to === 'back'
    if (stack.classList.contains('flipped') === shouldFlip) return

    stack.classList.add('is-flipping')
    stack.classList.toggle('flipped', shouldFlip)
    setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
  })
}
