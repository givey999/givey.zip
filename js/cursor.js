export function initCursor(img) {
  if (window.matchMedia('(pointer: coarse)').matches) {
    img.remove()
    return
  }

  let visible = false

  function show() {
    if (visible) return
    visible = true
    img.classList.add('visible')
  }

  function hide() {
    if (!visible) return
    visible = false
    img.classList.remove('visible')
  }

  window.addEventListener('mousemove', (e) => {
    img.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    show()
  })

  document.addEventListener('mouseleave', hide)
  document.addEventListener('mouseenter', show)
}
