import { Link, usePathname, type Href } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { fonts, MAX_WIDTH, useColors } from '../lib/theme.ts'

/** The bar at the top of the web app, as in the Vite app: the brand, then Psalms and About. */
export function WebHeader() {
  const c = useColors()
  const path = usePathname()
  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderBottomColor: c.line }]}>
      <View style={styles.inner}>
        <Link href="/" style={[styles.brand, { color: c.text }]} aria-label="Precentor, the psalms">
          <Mark color={c.panel} /> Precentor
        </Link>
        <View style={styles.nav}>
          <HeaderLink href="/" label="Psalms" active={path === '/'} />
          <HeaderLink href="/about" label="About" active={path.startsWith('/about')} />
        </View>
      </View>
    </View>
  )
}

export function HeaderLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  const c = useColors()
  return (
    <Link href={href as Href} style={[styles.link, { color: active ? c.accent : c.muted, backgroundColor: active ? c.accentSoft : 'transparent' }]}>
      {label}
    </Link>
  )
}

function Mark({ color }: { color: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <Rect width={24} height={24} rx={5} fill={color} />
      <Path d="M10 17.5a2.5 2.5 0 1 1-1-2V6l8-1.5v10a2.5 2.5 0 1 1-1-2V7.2L10 8.3Z" fill="#fff" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1, paddingHorizontal: 16 },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  brand: { fontFamily: fonts.display, fontWeight: '800', fontSize: 22, flexDirection: 'row', alignItems: 'center', gap: 8, display: 'flex' },
  nav: { marginLeft: 'auto', flexDirection: 'row', gap: 4 },
  link: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, fontSize: 15, fontFamily: fonts.medium },
})
