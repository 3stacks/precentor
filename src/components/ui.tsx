import { Link, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import type { ReactNode, RefObject } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { track } from '../lib/track.ts'
import { fonts, MAX_WIDTH, useColors } from '../lib/theme.ts'

export const KOFI = 'https://ko-fi.com/lukeboyle'

/** Body text in the app colours. */
export function T({ style, muted, small, ...props }: TextProps & { muted?: boolean; small?: boolean }) {
  const c = useColors()
  return <Text {...props} style={[{ color: muted ? c.muted : c.text, fontFamily: fonts.regular, fontSize: small ? 14 : 16, lineHeight: small ? 20 : 24 }, style]} />
}

export function H1({ children, style, light }: { children: ReactNode; style?: StyleProp<TextStyle>; light?: boolean }) {
  const c = useColors()
  return (
    <Text role="heading" aria-level={1} style={[{ fontFamily: fonts.display, fontWeight: '800', fontSize: 32, lineHeight: 37, color: light ? '#fff' : c.text, marginBottom: 6 }, style]}>
      {children}
    </Text>
  )
}

export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors()
  return (
    <Text role="heading" aria-level={2} style={[{ fontFamily: fonts.display, fontWeight: '800', fontSize: 22, lineHeight: 26, color: c.text, marginBottom: 8 }, style]}>
      {children}
    </Text>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors()
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line, shadowColor: c.shadow }, style]}>{children}</View>
}

/** A link to a screen of the app. On the web it is an <a> element. */
export function A({ href, children, style }: { href: string; children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors()
  return (
    <Link href={href as Href} style={[{ color: c.accent }, style]}>
      {children}
    </Link>
  )
}

/** A link to another site. The native app opens it in the in-app browser. */
export function ExternalLink({ href, children, style, event }: { href: string; children: ReactNode; style?: StyleProp<TextStyle>; event?: string }) {
  const c = useColors()
  return (
    <Link
      href={href as Href}
      style={[{ color: c.accent }, style]}
      onPress={(e) => {
        if (event) track(event)
        if (Platform.OS !== 'web') {
          e.preventDefault()
          void WebBrowser.openBrowserAsync(href)
        }
      }}>
      {children}
    </Link>
  )
}

export function Button({ label, onPress, on, style, textStyle, accessibilityLabel, children }: { label?: string; onPress: () => void; on?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; accessibilityLabel?: string; children?: ReactNode }) {
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={accessibilityLabel ?? label}
      aria-pressed={on}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : pressed || hovered ? c.surface2 : c.surface },
        style,
      ]}>
      {children ?? <Text style={[{ fontFamily: fonts.semibold, fontSize: 15, color: on ? c.accentInk : c.text }, textStyle]}>{label}</Text>}
    </Pressable>
  )
}

/** A screen that scrolls, with the content at a readable width and the footer at the end. */
export function Page({ children, footer = true, scrollRef }: { children: ReactNode; footer?: boolean; scrollRef?: RefObject<ScrollViewInstance | null> }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[styles.page, { paddingBottom: 16 + insets.bottom }]}>
      <View style={styles.column}>
        {children}
        {footer && <Footer />}
      </View>
    </ScrollView>
  )
}

export function Footer() {
  const c = useColors()
  return (
    <View style={styles.foot}>
      {/* The App Store does not allow a link to outside payments, so iOS does not show it. */}
      {Platform.OS !== 'ios' && (
        <>
          <ExternalLink href={KOFI} event="Ko-fi" style={{ fontSize: 14 }}>
            Support Precentor on Ko-fi
          </ExternalLink>
          <Text style={{ color: c.muted }} aria-hidden>
            ·
          </Text>
        </>
      )}
      <A href="/about" style={{ fontSize: 14 }}>
        About
      </A>
      <Text style={{ color: c.muted }} aria-hidden>
        ·
      </Text>
      <A href="/privacy" style={{ fontSize: 14 }}>
        Privacy
      </A>
    </View>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <T muted style={{ textAlign: 'center', paddingVertical: 40 }}>
      {children}
    </T>
  )
}

export const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  page: { paddingHorizontal: 16, paddingTop: 20, flexGrow: 1 },
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: 24 },
  foot: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 8, paddingBottom: 8 },
})
