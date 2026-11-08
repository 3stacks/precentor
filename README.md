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
