import { useEffect } from 'react'
import { loadIndex } from '../data/corpus.ts'
import { psalmHref } from '../router.ts'
import { useAsync } from '../useAsync.ts'

export function About({ section }: { section?: string }) {
  const [index] = useAsync(loadIndex, [])
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView()
  }, [section])
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

      <section className="card" id="metre">
        <h2>Metre</h2>
        <p>
          The metre of a psalm gives the number of syllables in each line of a verse. The numbers 8.6.8.6 tell you that a verse has four lines. The first line
          has 8 syllables, the second line has 6, the third has 8 and the fourth has 6.
        </p>
        <p>This is verse 1 of Psalm 23, in common metre. A dot divides the syllables:</p>
        <table className="metre-example">
          <tbody>
            {PS23.map(([line, count]) => (
              <tr key={line}>
                <td>{line}</td>
                <td className="count">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          A tune also has a metre. Each syllable takes one note of the tune, or sometimes two. Thus any tune with the same metre fits the words of the psalm. For this reason,
          the tune list of a psalm shows only the tunes with the same metre as that psalm. Congregations in Scotland sang each psalm to many tunes in this
          way.
        </p>
        <table className="metres">
          <thead>
            <tr>
              <th>Metre</th>
              <th>Name</th>
              <th>Psalms</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>8.6.8.6</td>
              <td>Common metre (C.M.)</td>
              <td>Almost all of the psalms: 149 of the 163 versions</td>
            </tr>
            <tr>
              <td>8.8.8.8</td>
              <td>Long metre (L.M.)</td>
              <td>
                <a href={psalmHref('006')}>6</a>, <a href={psalmHref('100')}>100</a>, and the second versions of <a href={psalmHref('102b')}>102</a> and{' '}
                <a href={psalmHref('145b')}>145</a>
              </td>
            </tr>
            <tr>
              <td>6.6.8.6</td>
              <td>Short metre (S.M.)</td>
              <td>
                <a href={psalmHref('025')}>25</a>, <a href={psalmHref('050')}>50</a>, <a href={psalmHref('067')}>67</a>, <a href={psalmHref('070')}>70</a>, and the
                second version of <a href={psalmHref('045b')}>45</a>
              </td>
            </tr>
            <tr>
              <td>Other</td>
              <td>Special metres</td>
              <td>
                <a href={psalmHref('136')}>136</a> (8.7.8.7), and the second versions of <a href={psalmHref('124b')}>124</a> (10.10.10.10.10),{' '}
                <a href={psalmHref('136b')}>136</a> and <a href={psalmHref('148b')}>148</a> (6.6.6.6.8.8) and <a href={psalmHref('143b')}>143</a> (6.6.6.6.6.6.6.6).{' '}
                Each has its own tune.
              </td>
            </tr>
          </tbody>
        </table>
        <p className="small muted">Old psalters write the metre as C.M., L.M. or S.M. Some books write 8.6.8.6 as 86.86.</p>
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

const PS23: [string, number][] = [
  ['The·LORD’s·my·shep·herd,·I’ll·not·want.', 8],
  ['He·makes·me·down·to·lie', 6],
  ['In·pas·tures·green:·he·lead·eth·me', 8],
  ['the·qui·et·wa·ters·by.', 6],
]
