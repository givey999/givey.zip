export const projects = [
  {
    id: 'donuttrade',
    title: 'donuttrade.com',
    name: 'donuttrade',
    description: 'Minecraft trading platform. TypeScript, Next.js, Fastify, Docker, PostgreSQL.',
    details:
      "A trading platform for DonutSMP — built so players can finally trust each other in trades instead of hoping the other side ships. Listings, escrow-style holds, search, and a clean Next.js frontend on top of a Fastify API and Postgres. Runs in Docker behind Caddy.",
    tech: ['TypeScript', 'Next.js', 'Fastify', 'PostgreSQL', 'Docker'],
    url: 'https://donuttrade.com',
    github: 'https://github.com/givey999/donuttrade',
    thumbnail: null,
  },
  {
    id: 'dst',
    title: 'dst.givey.zip',
    name: 'dst',
    description: 'Encrypted infinite storage over Discord. Windows Electron app, AES-256-GCM per-chunk, zero-knowledge, folders + preview + rename.',
    details:
      "Discord has free unlimited attachments. dst turns that into a real filesystem: chunked uploads, AES-256-GCM per-chunk encryption with keys derived client-side, folders, previews, rename. Zero-knowledge — the server side only ever sees ciphertext. Ships as a Windows Electron app.",
    tech: ['TypeScript', 'Electron', 'AES-256-GCM', 'Node.js'],
    url: 'https://dst.givey.zip',
    github: 'https://github.com/givey999/dst',
    thumbnail: null,
  },
  {
    id: 'omu',
    title: 'omu.givey.zip',
    name: 'omu',
    description: 'Polite username availability scanner. Personal-use Python CLI, closed access — dm on discord for a copy.',
    details:
      "A username availability scanner for sniping handles across platforms. Polite by design — rate-limit aware, backoff on 429s, no hammering. It's a personal tool I use myself, so the repo is private. DM on Discord if you want a copy.",
    tech: ['Python', 'CLI', 'asyncio'],
    url: 'https://omu.givey.zip',
    github: null,
    thumbnail: null,
  },
  {
    id: 'givey-zip',
    title: 'givey.zip',
    description: 'This site. Static HTML/CSS/ESM JavaScript, no framework, card-flip projects view, live Discord presence, random theme pairs per load.',
    details:
      "My bio site. Deliberately built without a framework or build step — every file the browser sees is checked into the repo. 4 random theme pairs (background video + music) per load, a CSS 3D card flip for the projects view, live Discord presence via Lanyard, and a sparkles canvas behind the name. ~10 JS modules, each under 100 lines.",
    tech: ['HTML', 'CSS', 'Vanilla JS', 'ESM'],
    url: 'https://givey.zip',
    github: 'https://github.com/givey999/givey.zip',
    thumbnail: null,
  },
]
