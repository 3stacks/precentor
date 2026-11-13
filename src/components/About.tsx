import { Fragment, useRef, type ReactNode } from 'react'
import { Platform, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native'
import { loadIndex } from '../data/corpus.ts'
import { psalmHref } from '../lib/routes.ts'
import { fonts, useColors } from '../lib/theme.ts'
import { useAsync } from '../lib/useAsync.ts'
import { A, Card, ExternalLink, H1, H2, KOFI, Page, T } from './ui.tsx'

export function About({ section }: { section?: string }) {
  const c = useColors()
  const [index] = useAsync(loadIndex, [])
  const scroll = useRef<ScrollViewInstance>(null)
  const commit = index?.source.commit.slice(0, 7)
  return (
    <Page scrollRef={scroll}>
      <Card>
        <H1>About Precentor</H1>
        <P>In Scottish churches the precentor led the psalm singing. He sang each line, and the people sang it after him. This app does the same work.</P>
        <P>
          This app holds the 1650 Scottish Psalter: the Psalms of David in Metre. It has all 150 psalms and the second versions of 13 psalms. Each psalm has a choice of tunes. The
          player plays the tune in four parts and shows each syllable when you must sing it.
        </P>
        <P>Before verse 1, the player plays the tune once through. Tap a line to go to that line. The app works offline after you open it once.</P>
      </Card>

      <View
        onLayout={(e) => {
          if (section === 'metre') scroll.current?.scrollTo({ y: e.nativeEvent.layout.y + 4, animated: false })
        }}>
        <Card>
          <H2>Metre</H2>
          <P>
            The metre of a psalm gives the number of syllables in each line of a verse. The numbers 8.6.8.6 tell you that a verse has four lines. The first line has 8 syllables,
            the second line has 6, the third has 8 and the fourth has 6.
          </P>
          <P>This is verse 1 of Psalm 23, in common metre. A dot divides the syllables:</P>
          <View style={styles.table}>
            {PS23.map(([line, count]) => (
              <View key={line} style={styles.tr}>
                <T style={{ flex: 1, fontSize: 17 }}>{line}</T>
                <Text style={[styles.count, { color: c.accent }]}>{count}</Text>
              </View>
            ))}
          </View>
          <P>
            A tune also has a metre. Each syllable takes one note of the tune, or sometimes two. Thus any tune with the same metre fits the words of the psalm. For this reason,
            the tune list of a psalm shows only the tunes with the same metre as that psalm. Congregations in Scotland sang each psalm to many tunes in this way.
          </P>
          <View style={styles.table}>
            <View style={styles.tr}>
              <T muted small style={styles.c1}>
                Metre
              </T>
              <T muted small style={styles.c2}>
                Name
              </T>
              <T muted small style={styles.c3}>
                Psalms
              </T>
            </View>
            {[
              ['8.6.8.6', 'Common metre (C.M.)', <Fragment key="cm">Almost all of the psalms: 149 of the 163 versions</Fragment>],
              [
                '8.8.8.8',
                'Long metre (L.M.)',
                <Fragment key="lm">
                  {ps('006', '6')}, {ps('100', '100')}, and the second versions of {ps('102b', '102')} and {ps('145b', '145')}
                </Fragment>,
              ],
              [
                '6.6.8.6',
                'Short metre (S.M.)',
                <Fragment key="sm">
                  {ps('025', '25')}, {ps('050', '50')}, {ps('067', '67')}, {ps('070', '70')}, and the second version of {ps('045b', '45')}
                </Fragment>,
              ],
              [
                'Other',
                'Special metres',
                <Fragment key="other">
                  {ps('136', '136')} (8.7.8.7), and the second versions of {ps('124b', '124')} (10.10.10.10.10), {ps('136b', '136')} and {ps('148b', '148')} (6.6.6.6.8.8) and{' '}
                  {ps('143b', '143')} (6.6.6.6.6.6.6.6). Each has its own tune.
                </Fragment>,
              ],
            ].map(([metre, name, psalms]) => (
              <View key={metre as string} style={[styles.tr, { borderTopWidth: 1, borderTopColor: c.line }]}>
                <T style={[styles.c1, { fontFamily: fonts.semibold }]}>{metre}</T>
                <T style={styles.c2}>{name}</T>
                <T style={styles.c3}>{psalms}</T>
              </View>
            ))}
          </View>
          <T muted small>
            Old psalters write the metre as C.M., L.M. or S.M. Some books write 8.6.8.6 as 86.86.
          </T>
        </Card>
      </View>

      <Card>
        <H2>The words and the tunes</H2>
        <P>
          The words, the tunes and the match of each syllable to its note come from <ExternalLink href="https://github.com/kadencartwright/open-1650">Open 1650</ExternalLink>, a
          project by Kaden Cartwright{commit ? ` (commit ${commit})` : ''}.
        </P>
        <Li>The text of the psalms is in the public domain. Open 1650 took it from the Free Church of Scotland edition.</Li>
        <Li>The tunes and their harmony are in the public domain. Most come from the Christian Classics Ethereal Hymnary.</Li>
        <Li>The match of syllables to notes is from Open 1650, under CC0. Open 1650 marks this data as a prototype. Some lines can be wrong.</Li>
        <Li>The player code is from Open 1650, under the MIT License.</Li>
      </Card>

      <Card>
        <H2>Related sites</H2>
        <Li>
          <ExternalLink href="https://haddingtonbible.org">The Self-Interpreting Bible</ExternalLink> has the notes of John Brown of Haddington on each psalm. Each verse number in a
          psalm links to these notes.
        </Li>
        <Li>
          <ExternalLink href="https://hearers.app">Hearers</ExternalLink> helps you memorise the catechisms, the creeds and Scripture.
        </Li>
        {/* The App Store does not allow a link to outside payments, so iOS does not show it. */}
        {Platform.OS !== 'ios' && (
          <P>
            If this app helps you, you can support it on{' '}
            <ExternalLink href={KOFI} event="Ko-fi">
              Ko-fi
            </ExternalLink>
            .
          </P>
        )}
      </Card>
    </Page>
  )
}

const P = ({ children }: { children: ReactNode }) => <T style={styles.p}>{children}</T>

const Li = ({ children }: { children: ReactNode }) => (
  <View style={styles.li}>
    <T>•</T>
    <T style={{ flex: 1 }}>{children}</T>
  </View>
)

const ps = (key: string, label: string) => <A href={psalmHref(key)}>{label}</A>

const PS23: [string, number][] = [
  ['The·LORD’s·my·shep·herd,·I’ll·not·want.', 8],
  ['He·makes·me·down·to·lie', 6],
  ['In·pas·tures·green:·he·lead·eth·me', 8],
  ['the·qui·et·wa·ters·by.', 6],
]

const styles = StyleSheet.create({
  p: { marginBottom: 12 },
  li: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 4 },
  table: { marginBottom: 14 },
  tr: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  count: { fontFamily: fonts.display, fontWeight: '800', fontSize: 17, width: 40, textAlign: 'right' },
  c1: { width: 72 },
  c2: { width: 110 },
  c3: { flex: 1 },
})
