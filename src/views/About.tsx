import { loadIndex } from '../data/corpus.ts'
import { useAsync } from '../useAsync.ts'

export function About() {
  const [index] = useAsync(loadIndex, [])
  const commit = index?.source.commit.slice(0, 7)
  return (
    <div className="stack prose">
      <section className="card">
        <h1>About</h1>
        <p>
          This app holds the 1650 Scottish Psalter: the Psalms of David in Metre. It has all 150 psalms and the second versions of 13 psalms. Each psalm has a
          choice of tunes. The player plays the tune in four parts and shows each syllable when you must sing it.
        </p>
        <p>Before verse 1, the player plays the tune once through. Tap a line to go to that line. The app works offline after you open it once.</p>
      </section>

      <section className="card">
        <h2>The words and the tunes</h2>
        <p>
          The words, the tunes and the match of each syllable to its note come from{' '}
          <a href="https://github.com/kadencartwright/open-1650">Open 1650</a>, a project by Kaden Cartwright{commit ? ` (commit ${commit})` : ''}.
        </p>
        <ul>
          <li>The text of the psalms is in the public domain. Open 1650 took it from the Free Church of Scotland edition.</li>
          <li>The tunes and their harmony are in the public domain. Most come from the Christian Classics Ethereal Hymnary.</li>
          <li>The match of syllables to notes is from Open 1650, under CC0. Open 1650 marks this data as a prototype. Some lines can be wrong.</li>
          <li>The player code is from Open 1650, under the MIT License.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Related sites</h2>
        <ul>
          <li>
            <a href="https://haddingtonbible.org">The Self-Interpreting Bible</a> has the notes of John Brown of Haddington on each psalm. Each verse number in a psalm
            links to these notes.
          </li>
          <li>
            <a href="https://hearers.app">Hearers</a> helps you memorise the catechisms, the creeds and Scripture.
          </li>
        </ul>
        <p>
          If this app helps you, you can support it on <a href="https://ko-fi.com/lukeboyle">Ko-fi</a>.
        </p>
      </section>
    </div>
  )
}
