import { Stack, useLocalSearchParams } from 'expo-router'
import { PsalmView } from '../../components/PsalmView.tsx'
import { Empty, Page } from '../../components/ui.tsx'
import { isPsalmKey } from '../../lib/routes.ts'

/** /psalm/023 and /psalm/023?tune=dundee. */
export default function PsalmScreen() {
  const { key, tune } = useLocalSearchParams<{ key: string; tune?: string }>()
  if (!isPsalmKey(key))
    return (
      <Page>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Empty>There is no psalm “{key}”.</Empty>
      </Page>
    )
  return <PsalmView key={key} psalmKey={key} tuneSlug={tune || undefined} />
}
