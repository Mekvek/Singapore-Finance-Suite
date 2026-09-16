// Ensures the electron-builder winCodeSign cache has darwin placeholder files.
// Without these, 7-Zip fails on macOS symlinks when building on Windows
// machines that lack Developer Mode (which requires elevated symlink privilege).
const { mkdirSync, existsSync, writeFileSync } = require('fs')
const { join } = require('path')

const localAppData = process.env.LOCALAPPDATA
if (!localAppData) {
  console.log('[setup-win-cache] LOCALAPPDATA not set; skipping.')
  process.exit(0)
}

const darwinDir = join(
  localAppData,
  'electron-builder',
  'Cache',
  'winCodeSign',
  'winCodeSign-2.6.0',
  'darwin'
)

mkdirSync(darwinDir, { recursive: true })

for (const name of ['libcrypto.1.1.dylib', 'libssl.1.1.dylib']) {
  const p = join(darwinDir, name)
  if (!existsSync(p)) writeFileSync(p, '')
}

console.log('[setup-win-cache] winCodeSign darwin cache ready.')
