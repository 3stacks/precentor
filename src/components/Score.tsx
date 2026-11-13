'use dom'

// The tune as sheet music, from abcjs. The note that sounds now is lit, and a
// tap on a note goes to that note.
//
// abcjs draws SVG into the DOM. On the web this file renders as it is. On iOS
// and Android it is an Expo DOM component: it renders in a web view, and the
// function props call back into the app.
import type { DOMProps } from 'expo/dom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { SettingStanza, TuneRecord } from '../engine/types.ts'
import { tuneToAbc } from '../music/abc.ts'
import './score.css'

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
  onNote: (noteId: string) => Promise<void>
  /** The top and the bottom of the lit note, in pixels from the top of the score. The app scrolls to it. */
  onFollow: (top: number, bottom: number) => Promise<void>
  /** The score is on the screen. On iOS and Android, the web view is ready for new props. */
  onReady?: () => Promise<void>
  dom?: DOMProps
}

type Head = { el: SVGElement[]; abselem: unknown }

export default function Score({ tune, transpose, keyName, stanza, activeNoteId, following, onNote, onFollow, onReady }: Props) {
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
  useEffect(() => {
    void onReady?.()
    // Only once, when the score mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const narrow = width > 0 && width < 560
  const score = useMemo(() => tuneToAbc(tune, transpose, keyName, stanza, narrow), [tune, transpose, keyName, stanza, narrow])
  const onNoteRef = useRef(onNote)
  const onFollowRef = useRef(onFollow)
  useLayoutEffect(() => {
    onNoteRef.current = onNote
    onFollowRef.current = onFollow
  })

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
            if (i >= 0) void onNoteRef.current(score.sopranoHeads[i])
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
    if (following && first && card.current) {
      const top = card.current.getBoundingClientRect().top
      const r = first.getBoundingClientRect()
      void onFollowRef.current(r.top - top, r.bottom - top)
    }
  }, [activeNoteId, ready, score, following])

  return (
    <div className="score" ref={card} data-testid="score">
      {error ? <p className="score-error">Could not draw the music. {error}</p> : null}
      <div ref={box} className="score-svg" />
    </div>
  )
}
