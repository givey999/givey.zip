export const pfps = [
  { id: 'pair1', pfpExt: 'jpg', bannerExt: 'gif' },
  { id: 'pair2', pfpExt: 'jpg', bannerExt: 'jpg' },
]

export function pfpPaths(pair) {
  const folder = encodeURIComponent(pair.id)
  return {
    pfp:    `assets/pfps/${folder}/pfp.${pair.pfpExt}`,
    banner: `assets/pfps/${folder}/banner.${pair.bannerExt}`,
  }
}

export function pickRandom() {
  return pfps[Math.floor(Math.random() * pfps.length)]
}
