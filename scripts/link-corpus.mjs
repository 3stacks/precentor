// Put the corpus into the native app bundle.
//
// The web app fetches public/corpus/ from the server. The iOS and Android apps
// carry the same files as assets, so that every psalm plays with no network.
// Metro bundles a ".json" file as code, so this script links each file to
// assets/corpus/ with the extension ".corpus". metro.config.js treats that
// extension as an asset. The script also writes src/data/corpusAssets.native.ts,
// the map from a corpus path to its asset.
//
// It makes hard links, so the copy takes no disk space. It copies when a link
// fails, for example across two file systems.

import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = join(dirname(new URL(import.meta.url).pathname), '..')
const from = join(root, 'public/corpus')
const to = join(root, 'assets/corpus')
const mapFile = join(root, 'src/data/corpusAssets.native.ts')

if (!existsSync(join(from, 'index.json'))) {
  console.log('link-corpus: public/corpus/ is missing. Run "npm run corpus" first.')
  process.exit(0)
}

const files = []
for (const dir of ['', 'psalms', 'settings', 'tunes']) {
  for (const name of readdirSync(join(from, dir)).sort()) {
    if (!name.endsWith('.json') || !statSync(join(from, dir, name)).isFile()) continue
    files.push(dir ? `${dir}/${name}` : name)
  }
}

rmSync(to, { recursive: true, force: true })
for (const file of files) {
  const target = join(to, file.replace(/\.json$/, '.corpus'))
  mkdirSync(dirname(target), { recursive: true })
  try {
    linkSync(join(from, file), target)
  } catch {
    copyFileSync(join(from, file), target)
  }
}

// In a Docker build, npm ci runs this before src/ is copied in.
mkdirSync(dirname(mapFile), { recursive: true })
const lines = files.map((file) => `  '${file}': require('../../assets/corpus/${file.replace(/\.json$/, '.corpus')}'),`)
writeFileSync(
  mapFile,
  `// Written by scripts/link-corpus.mjs. Do not edit.\n// The corpus files in the native app bundle, by their path under public/corpus/.\n\n/* eslint-disable @typescript-eslint/no-require-imports */\nexport const corpusAssets: Record<string, number> = {\n${lines.join('\n')}\n}\n`,
)
console.log(`link-corpus: ${files.length} files in assets/corpus/`)
