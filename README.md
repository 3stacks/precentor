# Precentor

Sing the 1650 Scottish Psalter, the Psalms of David in Metre. The app has all 150 psalms and the
second versions of 13 psalms. Each psalm has a choice of tunes. The player plays the tune in four
parts and lights each syllable when you must sing it.

In Scottish churches the precentor led the psalm singing, one line at a time. This app does the
same.

Use the app at [precentor.app](https://precentor.app).

If Precentor helps you, you can support it on [Ko-fi](https://ko-fi.com/lukeboyle).

## One app for three platforms

Precentor is one Expo app (SDK 58, React Native 0.88, Expo Router). The same code runs on the web,
on iOS and on Android. On the web, react-native-web renders the app.

| Part | Web | iOS and Android |
|------|-----|-----------------|
| Screens | `src/app/`, rendered by react-native-web | `src/app/`, native views |
| Sound | The Web Audio API of the browser | `react-native-audio-api`, a native Web Audio engine |
| Sheet music | abcjs draws SVG in the page | abcjs draws SVG in an Expo DOM component, in a web view |
| Psalm data | The app gets `corpus/` from the server | The app reads `corpus/` from its own bundle |
| Settings | `localStorage` | AsyncStorage |

A file that ends in `.native.ts` replaces the file of the same name on iOS and Android.

## Run

The app needs Node 24 or later.

```bash
npm install
npm run dev        # the web app at http://localhost:5180
npm run build      # the static web app in dist/
npm test           # the tests of the engine, the music, the routes and the analytics
```

`npm install` also runs `scripts/link-corpus.mjs`. See [Psalm data on iOS and Android](#psalm-data-on-ios-and-android).

### Run on an iPhone

The sound engine is a native module. Expo Go does not contain it, so you need a development build.

To make a development build in the cloud, do these steps:

1. Create an Expo account.
2. Run `npx eas-cli@latest login`.
3. Run `npx eas-cli@latest init`. This command writes the project id into `app.json`.
4. To register the iPhone, run `npx eas-cli@latest device:create`.
5. Run `npx eas-cli@latest build --profile development --platform ios`.
6. Install the build on the iPhone from the link that the build shows.
7. Run `npx expo start`.
8. Scan the QR code with the camera of the iPhone.

To make the build on a Mac with Xcode, connect the iPhone and run `npx expo run:ios --device`.
For the iOS Simulator, run `npx expo run:ios`. For Android, run `npx expo run:android`.

The app opens in Expo Go, but Expo Go plays no sound. The words and the notes still follow the beat,
and the player shows a note about the development build.

On iOS, the app sets the category of the audio session to `playback`. So when the iPhone is on
silent, the tune plays, as in a music app.

### Checks before a release

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform ios --platform android   # the native bundles must compile
npm run build                                       # the web app
```

## Release tests

When you publish a GitHub release, the `Release tests` workflow runs all of the tests. You can also
start it by hand from the Actions tab. The workflow makes no store build and submits nothing.

| Job | Tests |
|-----|-------|
| `checks` | The unit tests, `tsc`, `expo lint` and `expo-doctor` |
| `web-e2e` | Playwright tests of the web build in Chromium and WebKit |
| `android-e2e` | Maestro flows on an Android emulator, with a release APK |

The tag of the release must agree with `expo.version` in `app.json`. For example, the tag `v1.0.0`
agrees with the version `1.0.0`.

### Run the web tests

1. Run `npm run build`.
2. Run `npx playwright install chromium webkit` one time.
3. Run `npm run test:e2e:web`.

The tests start `e2e/web/serve.mjs` on port 18180. To use a different port, set `E2E_PORT`. The
server sends `index.html` for each path of the app, as Cloudflare Pages does. The tests are in
`e2e/web/`. The report goes to `playwright-report/`.

### Run the Android tests

Expo Go plays no sound, so the tests use a release build. Start an Android emulator first.

1. Install the [Maestro CLI](https://docs.maestro.dev).
2. Run `npx expo prebuild -p android --no-install`.
3. In `android/`, run `./gradlew assembleRelease`.
4. Run `adb install -r android/app/build/outputs/apk/release/app-release.apk`.
5. Run `maestro test e2e/maestro/`.

The flows take a screenshot at each step. The names start with `store-`, because each screenshot is
a candidate for the store page. In CI, the artifact `android-store-screenshots` holds them.

## Paths and links

| Path | Screen |
|------|--------|
| `/` | The psalms |
| `/psalm/023` | Psalm 23. `023b` is the second version. |
| `/psalm/023?tune=dundee` | Psalm 23 on the tune Dundee |
| `/about`, `/about/metre` | The About page |

The deep link `precentor://psalm/023` opens the same screen in the native app.

The Vite app used hash routes, for example `https://precentor.app/#/psalm/023?tune=dundee`. Other
apps, for example Covenant Household and Hearers, link to these addresses. Before the router starts,
`src/lib/legacyHash.ts` changes an old hash route to its path. So each old link opens the same
psalm and the same tune.

## Psalm data on iOS and Android

The native app carries all of the psalm data in its bundle. It does not get the data from
precentor.app. These are the reasons:

- Each psalm plays with no network, from the first start. Singing offline is important, for
  example in a church with no signal.
- The data is 22 MB, but it compresses to 1.5 MB. The stores compress the app. So the data makes
  the download only a little larger.
- The app has no cache to fill, to check or to clear, and no code for a failed download.

To change the data, release a new version of the app.

Metro bundles a `.json` file as code. For this reason, `scripts/link-corpus.mjs` links each file of
`public/corpus/` to `assets/corpus/` with the extension `.corpus`, and `metro.config.js` treats
that extension as an asset. The script also writes `src/data/corpusAssets.native.ts`. The
`postinstall` script and the `eas-build-post-install` script run it. Git does not keep
`assets/corpus/`.

## Deployment

CI owns the deployment to Cloudflare Pages. Do not deploy from a workstation.

1. A push to `main` starts the `Website` workflow. It runs the tests and builds `dist/`.
2. When `Website` passes, the `Deploy to Cloudflare Pages` workflow starts.
3. That workflow downloads the `dist/` artifact. It does not build again.
4. It makes the Pages project `precentor` if the project does not exist.
5. It deploys the artifact and the Pages Functions to the production branch `main`.
6. It checks the app, the psalm data and `/a/boot.js` on the live site.

Each `pull request` from this repository also gets a preview. The job summary of the `Website` run
shows the preview address.

The workflows need two repository secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | An API token with the permission Account, Cloudflare Pages, Edit |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID from the Cloudflare dashboard |

`npm run build` runs `expo export --platform web`, then `scripts/web-postbuild.mjs`. The export
copies `public/` into `dist/`, with the psalm data, `_headers`, the icon and the web manifest.
`public/index.html` is the page template. `scripts/web-postbuild.mjs` writes the service worker
`dist/sw.js`, and copies the app icon to `dist/apple-touch-icon.png`.

The service worker keeps the app, the psalm list and the tunes when it installs. It keeps each
psalm when you first open that psalm. When a new version takes control, the page loads again.

`public/_headers` sets the cache rules on Pages. The build has no `404.html`, so Pages sends
`index.html` for each path of the app, for example `/psalm/023`.

The app must be at the root of its domain, because the paths start at `/`.

## Analytics

The hosted app counts visits with Umami, as hearers.app does. Umami uses no cookies.

- A Pages Function, `functions/a/[[path]].ts`, serves `/a/`. It forwards the tracker and the events
  to Umami, so the Umami address stays secret. The code is in `functions/_lib/analytics.ts`.
- `shared/analytics-loader.ts` holds the loader. `public/index.html` has a copy. A test makes sure
  that the two copies are the same.
- `track()` in `src/lib/track.ts` sends four events: `Psalm played`, `Tune chosen`, `View chosen`
  and `Ko-fi`.
- The native app sends no events.

To turn on analytics, set these secrets on the Pages project:

```bash
npx wrangler pages secret put ANALYTICS_FORWARDING_URL --project-name=precentor
npx wrangler pages secret put ANALYTICS_WEBSITE_ID --project-name=precentor
```

`ANALYTICS_FORWARDING_URL` is the Umami origin with `https://` and no path.
`ANALYTICS_WEBSITE_ID` is the UUID of the Umami website for this app. Then run the deploy
workflow again.

Analytics counts only `precentor.app`, `www.precentor.app` and `precentor.pages.dev`. To count
another domain, set `ANALYTICS_HOSTS` to a list of hosts with commas between them. Branch
previews, `localhost` and self-hosted copies send nothing.

## Docker

GitHub Actions builds the image `ghcr.io/3stacks/precentor` for `linux/amd64` and `linux/arm64`.
A push to `main` publishes the tag `latest`. A tag `v1.2.3` publishes the tag `1.2.3`.

```bash
docker run -d -p 8080:8080 ghcr.io/3stacks/precentor:latest
```

The image is nginx with the web build. `docker/nginx.conf` sends `index.html` for each path of the
app. The app keeps all settings in the browser, so the image needs no volume.

## Build for the stores

Expo Build makes the signed builds in the cloud. You do not need Xcode or Android Studio.

1. Do steps 1 to 3 of [Run on an iPhone](#run-on-an-iphone).
2. Run `npx eas-cli@latest build --platform all --profile production`.
3. Run `npx eas-cli@latest submit --platform ios`.
4. Run `npx eas-cli@latest submit --platform android`.

The App Store needs an Apple Developer Program membership. Google Play needs a Google Play
Console account.

The app id is `com.lukeboyle.precentor` on both stores. You cannot change it after the first
release.

| Profile | Use |
|---------|-----|
| `development` | A development build for a registered device |
| `development-simulator` | A development build for the iOS Simulator |
| `preview` | A release build for internal testers |
| `production` | A build for the stores. The build number increases at each build. |

## Data

The words, the tunes and the match of each syllable to its note come from
[Open 1650](https://github.com/kadencartwright/open-1650) by Kaden Cartwright.

- The psalm text and the tunes are in the public domain (PDM-1.0).
- The data that Open 1650 makes, for example the match of syllables to notes, is under CC0-1.0.
- Open 1650 marks its text and its syllable data as a prototype. Send corrections to Open 1650.

`scripts/import-corpus.mjs` copies the data into `public/corpus/`. The script pins one commit of
Open 1650. To use a newer commit, change `COMMIT` in the script and run `npm run corpus`.

| File | Content |
|------|---------|
| `public/corpus/index.json` | The list of psalms and tunes |
| `public/corpus/psalms/023.json` | The text of Psalm 23. `023b` is a second version. |
| `public/corpus/settings/023.json` | The syllables of Psalm 23 on the recommended tune |
| `public/corpus/tunes/<tune>.json` | The notes of a tune in four parts |

## Tunes

Each psalm has one recommended tune. Open 1650 takes the recommendation from the Free Church of
Scotland. The tune list also shows each tune with the same metre and the same number of lines.
For another tune, `retargetSetting` moves each syllable onto the notes of that tune.

## Player

`src/engine/` holds the player from Open 1650, under the MIT License. See `src/engine/LICENSE`.
Each file names the commit that it comes from. Each change for Precentor has a comment.

- `compilePerformance.ts` makes a timeline of notes and syllables from a tune and a setting.
- `useSingAlong.ts` plays the timeline and gives the current syllable.
- `webAudioBackend.ts` is the organ: two PeriodicWave stops, a low-pass filter, a reverb and an
  envelope for each note.
- `createAudioBackend.ts` gives the browser audio to the organ. `createAudioBackend.native.ts`
  gives `react-native-audio-api` to the same organ.
- `audioSession.ts` lets Safari on iOS play the tune when the iPhone is on silent.
- `retargetSetting.ts` moves a setting onto another tune.

`react-native-audio-api` has each node that the organ uses, so the organ sounds the same on all
platforms. It has no `getOutputTimestamp()`, so the native app uses the output latency to light
each syllable.

The app saves the tune for each psalm, the key, and the speed for each psalm and tune.

## Links

- Each verse number links to the notes of John Brown of Haddington on
  [haddingtonbible.org](https://haddingtonbible.org).
- Each psalm links to [Hearers](https://hearers.app), where you can memorise the psalm in the KJV.
- The native app opens these links in the in-app browser.
