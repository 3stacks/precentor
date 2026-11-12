import { Platform, useColorScheme } from 'react-native'

// The look of Hearers: Inter for text, Cabinet Grotesk for headings on the web,
// slate greys and the oxblood brand colour. The colours are the sRGB values of
// the oklch colours in the Vite app.
const light = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  text: '#0f172a',
  textSoft: '#0f172acc',
  muted: '#64748b',
  line: '#e2e8f0',
  accent: '#883231',
  accentHover: '#af504b',
  accentInk: '#ffffff',
  accentSoft: '#fbe8e5',
  panel: '#883231',
  error: '#b91c1c',
  shadow: '#0f172a',
}

const dark: typeof light = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#273449',
  text: '#f1f5f9',
  textSoft: '#f1f5f9cc',
  muted: '#94a3b8',
  line: '#334155',
  accent: '#e7a8a2',
  accentHover: '#f4cdc9',
  accentInk: '#0f172a',
  accentSoft: '#531b1a99',
  panel: '#702625',
  error: '#f87171',
  shadow: '#000000',
}

export type Colors = typeof light

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light
}

// Cabinet Grotesk loads from Fontshare on the web (public/index.html). Its
// licence does not allow the font files in a public repository, so the native
// app uses Inter ExtraBold for headings.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: Platform.OS === 'web' ? "'Cabinet Grotesk', Inter_800ExtraBold" : 'Inter_800ExtraBold',
}

export const MAX_WIDTH = 760
