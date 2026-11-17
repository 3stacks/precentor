# Store screenshots

Upload the files in their order. They are slices of one wide picture, so the order matters.

- `ios/screenshot-1.png` to `ios/screenshot-4.png`: App Store, 6.9-inch iPhone, 1320 × 2868.
- `ios-6.3/screenshot-1.png` to `ios-6.3/screenshot-4.png`: App Store, 6.3-inch iPhone, 1206 × 2622.
  Use this set if App Store Connect asks for the 6.1-inch or the 6.3-inch display.
- `ipad/screenshot-1.png` to `ipad/screenshot-4.png`: App Store, 13-inch iPad, 2064 × 2752.
  App Store Connect asks for this set, because the app supports the iPad.
- `play/screenshot-1.png` to `play/screenshot-4.png`: Google Play, phone, 1080 × 1920.

Each `panorama.png` is the whole picture. Keep it for reference.

## How to make them again

The raw screens come from the web app. `raw/` has the screens at the size of an iPhone: 440 × 956
at scale 3. `raw-ipad/` has the screens at the size of a 13-inch iPad: 1032 × 1376 at scale 2. The
capture hides the Ko-fi link and the offer of the App Store app, because the iOS app does not show
them.

```bash
node capture.cjs raw            # iPhone. Needs playwright, and a deploy of precentor.app.
node capture.cjs raw-ipad ipad  # iPad. Add a URL as a third argument to use a local build.
node compose.cjs config.json . ipad  # Needs sharp, and the fonts Inter and Source Serif 4.
```

The third argument of `compose.cjs` selects the sets to make: `ios`, `ios-6.3`, `play` or `ipad`.
With no third argument, it makes all of the sets again.

`config.json` holds the colours, the headlines and the order of the screens.
