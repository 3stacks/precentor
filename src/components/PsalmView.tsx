import Slider from '@react-native-community/slider'
import { Link, Stack, router, type Href } from 'expo-router'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { loadIndex, loadPsalm, loadSetting, loadTune, meterLabel, psalmLabel, tuneLabel, tunesFor, type PsalmEntry, type TuneEntry } from '../data/corpus.ts'
import { compilePerformance, type CompiledPerformance, type SyllableCue } from '../engine/compilePerformance.ts'
import { hasSound } from '../engine/createAudioBackend'
import { normalizeTranspose, readPlaybackPreference, savePlaybackPreference, transposePerformance } from '../engine/performanceOptions.ts'
import { retargetSetting } from '../engine/retargetSetting.ts'
import type { PsalmRecord, PsalmSetting, SettingStanza, TuneRecord } from '../engine/types.ts'
import { useSingAlong } from '../engine/useSingAlong.ts'
import { psalmHref } from '../lib/routes.ts'
import { fonts, MAX_WIDTH, useColors, type Colors } from '../lib/theme.ts'
import { track } from '../lib/track.ts'
import { useAsync } from '../lib/useAsync.ts'
import Score from './Score.tsx'
import { Button, Card, Empty, ExternalLink, H1, Page, T } from './ui.tsx'

const SIB = 'https://haddingtonbible.org'
const HEARERS = 'https://hearers.app/app/'
const web = Platform.OS === 'web'

