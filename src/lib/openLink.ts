import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { appLink } from './appLink.ts'

/**
 * Open a link from the native app. A link to Hearers, Covenant Household or
 * Haddington Bible opens that app when it is on the device. Any other link,
 * or a sibling app that is not installed, opens in the in-app browser.
 */
export async function openLink(url: string) {
  const app = appLink(url, 'precentor')
  if (app) {
    try {
      await Linking.openURL(app)
      return
    } catch {
      // The app is not on the device. Open the website.
    }
  }
  await WebBrowser.openBrowserAsync(url).catch(() => {
    // The browser did not open. There is nothing more to do.
  })
}
