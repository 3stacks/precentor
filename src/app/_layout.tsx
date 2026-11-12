import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { HeaderLink, WebHeader } from '../components/Header.tsx'
import { registerServiceWorker } from '../lib/serviceWorker'
import { storageReady } from '../lib/storage'
import { fonts, useColors } from '../lib/theme.ts'

// Show the splash screen until the fonts and the saved settings load.
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function Layout() {
  const c = useColors()
  const [loaded, failed] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold })
  const [stored, setStored] = useState(false)
  useEffect(() => {
    void storageReady().then(() => setStored(true))
    registerServiceWorker()
  }, [])
  const ready = (loaded || failed) && stored
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])
  if (!ready) return null

  const web = Platform.OS === 'web'
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          header: web ? () => <WebHeader /> : undefined,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.accent,
          headerTitleStyle: { fontFamily: fonts.display, color: c.text },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.bg },
          animation: web ? 'none' : 'default',
        }}>
        <Stack.Screen name="index" options={{ title: 'Precentor', headerRight: () => <HeaderLink href="/about" label="About" /> }} />
        <Stack.Screen name="psalm/[key]" options={{ title: 'Psalm' }} />
        <Stack.Screen name="about/index" options={{ title: 'About' }} />
        <Stack.Screen name="about/[section]" options={{ title: 'About' }} />
      </Stack>
    </>
  )
}
