// On the web, load Score and abcjs only when a person opens Music.
import { lazy, Suspense, type ComponentProps } from 'react'

const Score = lazy(() => import('./Score.tsx'))

export default function ScoreHost(props: ComponentProps<typeof Score>) {
  return (
    <Suspense fallback={null}>
      <Score {...props} />
    </Suspense>
  )
}
