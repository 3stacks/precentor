# Store screenshots

Upload the files in their order. They are slices of one wide picture, so the order matters.

- `ios/screenshot-1.png` to `ios/screenshot-4.png`: App Store, 6.9-inch iPhone, 1320 × 2868.
- `play/screenshot-1.png` to `play/screenshot-4.png`: Google Play, phone, 1080 × 1920.

Each `panorama.png` is the whole picture. Keep it for reference.

## How to make them again

The raw screens come from the web app at the size of an iPhone. The capture hides the Ko-fi link,
because the iOS app does not show it.

```bash
node capture.cjs raw          # needs playwright, and a deploy of precentor.app
node compose.cjs config.json .  # needs sharp, and the fonts Inter and Source Serif 4
```

`config.json` holds the colours, the headlines and the order of the screens.
