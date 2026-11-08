# Psalter

Sing the 1650 Scottish Psalter, the Psalms of David in Metre. The app has all 150 psalms and the
second versions of 13 psalms. Each psalm has a choice of tunes. The player plays the tune in four
parts and lights each syllable when you must sing it.

The name and the domain are not chosen yet.

## Run

The app needs Node 24 or later.

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # the static app in dist/
```

## Deployment

CI owns the deployment to Cloudflare Pages. Do not deploy from a workstation.

1. A push to `main` starts the `Website` workflow. It runs the tests and builds `dist/`.
2. When `Website` passes, the `Deploy to Cloudflare Pages` workflow starts.
3. That workflow downloads the `dist/` artifact. It does not build again.
4. It makes the Pages project `psalter` if the project does not exist.
5. It deploys the artifact and the Pages Functions to the production branch `main`.
6. It checks the app, the psalm data and `/a/boot.js` on the live site.

A pull request from this repository also gets a preview. The job summary of the `Website` run
shows the preview address.

The workflows need two repository secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | An API token with the permission Account, Cloudflare Pages, Edit |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID from the Cloudflare dashboard |

`public/_headers` sets the cache rules on Pages.

## Analytics

The hosted app counts visits with Umami, as hearers.app does. Umami uses no cookies.

- A Pages Function, `functions/a/[[path]].ts`, serves `/a/`. It forwards the tracker and the events
  to Umami, so the Umami address stays secret. The code is in `functions/_lib/analytics.ts`.
- `shared/analytics-loader.ts` holds the loader. `index.html` has a copy. A test makes sure that
  the two copies are the same.
- `track()` in `src/lib/track.ts` sends three events: `Psalm played`, `Tune chosen` and
  `View chosen`.

To turn on analytics, set these secrets on the Pages project:

```bash
npx wrangler pages secret put ANALYTICS_FORWARDING_URL --project-name=psalter
npx wrangler pages secret put ANALYTICS_WEBSITE_ID --project-name=psalter
```

`ANALYTICS_FORWARDING_URL` is the Umami origin with `https://` and no path.
`ANALYTICS_WEBSITE_ID` is the UUID of the Umami website for this app. Then run the deploy
workflow again.

Analytics counts only `psalter.pages.dev`. To count another domain, set `ANALYTICS_HOSTS` to a list
of hosts with commas between them. Branch previews, `localhost` and self-hosted copies send
nothing.

## Docker

GitHub Actions builds the image `ghcr.io/3stacks/psalter` for `linux/amd64` and `linux/arm64`.
A push to `main` publishes the tag `latest`. A tag `v1.2.3` publishes the tag `1.2.3`.

```bash
docker run -d -p 8080:8080 ghcr.io/3stacks/psalter:latest
```

The image is nginx with the built app. The app keeps all settings in the browser, so the image
needs no volume.

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
Each file names the commit that it comes from.

- `compilePerformance.ts` makes a timeline of notes and syllables from a tune and a setting.
- `useSingAlong.ts` plays the timeline with Web Audio and gives the current syllable.
- `retargetSetting.ts` moves a setting onto another tune.

The app saves the tune for each psalm, the key, and the speed for each psalm and tune in
`localStorage`.

## Links

- Each verse number links to the notes of John Brown of Haddington on
  [haddingtonbible.org](https://haddingtonbible.org).
- Each psalm links to [Hearers](https://hearers.app), where you can memorise the psalm in the KJV.
