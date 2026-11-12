// The native app reads the corpus from its own bundle, so every psalm plays
// with no network. scripts/link-corpus.mjs puts the files in the bundle.
import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { corpusAssets } from './corpusAssets.native.ts'

export async function readCorpusFile(path: string): Promise<unknown> {
  const id = corpusAssets[path]
  if (id === undefined) throw new Error(`${path}: not in the app`)
  const asset = await Asset.fromModule(id).downloadAsync()
  const uri = asset.localUri ?? asset.uri
  // In development the asset comes from the Metro server, not from a file.
  const text = uri.startsWith('file:') ? await new File(uri).text() : await (await fetch(uri)).text()
  return JSON.parse(text)
}
