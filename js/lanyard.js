const WS_URL = 'wss://api.lanyard.rest/socket'
const MAX_RECONNECT_ATTEMPTS = 5
const INIT_TIMEOUT_MS = 3000

const STATUS_COLORS = {
  online:  '#23a55a',
  idle:    '#f0b232',
  dnd:     '#f23f43',
  offline: '#80848e',
}

// Snowflakes are 19 digits — past Number.MAX_SAFE_INTEGER, and `>>` truncates to
// int32 — so the default-avatar index has to be computed with BigInt.
function defaultAvatarUrl(id) {
  let index = 0
  try { index = Number((BigInt(id) >> 22n) % 6n) } catch { /* keep 0 */ }
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

function avatarUrl(user) {
  if (!user) return ''
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`
  return defaultAvatarUrl(user.id)
}

function activityLine(data) {
  const activities = data?.activities ?? []
  const spotify = data?.spotify
  if (spotify) return `🎵 listening to ${spotify.song} — ${spotify.artist}`
  const custom = activities.find((a) => a.type === 4)
  if (custom?.state) return `${custom.emoji?.name ?? ''} ${custom.state}`.trim()
  const game = activities.find((a) => a.type === 0)
  if (game?.name) return `playing ${game.name}`
  const listening = activities.find((a) => a.type === 2)
  if (listening?.name) return `listening to ${listening.name}`
  return ''
}

function renderStatic(host, userId, avatar, tag) {
  host.dataset.state = 'static'
  host.innerHTML = `
    <img class="discord-avatar" src="${avatar}" alt="${tag}" />
    <div class="discord-text">
      <div class="discord-tag"><span class="discord-dot" style="--dot:${STATUS_COLORS.offline}"></span>${tag}</div>
      <div class="discord-activity">offline</div>
    </div>
    <a class="discord-button" href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer">Add on Discord</a>
  `
}

function renderSuspended(host, avatar, tag) {
  host.dataset.state = 'suspended'
  host.innerHTML = `
    <img class="discord-avatar" src="${avatar}" alt="${tag}" />
    <div class="discord-text">
      <div class="discord-tag"><span class="discord-dot" style="--dot:${STATUS_COLORS.offline}"></span>${tag}</div>
      <div class="discord-activity">account unavailable</div>
    </div>
    <div class="discord-suspended" role="status">temporarily suspended</div>
  `
}

function renderLive(host, userId, data) {
  host.dataset.state = 'live'
  const user = data.discord_user
  const status = data.discord_status ?? 'offline'
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.offline
  const tag = user?.display_name || user?.global_name || user?.username || 'unknown'
  const activity = activityLine(data)

  host.innerHTML = `
    <img class="discord-avatar" src="${avatarUrl(user)}" alt="${tag}" />
    <div class="discord-text">
      <div class="discord-tag"><span class="discord-dot" style="--dot:${color}"></span>${tag}</div>
      <div class="discord-activity">${activity || status}</div>
    </div>
    <a class="discord-button" href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer">Add on Discord</a>
  `
}

export function initDiscord(host, userId, { suspended = false, name = 'givey' } = {}) {
  // A suspended account never shows up in Lanyard — skip the socket entirely
  // instead of burning the 3s INIT timeout on every page load.
  if (suspended) {
    renderSuspended(host, defaultAvatarUrl(userId), name)
    return
  }

  let ws = null
  let heartbeat = null
  let attempts = 0
  let gotInit = false
  let initTimer = null
  let fallbackShown = false

  function showFallback() {
    if (fallbackShown) return
    fallbackShown = true
    renderStatic(host, userId, defaultAvatarUrl(userId), name)
  }

  initTimer = setTimeout(() => { if (!gotInit) showFallback() }, INIT_TIMEOUT_MS)

  function connect() {
    ws = new WebSocket(WS_URL)

    ws.addEventListener('message', (evt) => {
      let msg
      try { msg = JSON.parse(evt.data) } catch { return }

      if (msg.op === 1) {
        // HELLO — subscribe + start heartbeat
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }))
        const interval = msg.d?.heartbeat_interval ?? 30000
        heartbeat = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }))
        }, interval)
      } else if (msg.op === 0) {
        // EVENT
        if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
          // Lanyard accepts a subscription for any snowflake and answers with an
          // empty payload when the account hasn't joined the Lanyard server.
          // Without this guard that renders as an "unknown" user with no avatar.
          if (!msg.d?.discord_user) {
            clearTimeout(initTimer)
            showFallback()
            return
          }
          gotInit = true
          fallbackShown = false
          clearTimeout(initTimer)
          renderLive(host, userId, msg.d)
        }
      }
    })

    ws.addEventListener('close', () => {
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null }
      attempts += 1
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        showFallback()
        return
      }
      const delay = Math.min(1000 * 2 ** attempts, 30000)
      setTimeout(connect, delay)
    })

    ws.addEventListener('error', () => { /* close handler will deal with it */ })
  }

  connect()
}
