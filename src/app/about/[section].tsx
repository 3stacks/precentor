import { useLocalSearchParams } from 'expo-router'
import { About } from '../../components/About.tsx'

/** /about/metre: the About page at the section on metre. */
export default function AboutSection() {
  const { section } = useLocalSearchParams<{ section: string }>()
  return <About section={section} />
}
