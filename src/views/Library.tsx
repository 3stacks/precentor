import { useMemo, useState } from 'react'
import { loadIndex, type CorpusIndex, type PsalmEntry } from '../data/corpus.ts'
import { psalmHref } from '../router.ts'
import { useAsync } from '../useAsync.ts'

export function Library() {
  const [index, error] = useAsync(loadIndex, [])
  const [query, setQuery] = useState('')
  const shown = useMemo(() => (index ? search(index, query) : []), [index, query])

  if (error) return <p className="empty">Could not load the psalms. {error.message}</p>
  if (!index) return <p className="empty">Loading…</p>
  const tuneTitle = new Map(index.tunes.map((t) => [t.slug, t.title]))

  return (
    <div className="stack">
      <section className="card hero">
        <h1>The Psalms of David in Metre</h1>
        <p>The Scottish Psalter of 1650. Choose a psalm, choose a tune, and sing along. The player shows each syllable as you sing it.</p>
        <label className="search">
          <span className="visually-hidden">Find a psalm</span>
          <input type="search" placeholder="Psalm number or words, for example 23 or “shepherd”" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>
      </section>

      {shown.length === 0 ? (
        <p className="empty">No psalm matches “{query}”.</p>
      ) : (
        <ol className="psalm-list">
          {shown.map((p) => (
            <li key={p.key}>
              <a href={psalmHref(p.key)}>
                <span className="num">{p.number}</span>
                <span className="body">
                  <span className="opening">{p.opening}</span>
                  <span className="meta">
                    {p.version === 'alternate' && <span className="tag">Second version</span>}
                    {p.meter} · {tuneTitle.get(p.tune)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')

function search(index: CorpusIndex, query: string): PsalmEntry[] {
  const q = fold(query.trim())
  if (!q) return index.psalms
  if (/^\d+$/.test(q)) return index.psalms.filter((p) => String(p.number).startsWith(q))
  return index.psalms.filter((p) => fold(`${p.opening} ${p.title}`).includes(q))
}
