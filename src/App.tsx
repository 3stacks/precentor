import { useEffect } from 'react'
import { useRoute } from './router.ts'
import { About } from './views/About.tsx'
import { Library } from './views/Library.tsx'
import { PsalmView } from './views/PsalmView.tsx'

export function App() {
  const route = useRoute()
  useEffect(() => {
    if (route.view === 'library' || (route.view === 'about' && !route.section)) window.scrollTo(0, 0)
  }, [route])
  return (
    <>
      <div className="app">
      <header className="top">
        <a className="brand" href="#/">
          <Mark /> Psalter
        </a>
        <nav>
          <a href="#/">Psalms</a>
          <a href="#/about">About</a>
        </nav>
      </header>
      <main className={route.view === 'psalm' ? 'main psalm-main' : 'main'}>
        {route.view === 'psalm' ? <PsalmView key={route.key} psalmKey={route.key} tuneSlug={route.tune} /> : route.view === 'about' ? <About section={route.section} /> : <Library />}
      </main>
      </div>
    </>
  )
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="var(--panel)" />
      <path d="M10 17.5a2.5 2.5 0 1 1-1-2V6l8-1.5v10a2.5 2.5 0 1 1-1-2V7.2L10 8.3Z" fill="#fff" />
    </svg>
  )
}