export function PsalmView({ psalmKey, tuneSlug }: { psalmKey: string; tuneSlug?: string }) {
  const c = useColors()
  const [base, error] = useAsync(async () => {
    const index = await loadIndex()
    const entry = index.psalms.find((p) => p.key === psalmKey)
    if (!entry) throw new Error(`There is no psalm "${psalmKey}".`)
    const [psalm, setting, homeTune] = await Promise.all([loadPsalm(psalmKey), loadSetting(psalmKey), loadTune(entry.tune)])
    return { index, entry, psalm, setting, homeTune, tunes: tunesFor(index, entry) }
  }, [psalmKey])

  // The tune: the link, then the last choice for this psalm, then the recommended tune.
  const chosen = base && (pickTune(base.tunes, tuneSlug) ?? pickTune(base.tunes, readPlaybackPreference<string | undefined>(`tune:${psalmKey}`, undefined)) ?? base.tunes[0])
  const [tune, tuneError] = useAsync(async () => (chosen ? loadTune(chosen.slug) : undefined), [chosen?.slug])
  const [transpose, setTranspose] = useState(() => normalizeTranspose(readPlaybackPreference('transpose', 0)))
  const [picking, setPicking] = useState(false)

  const built = useMemo(() => {
    if (!base || !tune || tune.id !== chosen?.id) return undefined
    try {
      const setting = tune.id === base.homeTune.id ? base.setting : retargetSetting(base.setting, base.homeTune, tune)
      return { setting, tune, performance: transposePerformance(compilePerformance(tune, setting), transpose) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [base, tune, chosen?.id, transpose])

  const title = base ? psalmLabel(base.entry) : 'Psalm'
  const screen = <Stack.Screen options={{ title }} />
  // The web header is the app's own, so set the title of the browser tab here, as the Vite app did.
  useEffect(() => {
    if (!web || !base) return
    document.title = `${psalmLabel(base.entry)} · Precentor`
    return () => {
      document.title = 'Precentor'
    }
  }, [base])

  if (error || tuneError)
    return (
      <Page>
        {screen}
        <Empty>Could not load this psalm. {(error ?? tuneError)!.message}</Empty>
      </Page>
    )
  if (!base || !chosen)
    return (
      <Page>
        {screen}
        <Empty>Loading…</Empty>
      </Page>
    )

  const { entry, psalm, index, tunes } = base
  const chooseTune = (slug: string) => {
    setPicking(false)
    savePlaybackPreference(`tune:${psalmKey}`, slug)
    track('Tune chosen', { psalm: psalmKey, tune: slug })
    router.setParams({ tune: slug === entry.tune ? '' : slug })
  }
  const changeKey = (step: number) => {
    const next = normalizeTranspose(transpose + step)
    setTranspose(next)
    savePlaybackPreference('transpose', next)
  }
  const at = index.psalms.findIndex((p) => p.key === psalmKey)
  const prev = index.psalms[at - 1]
  const next = index.psalms[at + 1]

  const head = (
    <Card>
      <Text style={[styles.eyebrow, { color: c.accent }]}>
        <Link href="/about/metre" style={{ color: c.accent }}>
          {meterLabel(entry.meterName, entry.meter).toUpperCase()}
        </Link>
      </Text>
      <H1 style={{ marginBottom: 12 }}>{psalmLabel(entry)}</H1>
      <View style={styles.tunePick}>
        <T style={{ fontFamily: fonts.semibold }}>Tune</T>
        <Pressable onPress={() => setPicking(true)} role="button" aria-label={`Tune: ${tuneLabel(chosen)}. Choose a tune`} style={[styles.select, { borderColor: c.line, backgroundColor: c.surface }]}>
          <T style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
            {tuneLabel(chosen)}
            {chosen.slug === tunes[0]?.slug ? ' · recommended' : ''} ▾
          </T>
        </Pressable>
      </View>
      <T small muted style={{ marginTop: 10 }}>
        {chosen.attribution} <ExternalLink href={chosen.record}>Source score</ExternalLink>
      </T>
      <View style={styles.links}>
        <ExternalLink href={`${SIB}/psalms-${entry.number}`} style={{ fontSize: 14 }}>
          Brown’s notes on Psalm {entry.number}
        </ExternalLink>
        <ExternalLink href={`${HEARERS}#/add/Ps.${entry.number}`} style={{ fontSize: 14 }}>
          Memorise Psalm {entry.number} (KJV) in Hearers
        </ExternalLink>
      </View>
      <TunePicker visible={picking} tunes={tunes} chosen={chosen.slug} onChoose={chooseTune} onClose={() => setPicking(false)} />
    </Card>
  )
  const pager = (
    <View style={styles.pager}>
      {prev ? <PagerLink href={psalmHref(prev.key)} label={`← ${psalmLabel(prev)}`} /> : <View />}
      {next ? <PagerLink href={psalmHref(next.key)} label={`${psalmLabel(next)} →`} /> : <View />}
    </View>
  )

  if (!built || 'error' in built)
    return (
      <Page>
        {screen}
        {head}
        <Empty>{!built ? 'Loading the tune…' : `This tune does not fit this psalm. ${built.error}`}</Empty>
        {pager}
      </Page>
    )
  return (
    <>
      {screen}
      <Player key={built.performance.id} performance={built.performance} psalm={psalm} setting={built.setting} tune={built.tune} transpose={transpose} entry={entry} tuneSlug={chosen.slug} onKey={changeKey} head={head} pager={pager} />
    </>
  )
}

function PagerLink({ href, label }: { href: string; label: string }) {
  const c = useColors()
  // On iOS and Android, the next psalm takes the place of this one, so the back button goes to the list.
  return (
    <Link href={href as Href} replace={!web} style={{ color: c.accent, fontFamily: fonts.semibold, fontSize: 16 }}>
      {label}
    </Link>
  )
}

function TunePicker({ visible, tunes, chosen, onChoose, onClose }: { visible: boolean; tunes: TuneEntry[]; chosen: string; onChoose: (slug: string) => void; onClose: () => void }) {
  const c = useColors()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} aria-label="Close">
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Choose a tune</Text>
          <ScrollView>
            {tunes.map((t, i) => (
              <Pressable
                key={t.slug}
                role="button"
                onPress={() => onChoose(t.slug)}
                style={({ pressed }) => [styles.option, { borderTopColor: c.line, backgroundColor: t.slug === chosen ? c.accentSoft : pressed ? c.surface2 : 'transparent' }]}>
                <T style={{ fontFamily: t.slug === chosen ? fonts.semibold : fonts.regular, color: t.slug === chosen ? c.accent : c.text }}>
                  {tuneLabel(t)}
                  {i === 0 ? ' · recommended' : ''}
                </T>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

const pickTune = (tunes: TuneEntry[], slug: string | undefined) => (slug ? tunes.find((t) => t.slug === slug) : undefined)

// A transposition makes a new performance, so the player starts again. Keep the place.
let resumeAt: { id: string; tick: number; playing: boolean } | undefined

interface PlayerProps {
  performance: CompiledPerformance
  psalm: PsalmRecord
  setting: PsalmSetting
  tune: TuneRecord
  transpose: number
  entry: PsalmEntry
  tuneSlug: string
  onKey: (step: number) => void
  head: ReactNode
  pager: ReactNode
}

function Player({ performance, psalm, setting, tune, transpose, entry, tuneSlug, onKey, head, pager }: PlayerProps) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const s = useSingAlong(performance)
  const sRef = useRef(s)
  useLayoutEffect(() => {
    sRef.current = s
  })
  const tempoKey = `tempo:${psalm.id}:${tuneSlug}`

  useEffect(() => {
    const saved = readPlaybackPreference(tempoKey, performance.defaultBpm)
    if (Number.isInteger(saved) && saved !== performance.defaultBpm) sRef.current.setBpm(saved)
    const base = performance.id.replace(/\.transpose-[-\d]+$/, '')
    if (resumeAt && resumeAt.id === base) {
      const { tick, playing } = resumeAt
      resumeAt = undefined
      sRef.current.seek(tick)
      if (playing) void sRef.current.play()
    }
    return () => {
      const cur = sRef.current
      resumeAt = { id: base, tick: cur.currentTick, playing: cur.status === 'playing' }
    }
  }, [performance, tempoKey])

  const setBpm = (bpm: number) => {
    s.setBpm(bpm)
    savePlaybackPreference(tempoKey, Math.round(Math.min(180, Math.max(30, bpm))))
  }

  const versesOf = useMemo(() => new Map(psalm.stanzas.map((st) => [st.id, st.biblical_verses])), [psalm])
  const lineStart = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of performance.lines) if (!m.has(l.lineId)) m.set(l.lineId, l.startTick)
    return m
  }, [performance])
  const syllableCue = useMemo(() => new Map(performance.syllables.map((cue) => [cue.syllableId, cue])), [performance])
  const seekRef = useRef(s.seek)
  useLayoutEffect(() => {
    seekRef.current = s.seek
  })
  const onLine = useCallback(
    (lineId: string) => {
      const t = lineStart.get(lineId)
      if (t !== undefined) seekRef.current(t)
    },
    [lineStart],
  )

  // Words or music, and the melody shape over the words.
  const [mode, setMode] = useState<'words' | 'music'>(() => (readPlaybackPreference<string>('view', 'words') === 'music' ? 'music' : 'words'))
  const [shape, setShape] = useState(() => readPlaybackPreference<boolean>('shape', true) !== false)
  const chooseMode = (m: 'words' | 'music') => {
    setMode(m)
    savePlaybackPreference('view', m)
    track('View chosen', { view: m })
  }
  const toggleShape = (on: boolean) => {
    setShape(on)
    savePlaybackPreference('shape', on)
  }
  const melody = useMemo(() => melodyShape(tune, setting), [tune, setting])

  const playing = s.status === 'playing'
  // One event for each psalm and tune that is played.
  const counted = useRef(false)
  useEffect(() => {
    if (!playing || counted.current) return
    counted.current = true
    track('Psalm played', { psalm: entry.key, tune: tuneSlug })
  }, [playing, entry.key, tuneSlug])
  const inIntro = s.currentTick < performance.introTicks
  const activeStanzaId = inIntro ? undefined : s.activeStanza?.stanzaId
  const activeLineId = s.activeLine?.lineId

  // The place of each part of the page in the scroll view, for the follow mode.
  const scroll = useRef<ScrollViewInstance>(null)
  const scrollY = useRef(0)
  const viewHeight = useRef(0)
  const columnY = useRef(0)
  const sectionY = useRef(0)
  const stanzaY = useRef(new Map<string, number>())
  const lineY = useRef(new Map<string, number>())
  const onStanzaLayout = useCallback((id: string, y: number) => stanzaY.current.set(id, y), [])
  const onLineLayout = useCallback((id: string, y: number) => lineY.current.set(id, y), [])
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y
  }

  // Follow the sung line.
  const [follow, setFollow] = useState(true)
  useEffect(() => {
    if (!playing || !follow || mode !== 'words') return
    const stanzaId = activeLineId ? performance.lines.find((l) => l.lineId === activeLineId)?.stanzaId : setting.stanzas[0]?.stanza_id
    if (!stanzaId) return
    const y = columnY.current + sectionY.current + (stanzaY.current.get(stanzaId) ?? 0) + (activeLineId ? (lineY.current.get(activeLineId) ?? 0) : 0)
    scroll.current?.scrollTo({ y: Math.max(0, y - viewHeight.current * 0.35), animated: true })
  }, [activeLineId, playing, follow, mode, performance.lines, setting.stanzas])

  // The music view scrolls when the lit note leaves the screen.
  const onFollow = useCallback(async (top: number, bottom: number) => {
    const y = columnY.current + sectionY.current
    const margin = 20
    const viewTop = scrollY.current
    const viewBottom = scrollY.current + viewHeight.current
    if (y + top < viewTop + margin || y + bottom > viewBottom - margin) scroll.current?.scrollTo({ y: Math.max(0, y + top - (margin + (viewHeight.current - margin) * 0.3)), animated: true })
  }, [])

  // The next syllable, and the way the melody goes to it.
  let next: { id: string; dir: Direction } | undefined
  if (s.activeSyllable && !inIntro) {
    const at = performance.syllables.indexOf(s.activeSyllable)
    const after = at >= 0 ? performance.syllables[at + 1] : undefined
    if (after && after.stanzaId === s.activeSyllable.stanzaId) {
      const a = melody.pitch.get(s.activeSyllable.syllableId)
      const b = melody.pitch.get(after.syllableId)
      if (a !== undefined && b !== undefined) next = { id: after.syllableId, dir: b > a ? 'up' : b < a ? 'down' : 'same' }
    }
  }
  // A syllable is sung when it ends before the lit syllable starts. This value changes once for each syllable, not once for each frame.
  const sungTick = s.activeSyllable?.startTick ?? s.currentTick

  // The music view shows the verse that is sung, or the verse that was chosen.
  const [chosenVerse, setChosenVerse] = useState(0)
  const shownVerse = activeStanzaId ? (s.activeStanza?.index ?? chosenVerse) : chosenVerse
  const sopranoNotes = useMemo(() => performance.notes.filter((n) => n.voice === 'soprano'), [performance])
  const activeNote = s.currentTick > 0 || playing ? noteAt(sopranoNotes, s.currentTick) : undefined
  const tuneNoteStart = useMemo(() => new Map(tune.notes.map((n) => [n.id, n.start_tick])), [tune])
  const shownRef = useRef(shownVerse)
  useLayoutEffect(() => {
    shownRef.current = shownVerse
  })
  const seekNote = useCallback(
    async (noteId: string) => {
      const cue = performance.stanzas[shownRef.current]
      const start = tuneNoteStart.get(noteId)
      if (cue && start !== undefined) seekRef.current(cue.startTick + start)
    },
    [performance.stanzas, tuneNoteStart],
  )
  const seekVerse = (i: number) => {
    setChosenVerse(i)
    const cue = performance.stanzas[i]
    if (cue) s.seek(cue.startTick)
  }

  const stanzaIndex = s.activeStanza ? s.activeStanza.index + 1 : 0
  const where = inIntro ? 'The tune, once through' : `Verse ${stanzaIndex} of ${performance.stanzas.length}`
  const sound = hasSound()

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onLayout={(e) => (viewHeight.current = e.nativeEvent.layout.height)}>
        <View style={styles.column} onLayout={(e) => (columnY.current = e.nativeEvent.layout.y)}>
          {head}
          <View style={styles.viewBar}>
            <View style={[styles.segmented, { backgroundColor: c.surface2, borderColor: c.line }]} role="group" aria-label="View">
              {(['words', 'music'] as const).map((m) => (
                <Pressable key={m} role="button" aria-pressed={mode === m} onPress={() => chooseMode(m)} style={[styles.segment, mode === m && { backgroundColor: c.surface }]}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: mode === m ? c.text : c.muted }}>{m === 'words' ? 'Words' : 'Music'}</Text>
                </Pressable>
              ))}
            </View>
            {mode === 'words' && <Check label="Melody shape" value={shape} onChange={toggleShape} />}
          </View>

          <View onLayout={(e) => (sectionY.current = e.nativeEvent.layout.y)}>
            {mode === 'music' ? (
              <View style={{ gap: 12 }}>
                <View style={styles.versePick} role="group" aria-label="Verse">
                  {performance.stanzas.map((st, i) => (
                    <Button key={st.stanzaId} label={`${i + 1}`} on={i === shownVerse} onPress={() => seekVerse(i)} style={styles.verseButton} />
                  ))}
                </View>
                <Score
                  tune={tune}
                  transpose={transpose}
                  keyName={performance.key}
                  stanza={setting.stanzas[shownVerse]}
                  activeNoteId={activeNote?.sourceNoteId}
                  following={follow && playing}
                  onNote={seekNote}
                  onFollow={onFollow}
                  dom={{ matchContents: true, scrollEnabled: false, style: { backgroundColor: 'transparent' } }}
                />
              </View>
            ) : (
              <View aria-label="Words">
                {setting.stanzas.map((st, i) => (
                  <Stanza
                    key={st.stanza_id}
                    stanza={st}
                    number={i + 1}
                    psalmNumber={entry.number}
                    verses={versesOf.get(st.stanza_id) ?? []}
                    active={st.stanza_id === activeStanzaId}
                    tick={st.stanza_id === activeStanzaId ? sungTick : -1}
                    activeSyllableId={st.stanza_id === activeStanzaId ? s.activeSyllable?.syllableId : undefined}
                    next={st.stanza_id === activeStanzaId ? next : undefined}
                    height={shape ? melody.height : undefined}
                    syllableCue={syllableCue}
                    onLine={onLine}
                    onStanzaLayout={onStanzaLayout}
                    onLineLayout={onLineLayout}
                    colors={c}
                  />
                ))}
              </View>
            )}
          </View>
          {pager}
        </View>
      </ScrollView>

      <View style={[styles.player, { backgroundColor: c.surface, borderColor: c.line, paddingBottom: 10 + insets.bottom }]} role="region" aria-label="Player">
        <View style={styles.playerInner}>
          <View style={styles.playerRow}>
            <Text style={[styles.where, { color: c.text }]}>{where}</Text>
            {inIntro && s.currentTick > 0 && (
              <Pressable onPress={() => s.seek(performance.introTicks)} role="button">
                <Text style={{ color: c.accent, fontFamily: fonts.semibold, fontSize: 14 }}>Skip to verse 1</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Check label="Follow" value={follow} onChange={setFollow} />
          </View>
          <Slider
            style={styles.progress}
            minimumValue={0}
            maximumValue={performance.durationTicks}
            value={s.currentTick}
            onSlidingComplete={(v) => s.seek(v)}
            minimumTrackTintColor={c.accent}
            maximumTrackTintColor={c.line}
            thumbTintColor={c.accent}
            aria-label="Position"
          />
          <View style={styles.controls}>
            <IconButton label="Start again" d="M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10" onPress={s.restart} />
            <IconButton label={playing ? 'Pause' : 'Play'} d={playing ? 'M8 5v14M16 5v14' : 'M7 4.5v15l12-7.5Z'} fill={!playing} big onPress={() => void s.toggle()} />
            <IconButton label="Repeat this verse" d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" on={s.loopStanza} onPress={() => s.setLoopStanza(!s.loopStanza)} />
            <View style={styles.steppers}>
              <Stepper label="Speed" value={`${s.bpm}`} onDown={() => setBpm(s.bpm - 4)} onUp={() => setBpm(s.bpm + 4)} />
              <Stepper label="Key" value={keyName(performance.key)} onDown={() => onKey(-1)} onUp={() => onKey(1)} />
            </View>
          </View>
          {s.error && (
            <T small style={{ color: c.error, marginTop: 8 }}>
              {s.error}
            </T>
          )}
          {!sound && (
            <T small muted style={{ marginTop: 6 }}>
              Expo Go cannot play the tune. The words follow the beat with no sound. For sound, install the development build.
            </T>
          )}
        </View>
      </View>
    </View>
  )
}

