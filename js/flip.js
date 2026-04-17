const FLIP_DURATION_MS = 700

export function initFlip(stack) {
  stack.addEventListener('click', (e) => {
    const link = e.target.closest('[data-flip-to]')
    if (!link) return
    e.preventDefault()

    const to = link.dataset.flipTo
    const isFlipped = stack.classList.contains('flipped-projects') || stack.classList.contains('flipped-crypto')

    if (to === 'front') {
      if (!isFlipped) return
      stack.classList.add('is-flipping')
      stack.classList.remove('flipped-projects', 'flipped-crypto')
      setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
      return
    }

    if (stack.classList.contains(`flipped-${to}`)) return

    const projectsCard = stack.querySelector('.projects-card')
    const cryptoCard = stack.querySelector('.crypto-card')
    if (projectsCard) projectsCard.hidden = to !== 'projects'
    if (cryptoCard) cryptoCard.hidden = to !== 'crypto'

    stack.classList.add('is-flipping')
    stack.classList.remove('flipped-projects', 'flipped-crypto')
    stack.classList.add(`flipped-${to}`)
    setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
  })
}
