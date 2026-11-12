import { Stack } from 'expo-router'
import { A, Empty, Page } from '../components/ui.tsx'

export default function NotFound() {
  return (
    <Page>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Empty>
        This page does not exist. <A href="/">Go to the psalms</A>.
      </Empty>
    </Page>
  )
}
