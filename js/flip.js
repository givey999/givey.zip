const FLIP_DURATION_MS = 700

export function initFlip(stack) {
  // Set initial height to whatever the front face naturally takes.
  syncStackHeight(stack)
  window.addEventListener('resize', () => syncStackHeight(stack))

  stack.addEventListener('click', (e) => {
    const link = e.target.closest('[data-flip-to]')
    if (!link) return
    e.preventDefault()

    const to = link.dataset.flipTo
    const isFlipped = stack.classList.contains('flipped-projects') || stack.classList.contains('flipped-about')

    if (to === 'front') {
      if (!isFlipped) return
      stack.classList.add('is-flipping')
      stack.classList.remove('flipped-projects', 'flipped-about')
      syncStackHeight(stack)
      setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
      return
    }

    if (stack.classList.contains(`flipped-${to}`)) return

    const projectsCard = stack.querySelector('.projects-card')
    const aboutCard = stack.querySelector('.about-card')
    if (projectsCard) projectsCard.hidden = to !== 'projects'
    if (aboutCard) aboutCard.hidden = to !== 'about'

    stack.classList.add('is-flipping')
    stack.classList.remove('flipped-projects', 'flipped-about')
    stack.classList.add(`flipped-${to}`)
    syncStackHeight(stack)
    setTimeout(() => stack.classList.remove('is-flipping'), FLIP_DURATION_MS)
  })
}

// Match the card-stack's height to whichever face is currently visible,
// so the music-player sits just below the active content with no empty gap.
function syncStackHeight(stack) {
  const front = stack.querySelector('.face.front')
  if (stack.classList.contains('flipped-projects')) {
    const card = stack.querySelector('.projects-card:not([hidden])')
    if (card) stack.style.height = card.offsetHeight + 'px'
  } else if (stack.classList.contains('flipped-about')) {
    const card = stack.querySelector('.about-card:not([hidden])')
    if (card) stack.style.height = card.offsetHeight + 'px'
  } else {
    stack.style.height = front.offsetHeight + 'px'
  }
}
