import Head from 'expo-router/head'
import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { A, Card, ExternalLink, H1, H2, Page, T } from '../components/ui.tsx'

const ISSUES = 'https://github.com/3stacks/precentor/issues'

const P = ({ children }: { children: ReactNode }) => <T style={styles.p}>{children}</T>

/** /terms: the terms of use of Precentor. Google Play links to this page. */
export default function Terms() {
  return (
    <Page>
      <Head>
        <title>Terms · Precentor</title>
        <meta
          name="description"
          content="The terms of use of Precentor. Precentor is free, and we supply it as it is."
        />
      </Head>
      <H1>Terms</H1>
      <T muted>Last change: 26 November 2026</T>
      <Card>
        <P>Precentor is free. These terms tell what you can expect from Precentor and from us.</P>
      </Card>
      <Card>
        <H2>Who we are</H2>
        <P>
          Alpine Hills Consulting Pty Ltd publishes Precentor. The company is in Australia. In these terms, “we” and
          “us” mean this company.
        </P>
      </Card>
      <Card>
        <H2>Use of Precentor</H2>
        <P>You can use Precentor at no cost. You need no account.</P>
        <P>If you use Precentor, you agree to these terms. If you do not agree, do not use Precentor.</P>
      </Card>
      <Card>
        <H2>No warranty</H2>
        <P>We supply Precentor as it is. We do not promise that it has no errors, or that it is always available.</P>
        <P>To the extent that the law permits, we are not liable for loss or damage from your use of Precentor.</P>
        <P>
          These terms do not remove rights that you have under the Australian Consumer Law, or under other law that an
          agreement cannot remove.
        </P>
      </Card>
      <Card>
        <H2>Links to other sites</H2>
        <P>Precentor links to other sites and apps. We do not control them. Their own terms apply.</P>
      </Card>
      <Card>
        <H2>Privacy</H2>
        <P>
          The <A href="/privacy">privacy policy</A> tells what Precentor keeps, and where.
        </P>
      </Card>
      <Card>
        <H2>The law</H2>
        <P>The law of Australia applies to these terms.</P>
      </Card>
      <Card>
        <H2>Changes and contact</H2>
        <P>
          If these terms change, this page shows the new terms and the date of the change. For a question, open an issue
          on <ExternalLink href={ISSUES}>GitHub</ExternalLink>.
        </P>
      </Card>
    </Page>
  )
}

const styles = StyleSheet.create({
  p: { marginTop: 8, lineHeight: 24 },
})
