import Head from 'expo-router/head'
import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { Card, ExternalLink, H1, H2, Page, T } from '../components/ui.tsx'

const ISSUES = 'https://github.com/3stacks/precentor/issues'

const P = ({ children }: { children: ReactNode }) => <T style={styles.p}>{children}</T>

/** /privacy: what Precentor keeps, and where. The stores link to this page. */
export default function Privacy() {
  return (
    <Page>
      <Head>
        <title>Privacy · Precentor</title>
        <meta name="description" content="Precentor collects no personal data. The apps have no account, no advertisements and no tracking." />
      </Head>
      <H1>Privacy</H1>
      <T muted>Last change: 13 November 2026</T>
      <Card>
        <P>Precentor collects no personal data. It has no account, no advertisements and no tracking.</P>
      </Card>
      <Card>
        <H2>The iPhone and Android apps</H2>
        <P>
          The apps send no data to us or to another company. They have no analytics. The psalms and the tunes are in the app, so the app works with no connection. Your
          settings, for example your choice of tune, stay on your device.
        </P>
        <P>The app connects to the internet only when you open a link, for example to the Self-Interpreting Bible or to Hearers. Those sites have their own privacy policies.</P>
      </Card>
      <Card>
        <H2>The website</H2>
        <P>
          The website counts visits with Umami. Umami uses no cookies and does not identify you. It records the page, the site that sent you, the type of browser and device,
          and the country. It does not keep your IP address. Analytics counts only the public site, precentor.app.
        </P>
        <P>
          Cloudflare hosts the website. Cloudflare processes each visit, as each web host does, to deliver the page and to protect the site. Read the{' '}
          <ExternalLink href="https://www.cloudflare.com/privacypolicy/">privacy policy of Cloudflare</ExternalLink>.
        </P>
      </Card>
      <Card>
        <H2>Gifts</H2>
        <P>
          On the web and on Android, you can give a gift on Ko-fi. Ko-fi and its payment provider process the gift. We receive your name and your message only if you give them
          to Ko-fi.
        </P>
      </Card>
      <Card>
        <H2>Changes and contact</H2>
        <P>
          If this policy changes, this page shows the new policy and the date of the change. For a question, open an issue on <ExternalLink href={ISSUES}>GitHub</ExternalLink>.
        </P>
      </Card>
    </Page>
  )
}

const styles = StyleSheet.create({
  p: { marginTop: 8, lineHeight: 24 },
})
