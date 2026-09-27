# Gift Track

A numbered log of gifts and cash received. Everything stays on the device; there is no backend.

## Features

- **Lists**: create named lists, each with its own numbered entries.
- **Entries**: add a description, tag it as a gift or cash, and optionally attach a photo.
- **Cash amounts**: record an amount for cash entries, or leave it empty.
- **On-device OCR**: reads text from photos to suggest a description. Toggle it in Settings or on the camera screen, or run it per photo with "Scan text".
- **PDF export**: export a list at any time, with photos, gift and cash counts, and the cash total.
- **Offline and installable**: a PWA that works offline once installed.
- **Native apps**: Android and iOS builds through Capacitor.
- **Themes**: light, dark, or follow the system.

## Stack

React, TypeScript, Vite, Dexie (IndexedDB), Tesseract.js, jsPDF, Capacitor, vite-plugin-pwa.

## Commands

```bash
npm install              # install deps; also generates icons and copies OCR assets
npm run dev              # dev server (camera needs https or localhost)
npm run build            # type-check and build to dist/
npm run preview          # serve the production build
npm run lint             # oxlint
npm run generate-assets  # regenerate web icons and OCR assets
```

### Docker

```bash
docker build -t gift-track .
docker run -d -p 8080:80 gift-track
```

Serve it over HTTPS. The camera and offline mode need a secure context.

### Native apps

```bash
npm run native:sync      # build and copy into android/ and ios/
npm run native:assets    # regenerate native icons and splash screens
npm run android:open     # open in Android Studio
npm run ios:open         # open in Xcode (macOS only)
```
