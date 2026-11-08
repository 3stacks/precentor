import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { loadIndex, loadPsalm, loadSetting, loadTune, meterLabel, psalmLabel, tuneLabel, tunesFor, type PsalmEntry, type TuneEntry } from '../data/corpus.ts'
import { compilePerformance, type CompiledPerformance, type SyllableCue } from '../engine/compilePerformance.ts'
import { normalizeTranspose, readPlaybackPreference, savePlaybackPreference, transposePerformance } from '../engine/performanceOptions.ts'
import { retargetSetting } from '../engine/retargetSetting.ts'
import type { PsalmRecord, PsalmSetting, SettingStanza } from '../engine/types.ts'
import { useSingAlong } from '../engine/useSingAlong.ts'
import { psalmHref } from '../router.ts'
import { useAsync } from '../useAsync.ts'

const SIB = 'https://haddingtonbible.org'
const HEARERS = 'https://hearers.app/app/'

export function PsalmView({ psalmKey, tuneSlug }: { psalmKey: string; tuneSlug?: string }) {
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

  const built = useMemo(() => {
    if (!base || !tune || tune.id !== chosen?.id) return undefined
    try {
      const setting = tune.id === base.homeTune.id ? base.setting : retargetSetting(base.setting, base.homeTune, tune)
      return { setting, performance: transposePerformance(compilePerformance(tune, setting), transpose) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [base, tune, chosen?.id, transpose])

  useEffect(() => {
    if (base) document.title = `${psalmLabel(base.entry)} · Psalter`
    return () => {
      document.title = 'Psalter'
    }
  }, [base])

  if (error || tuneError) return <p className="empty">Could not load this psalm. {(error ?? tuneError)!.message}</p>
  if (!base || !chosen) return <p className="empty">Loading…</p>

  const { entry, psalm, index, tunes } = base
  const chooseTune = (slug: string) => {
    savePlaybackPreference(`tune:${psalmKey}`, slug)
    location.replace(psalmHref(psalmKey, slug === entry.tune ? undefined : slug))
  }
  const changeKey = (step: number) => {
    const next = normalizeTranspose(transpose + step)
    setTranspose(next)
    savePlaybackPreference('transpose', next)
  }
  const at = index.psalms.findIndex((p) => p.key === psalmKey)
  const prev = index.psalms[at - 1]
  const next = index.psalms[at + 1]

  return (
    <div className="stack">
      <section className="card psalm-head">
        <p className="eyebrow">
          <a href="#/about/metre" title="What the metre means">
            {meterLabel(entry.meterName, entry.meter)}
          </a>
        </p>
        <h1>{psalmLabel(entry)}</h1>
        <div className="tune-pick">
          <label htmlFor="tune">Tune</label>
          <select id="tune" value={chosen.slug} onChange={(e) => chooseTune(e.target.value)}>
            {tunes.map((t, i) => (
              <option key={t.slug} value={t.slug}>
                {tuneLabel(t)}
                {i === 0 ? ' · recommended' : ''}
              </option>
            ))}
          </select>
        </div>
        <p className="small muted">
          {chosen.attribution} <a href={chosen.record}>Source score</a>
        </p>
        <p className="links small">
          <a href={`${SIB}/psalms-${entry.number}`}>Brown’s notes on Psalm {entry.number}</a>
          <a href={`${HEARERS}#/add/Ps.${entry.number}`}>Memorise Psalm {entry.number} (KJV) in Hearers</a>
        </p>
      </section>

      {!built ? (
        <p className="empty">Loading the tune…</p>
      ) : 'error' in built ? (
        <p className="empty">This tune does not fit this psalm. {built.error}</p>
      ) : (
        <Player key={built.performance.id} performance={built.performance} psalm={psalm} setting={built.setting} entry={entry} tuneSlug={chosen.slug} onKey={changeKey} />
      )}

      <nav className="pager">
        {prev ? <a href={psalmHref(prev.key)}>← {psalmLabel(prev)}</a> : <span />}
        {next ? <a href={psalmHref(next.key)}>{psalmLabel(next)} →</a> : <span />}
      </nav>
    </div>
  )
}

const pickTune = (tunes: TuneEntry[], slug: string | undefined) => (slug ? tunes.find((t) => t.slug === slug) : undefined)

// A transposition makes a new performance, so the player starts again. Keep the place.
let resumeAt: { id: string; tick: number; playing: boolean } | undefined

interface PlayerProps {
  performance: CompiledPerformance
  psalm: PsalmRecord
  setting: PsalmSetting
  entry: PsalmEntry
  tuneSlug: string
  onKey: (step: number) => void
}

function Player({ performance, psalm, setting, entry, tuneSlug, onKey }: PlayerProps) {
  const s = useSingAlong(performance)
  const sRef = useRef(s)
  sRef.current = s
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
  const syllableCue = useMemo(() => new Map(performance.syllables.map((c) => [c.syllableId, c])), [performance])

  const playing = s.status === 'playing'
  const inIntro = s.currentTick < performance.introTicks
  const activeStanzaId = inIntro ? undefined : s.activeStanza?.stanzaId
  const activeLineId = s.activeLine?.lineId

  // Follow the sung line.
  const [follow, setFollow] = useState(true)
  useEffect(() => {
    if (!playing || !follow) return
    const target = activeLineId ? document.querySelector<HTMLElement>(`[data-line="${activeLineId}"]`) : document.querySelector<HTMLElement>('.stanza')
    if (!target) return
    const bar = document.querySelector<HTMLElement>('.player')
    const visible = window.innerHeight - (bar?.offsetHeight ?? 0)
    const box = target.getBoundingClientRect()
    const top = window.scrollY + box.top - visible * 0.35
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' })
  }, [activeLineId, playing, follow])

  const stanzaIndex = s.activeStanza ? s.activeStanza.index + 1 : 0
  const where = inIntro ? 'The tune, once through' : `Verse ${stanzaIndex} of ${performance.stanzas.length}`

  return (
    <>
      <section className="lyrics" aria-label="Words">
        {setting.stanzas.map((st, i) => (
          <Stanza
            key={st.stanza_id}
            stanza={st}
            number={i + 1}
            psalmNumber={entry.number}
            verses={versesOf.get(st.stanza_id) ?? []}
            active={st.stanza_id === activeStanzaId}
            tick={st.stanza_id === activeStanzaId ? s.currentTick : -1}
            activeSyllableId={st.stanza_id === activeStanzaId ? s.activeSyllable?.syllableId : undefined}
            syllableCue={syllableCue}
            onLine={(lineId) => {
              const t = lineStart.get(lineId)
              if (t !== undefined) s.seek(t)
            }}
          />
        ))}
      </section>

      <div className="player" role="region" aria-label="Player">
        <div className="player-row">
          <span className="where">{where}</span>
          {inIntro && s.currentTick > 0 && (
            <button className="link" onClick={() => s.seek(performance.introTicks)}>
              Skip to verse 1
            </button>
          )}
          <span className="spacer" />
          <label className="check">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow
          </label>
        </div>
        <input
          className="progress"
          type="range"
          min={0}
          max={performance.durationTicks}
          value={s.currentTick}
          onChange={(e) => s.seek(+e.target.value)}
          aria-label="Position"
        />
        <div className="player-row controls">
          <button className="icon" onClick={s.restart} aria-label="Start again" title="Start again">
            <Icon d="M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10" />
          </button>
          <button className="icon play" onClick={() => void s.toggle()} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Icon d="M8 5v14M16 5v14" /> : <Icon d="M7 4.5v15l12-7.5Z" fill />}
          </button>
          <button className={s.loopStanza ? 'icon on' : 'icon'} onClick={() => s.setLoopStanza(!s.loopStanza)} aria-pressed={s.loopStanza} aria-label="Repeat this verse" title="Repeat this verse">
            <Icon d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />
          </button>
          <div className="steppers">
          <Stepper label="Speed" value={`${s.bpm}`} unit="beats a minute" onDown={() => setBpm(s.bpm - 4)} onUp={() => setBpm(s.bpm + 4)} />
          <Stepper label="Key" value={keyName(performance.key)} onDown={() => onKey(-1)} onUp={() => onKey(1)} />
          </div>
        </div>
        {s.error && <p className="error-text small">{s.error}</p>}
      </div>
    </>
  )
}

/** "B-flat major" → "B♭". The performance key is already transposed. */
const keyName = (key: string) => key.replace('-sharp', '♯').replace('-flat', '♭').replace(' major', '')

interface StanzaProps {
  stanza: SettingStanza
  number: number
  psalmNumber: number
  verses: number[]
  active: boolean
  tick: number
  activeSyllableId: string | undefined
  syllableCue: Map<string, SyllableCue>
  onLine: (lineId: string) => void
}

const Stanza = memo(function Stanza({ stanza, number, psalmNumber, verses, active, tick, activeSyllableId, syllableCue, onLine }: StanzaProps) {
  const first = verses[0]
  const last = verses[verses.length - 1]
  const range = first === undefined ? '' : first === last ? `${first}` : `${first}–${last}`
  return (
    <div className={active ? 'stanza active' : 'stanza'} id={`stanza-${number}`}>
      <div className="stanza-head">
        <span className="stanza-num">{number}</span>
        {range && (
          <a className="vref" href={`${SIB}/psalms-${psalmNumber}#v${psalmNumber}-${first}`} title="Brown’s notes on these verses">
            v. {range}
          </a>
        )}
      </div>
      {stanza.lines.map((line) => (
        <p key={line.line_id} className="line" data-line={line.line_id} onClick={() => onLine(line.line_id)}>
          {line.tokens.map((tok, ti) => (
            <span key={tok.id} className="word">
              {tok.syllable_map.map((sy) => {
                const cue = syllableCue.get(sy.id)
                const state = !active || !cue ? '' : sy.id === activeSyllableId ? 'now' : cue.endTick <= tick ? 'sung' : ''
                return (
                  <span key={sy.id} className={state ? `syl ${state}` : 'syl'}>
                    {sy.text}
                  </span>
                )
              })}
              {ti < line.tokens.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
})

function Stepper({ label, value, unit, onDown, onUp }: { label: string; value: string; unit?: string; onDown: () => void; onUp: () => void }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <span className="stepper-label">{label}</span>
      <button className="icon small" onClick={onDown} aria-label={`${label} down`}>
        −
      </button>
      <span className="stepper-value" title={unit}>
        {value}
      </span>
      <button className="icon small" onClick={onUp} aria-label={`${label} up`}>
        +
      </button>
    </div>
  )
}

function Icon({ d, fill }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