/** "B-flat major" → "B♭". The performance key is already transposed. */
const keyName = (key: string) => key.replace('-sharp', '♯').replace('-flat', '♭').replace(' major', '')

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (on: boolean) => void }) {
  const c = useColors()
  return (
    <View style={styles.check}>
      <Switch
        value={value}
        onValueChange={onChange}
        aria-label={label}
        trackColor={{ true: c.accent, false: c.line }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
        {...(web ? { activeThumbColor: '#ffffff' } : {})}
        style={web ? undefined : styles.switch}
      />
      <Text style={{ color: c.muted, fontSize: 14, fontFamily: fonts.regular }}>{label}</Text>
    </View>
  )
}

interface StanzaProps {
  stanza: SettingStanza
  number: number
  psalmNumber: number
  verses: number[]
  active: boolean
  /** Syllables that end at or before this tick are sung. */
  tick: number
  activeSyllableId: string | undefined
  next: { id: string; dir: Direction } | undefined
  /** The height of each syllable's note, from 0 (the lowest note of the tune) to 1. Undefined: no melody shape. */
  height: Map<string, number> | undefined
  syllableCue: Map<string, SyllableCue>
  onLine: (lineId: string) => void
  onStanzaLayout: (stanzaId: string, y: number) => void
  onLineLayout: (lineId: string, y: number) => void
  colors: Colors
}

const ARROW: Record<Direction, string> = { up: '▲', down: '▼', same: '▶' }

const Stanza = memo(function Stanza({ stanza, number, psalmNumber, verses, active, tick, activeSyllableId, next, height, syllableCue, onLine, onStanzaLayout, onLineLayout, colors: c }: StanzaProps) {
  const first = verses[0]
  const last = verses[verses.length - 1]
  const range = first === undefined ? '' : first === last ? `${first}` : `${first}–${last}`
  const shape = height !== undefined
  return (
    <View
      style={[styles.stanza, active && { backgroundColor: c.surface, borderLeftColor: c.accent, shadowColor: c.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }]}
      onLayout={(e: LayoutChangeEvent) => onStanzaLayout(stanza.stanza_id, e.nativeEvent.layout.y)}
      id={`stanza-${number}`}>
      <View style={styles.stanzaHead}>
        <Text style={[styles.stanzaNum, { color: c.accent }]}>{number}</Text>
        {range ? (
          <ExternalLink href={`${SIB}/psalms-${psalmNumber}#v${psalmNumber}-${first}`} style={{ color: c.muted, fontSize: 13 }}>
            v. {range}
          </ExternalLink>
        ) : null}
      </View>
      {stanza.lines.map((line, li) => (
        <Pressable
          key={line.line_id}
          onPress={() => onLine(line.line_id)}
          onLayout={(e: LayoutChangeEvent) => onLineLayout(line.line_id, e.nativeEvent.layout.y)}
          style={({ hovered }: { hovered?: boolean }) => [styles.line, li % 2 === 1 && styles.indent, shape && styles.shapeLine, hovered && { backgroundColor: c.surface2 }]}>
          {line.tokens.map((tok) => (
            <View key={tok.id} style={styles.word}>
              {tok.syllable_map.map((sy) => {
                const cue = syllableCue.get(sy.id)
                const state = !active || !cue ? '' : sy.id === activeSyllableId ? 'now' : cue.endTick <= tick ? 'sung' : ''
                const h = height?.get(sy.id)
                const isNext = next?.id === sy.id
                const lift = h === undefined ? 0 : h * 14
                return (
                  <View key={sy.id} testID={state === 'now' ? 'syllable-now' : undefined} style={[styles.syl, state === 'now' && { backgroundColor: c.accent }, isNext && { outlineWidth: 1.5, outlineStyle: 'dashed', outlineColor: c.accent, outlineOffset: 1 }]}>
                    {shape && h !== undefined && !isNext && (
                      <View
                        style={[
                          styles.dot,
                          { top: -2 - lift, backgroundColor: state ? c.accent : c.muted, opacity: state === 'now' ? 1 : state === 'sung' ? 0.6 : 0.5 },
                          state === 'now' && styles.dotNow,
                          state === 'now' && { top: -3 - lift },
                        ]}
                      />
                    )}
                    {isNext && <Text style={[styles.arrow, { color: c.accent, top: shape ? -14 - lift : -12 }]}>{ARROW[next.dir]}</Text>}
                    <Text style={[styles.sylText, { color: state === 'now' ? c.accentInk : state === 'sung' ? c.accent : active ? c.text : c.textSoft }]}>{sy.text}</Text>
                  </View>
                )
              })}
            </View>
          ))}
        </Pressable>
      ))}
    </View>
  )
})

function Stepper({ label, value, onDown, onUp }: { label: string; value: string; onDown: () => void; onUp: () => void }) {
  const c = useColors()
  return (
    <View style={styles.stepper} role="group" aria-label={label}>
      <Text style={{ fontSize: 12, color: c.muted, marginRight: 2, fontFamily: fonts.regular }}>{label}</Text>
      <Button label="−" accessibilityLabel={`${label} down`} onPress={onDown} style={styles.small} />
      <Text style={[styles.stepperValue, { color: c.text }]}>{value}</Text>
      <Button label="+" accessibilityLabel={`${label} up`} onPress={onUp} style={styles.small} />
    </View>
  )
}

function IconButton({ label, d, fill, big, on, onPress }: { label: string; d: string; fill?: boolean; big?: boolean; on?: boolean; onPress: () => void }) {
  const c = useColors()
  const color = big ? c.accentInk : on ? c.accent : c.text
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={label}
      aria-pressed={on}
      style={({ pressed }) => [
        styles.icon,
        big && styles.iconBig,
        { borderColor: big || on ? c.accent : c.line, backgroundColor: big ? (pressed ? c.accentHover : c.accent) : on ? c.accentSoft : pressed ? c.surface2 : c.surface },
      ]}>
      <Svg viewBox="0 0 24 24" width={22} height={22} fill={fill ? color : 'none'} stroke={fill ? 'none' : color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d={d} />
      </Svg>
    </Pressable>
  )
}

type Direction = 'up' | 'down' | 'same'

/** The pitch of the first note of each syllable, and its height in the range of the tune. */
function melodyShape(tune: TuneRecord, setting: PsalmSetting) {
  const midi = new Map(tune.notes.map((n) => [n.id, n.midi]))
  const low = Math.min(...tune.notes.map((n) => n.midi))
  const high = Math.max(...tune.notes.map((n) => n.midi))
  const pitch = new Map<string, number>()
  const height = new Map<string, number>()
  for (const st of setting.stanzas)
    for (const line of st.lines)
      for (const tok of line.tokens)
        for (const sy of tok.syllable_map) {
          const m = midi.get(sy.note_ids[0])
          if (m === undefined) continue
          pitch.set(sy.id, m)
          height.set(sy.id, high > low ? (m - low) / (high - low) : 0.5)
        }
  return { pitch, height }
}

/** The note that sounds at a tick. The notes are in time order. */
function noteAt<T extends { startTick: number; endTick: number }>(notes: T[], tick: number): T | undefined {
  let lo = 0
  let hi = notes.length - 1
  let found: T | undefined
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (notes[mid].startTick <= tick) {
      found = notes[mid]
      lo = mid + 1
    } else hi = mid - 1
  }
  return found && tick < found.endTick ? found : undefined
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: 24 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.5, marginBottom: 4 },
  tunePick: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  select: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '100%', flexShrink: 1 },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6, marginTop: 10 },
  pager: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backdrop: { flex: 1, backgroundColor: '#0f172a80', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 16, borderWidth: 1, maxHeight: '80%', width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden' },
  sheetTitle: { fontFamily: fonts.display, fontWeight: '800', fontSize: 20, padding: 16 },
  option: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  viewBar: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  segmented: { flexDirection: 'row', padding: 3, gap: 2, borderRadius: 8, borderWidth: 1 },
  segment: { minHeight: 32, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 6, justifyContent: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switch: { transform: [{ scale: 0.8 }] },
  versePick: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  verseButton: { minHeight: 32, minWidth: 36, paddingHorizontal: 8, paddingVertical: 2 },
  stanza: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  stanzaHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 2 },
  stanzaNum: { fontFamily: fonts.display, fontWeight: '800', fontSize: 16 },
  line: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, borderRadius: 4 },
  indent: { paddingLeft: 28 },
  shapeLine: { paddingTop: 16 },
  word: { flexDirection: 'row' },
  syl: { borderRadius: 3, alignItems: 'center' },
  sylText: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 32 },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, left: '50%', marginLeft: -3 },
  dotNow: { width: 8, height: 8, borderRadius: 4, marginLeft: -4 },
  arrow: { position: 'absolute', fontSize: 11, lineHeight: 12, fontWeight: '700' },
  player: { borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 10, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  playerInner: { width: '100%' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  where: { fontFamily: fonts.semibold, fontSize: 15 },
  progress: { width: '100%', height: 32, marginVertical: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 6 },
  steppers: { flexDirection: 'row', gap: 14, marginLeft: 'auto' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperValue: { minWidth: 36, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 15, fontVariant: ['tabular-nums'] },
  small: { minHeight: 32, width: 32, paddingHorizontal: 0, paddingVertical: 0, borderRadius: 999 },
  icon: { width: 42, height: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBig: { width: 52, height: 52 },
})
