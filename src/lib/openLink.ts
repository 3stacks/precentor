import * as WebBrowser from 'expo-web-browser'
import { Alert, Linking, Platform } from 'react-native'
import { APPS, appLink, siblingOf } from './appLink.ts'

/** Open `url` in the in-app browser. */
async function openWeb(url: string) {
  await WebBrowser.openBrowserAsync(url).catch(() => {
    // The browser did not open. There is nothing more to do.
  })
}

/**
 * Open a link from the native app. A link to a sibling app opens that app when
 * it is on the device. On an iPhone or an iPad without the sibling app, a dialog offers
 * the App Store page or the website. Any other link opens in the in-app browser.
 */
export async function openLink(url: string) {
  const app = appLink(url, 'precentor')
  if (app) {
    try {
      await Linking.openURL(app)
      return
    } catch {
      // The app is not on the device.
      const sibling = APPS[siblingOf(url, 'precentor') ?? '']
      if (Platform.OS === 'ios' && sibling?.appStore) {
        const { name, appStore } = sibling
        Alert.alert(`${name} is not on this ${Platform.isPad ? 'iPad' : 'iPhone'}`, `Get ${name} free from the App Store, or open the website.`, [
          { text: 'App Store', onPress: () => void Linking.openURL(appStore).catch(() => openWeb(appStore)) },
          { text: 'Website', onPress: () => void openWeb(url) },
          { text: 'Cancel', style: 'cancel' },
        ])
        return
      }
    }
  }
  await openWeb(url)
}
