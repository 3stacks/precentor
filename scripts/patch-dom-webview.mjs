// Make @expo/dom-webview catch a failed injectJavaScript.
//
// Expo sends the props of a DOM component (the score) to its web view with
// injectJavaScript, and ignores the promise. On iOS the first send can come
// before the native view exists. The promise then rejects with "Unable to find
// the 'DomWebView' view with tag", and a development build shows a full-screen
// error. Nothing is lost: the web view gets the props again when it is ready.
// The patch catches the rejection. Remove it when Expo catches it.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const file = fileURLToPath(new URL('../node_modules/@expo/dom-webview/build/DomWebView.js', import.meta.url))
const from = 'injectJavaScript: (script)=>viewRef.current?.injectJavaScript(script),'
const to = 'injectJavaScript: (script)=>viewRef.current?.injectJavaScript(script)?.catch?.(()=>{}),'

if (!existsSync(file)) process.exit(0)
const source = readFileSync(file, 'utf8')
if (source.includes(to)) process.exit(0)
if (!source.includes(from)) {
  console.warn('patch-dom-webview: @expo/dom-webview changed. Check if the patch is still necessary.')
  process.exit(0)
}
writeFileSync(file, source.replace(from, to))
console.log('patch-dom-webview: injectJavaScript now catches a failed send.')
