export const themes = [
  { id: 'dunga',               title: 'dunga' },
  { id: 'douji feva',          title: 'douji feva' },
  { id: 'in the darkness',     title: 'in the darkness' },
  { id: 'miss the rage',       title: 'miss the rage' },
  { id: 'if looks could kill', title: 'if looks could kill' },
  { id: 'astro',               title: 'astro' },
  { id: 'klyn',                title: 'klyn' },
]

export function themePaths(theme) {
  const folder = encodeURIComponent(theme.id)
  return {
    video: `assets/background/${folder}/video.mp4`,
    audio: `assets/background/${folder}/audio.mp3`,
  }
}

export function pickRandom() {
  return themes[Math.floor(Math.random() * themes.length)]
}
