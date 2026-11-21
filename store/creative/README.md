# App Store creative assets

The App Store shows these two images on iOS 27 and iPadOS 27, and later. They are optional. With no
search image, the App Store shows the screenshots in the search results.

- `header.png`: the product page header, 3840 × 1646.
- `search-results.jpg`: the search results image, 3840 × 2560.

Apple crops each image to fit the device. Only the art safe area in the middle is always in view.
The phrase is in the safe area. The phones stand at its sides, and the crop can remove them.

## How to upload them

1. In App Store Connect, open the app version.
2. Under "Product Page Information", open "Header and Search Results".
3. Select "Header", and add `header.png`. Select "Search Results", and add `search-results.jpg`.
4. Click "Save", and then click "Preview" to see the crop on each device.

Apple reviews the images. You can send them with a new version, or alone from the Asset Library.

## How to make them again

```bash
node store/creative/make.cjs store/screenshots/config.json store/creative   # needs sharp
```

`make.cjs` needs the fonts Inter and Source Serif 4. It uses the colours, the motif and the raw
screens of the store screenshots. The phrase is the title of the first panel. To use a different
phrase or different screens, add a `creative` key to `config.json`:

```json
"creative": { "phrase": "Line 1\nLine 2", "shots": ["raw/a.png", "raw/b.png", "raw/c.png", "raw/d.png"] }
```
