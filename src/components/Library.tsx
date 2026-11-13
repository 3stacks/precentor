import { Link, type Href } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { loadIndex, type CorpusIndex, type PsalmEntry } from '../data/corpus.ts'
import { psalmHref } from '../lib/routes.ts'
import { fonts, useColors } from '../lib/theme.ts'
import { useAsync } from '../lib/useAsync.ts'
import { Empty, H1, Page } from './ui.tsx'

export function Library() {
  const c = useColors()
  const [index, error] = useAsync(loadIndex, [])
  const [query, setQuery] = useState('')
  const shown = useMemo(() => (index ? search(index, query) : []), [index, query])

  if (error)
    return (
      <Page>
        <Empty>Could not load the psalms. {error.message}</Empty>
      </Page>
    )
  if (!index)
    return (
      <Page>
        <Empty>Loading…</Empty>
      </Page>
    )
  const tuneTitle = new Map(index.tunes.map((t) => [t.slug, t.title]))

  return (
    <Page>
      <View style={[styles.hero, { backgroundColor: c.panel }]}>
        <H1 light>The Psalms of David in Metre</H1>
        <Text style={styles.heroText}>The Scottish Psalter of 1650. Choose a psalm, choose a tune, and sing along. The player shows each syllable as you sing it.</Text>
        <TextInput
          style={styles.search}
          placeholder="Psalm number or words, for example 23 or “shepherd”"
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          autoComplete="off"
          autoCorrect={false}
          inputMode="search"
          aria-label="Find a psalm"
          testID="psalm-search"
        />
      </View>

      {shown.length === 0 ? (
        <Empty>No psalm matches “{query}”.</Empty>
      ) : (
        <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.line }]} >
          {shown.map((p, i) => (
            <Link key={p.key} href={psalmHref(p.key) as Href} asChild>
              <Pressable testID={`psalm-${p.key}`} style={StyleSheet.flatten([styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }])}>
                <Text style={[styles.num, { color: c.accent }]}>{p.number}</Text>
                <View style={styles.body}>
                  <Text style={[styles.opening, { color: c.text }]}>{p.opening}</Text>
                  <Text style={[styles.meta, { color: c.muted }]}>
                    {p.version === 'alternate' && <Text style={[styles.tag, { backgroundColor: c.accentSoft, color: c.accent }]}> Second version </Text>}
                    {p.version === 'alternate' ? ' ' : ''}
                    {p.meter} · {tuneTitle.get(p.tune)}
                  </Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </Page>
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

const styles = StyleSheet.create({
  hero: { borderRadius: 16, borderBottomRightRadius: 48, paddingHorizontal: 20, paddingVertical: 22, gap: 8 },
  heroText: { color: '#fff', fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginBottom: 6 },
  search: { backgroundColor: '#fff', color: '#0f172a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontFamily: fonts.regular },
  list: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 14, alignItems: 'baseline', paddingHorizontal: 16, paddingVertical: 12 },
  num: { fontFamily: fonts.display, fontWeight: '800', fontSize: 20, minWidth: 44, fontVariant: ['tabular-nums'] },
  body: { flex: 1, minWidth: 0 },
  opening: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  tag: { fontFamily: fonts.semibold, fontSize: 12, borderRadius: 4 },
})
