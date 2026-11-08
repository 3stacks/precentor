import { useEffect, useMemo, useRef, useState } from 'react'
import type { SettingStanza, TuneRecord } from '../engine/types.ts'
import { tuneToAbc } from '../music/abc.ts'

interface Props {
  tune: TuneRecord
  transpose: number
  /** The key after the transposition, for example "G major". */
  keyName: string
  /** The verse whose words go under the notes. */
  stanza: SettingStanza | undefined
  /** The tune note that sounds now. */
  activeNoteId: string | undefined
  following: boolean
  onNote: (noteId: string) => void
}

type Head = { el: SVGElement[]; abselem: unknown }

/** The tune as sheet music, from abcjs. The note that sounds now is lit. */
export function Score({ tune, transpose, keyName, stanza, activeNoteId, following, onNote }: Props) {
  const card = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const heads = useRef<Head[]>([])
  const lit = useRef<SVGElement[]>([])
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(0)
  // Lay the music out at the width of the screen, so the notes keep their size.
  const [width, setWidth] = useState(0)
  useEffect(() => {
    // Measure the card. abcjs sets a width on the element that it draws into.
    const el = card.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const cs = getComputedStyle(el)
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      setWidth(Math.floor(inner / 10) * 10)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = width > 0 && width < 560
  const score = useMemo(() => tuneToAbc(tune, transpose, keyName, stanza, narrow), [tune, transpose, keyName, stanza, narrow])
  const onNoteRef = useRef(onNote)
  onNoteRef.current = onNote

  useEffect(() => {
    let live = true
    import('abcjs')
      .then(({ default: abcjs }) => {
        if (!live || !box.current || !width) return
        const visual = abcjs.renderAbc(box.current, score.abc, {
          add_classes: true,
          // Lay out at the width of the card. If a line needs more room, abcjs scales it down to fit.
          responsive: 'resize',
          staffwidth: Math.floor(width / (narrow ? 0.85 : 1)) - 12,
          scale: narrow ? 0.85 : 1,
          paddingleft: 0,
          paddingright: 0,
          paddingtop: 0,
          clickListener: (elem) => {
            const i = heads.current.findIndex((h) => h.abselem === elem.abselem)
            if (i >= 0) onNoteRef.current(score.sopranoHeads[i])
          },
        })
        // The soprano: voice 1 of stave 1 in each line.
        const found: Head[] = []
        for (const line of visual[0]?.lines ?? [])
          for (const item of line.staff?.[0]?.voices?.[0] ?? []) {
            const e = item as { el_type?: string; rest?: unknown; abselem?: { elemset?: SVGElement[] } }
            if (e.el_type === 'note' && !e.rest && e.abselem) found.push({ el: e.abselem.elemset ?? [], abselem: e.abselem })
          }
        if (found.length !== score.sopranoHeads.length) console.warn(`score: ${found.length} soprano heads, expected ${score.sopranoHeads.length}`)
        heads.current = found
        lit.current = []
        setError(undefined)
        setReady((r) => r + 1)
      })
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [score, width, narrow])

  // Light the note that sounds now.
  useEffect(() => {
    for (const el of lit.current) el.classList.remove('now')
    lit.current = []
    if (!activeNoteId) return
    score.sopranoHeads.forEach((id, i) => {
      if (id !== activeNoteId) return
      for (const el of heads.current[i]?.el ?? []) {
        el.classList.add('now')
        lit.current.push(el)
      }
    })
    const first = lit.current[0]
    if (following && first) {
      const r = first.getBoundingClientRect()
      const bar = document.querySelector<HTMLElement>('.player')
      const bottom = window.innerHeight - (bar?.offsetHeight ?? 0)
      if (r.top < 70 || r.bottom > bottom - 20) window.scrollBy({ top: r.top - (70 + (bottom - 70) * 0.3), behavior: 'smooth' })
    }
  }, [activeNoteId, ready, score, following])

  return (
    <div className="score card" ref={card}>
      {error ? <p className="error-text">Could not draw the music. {error}</p> : null}
      <div ref={box} className="score-svg" />
    </div>
  )
}
