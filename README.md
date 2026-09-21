# Gift Track

A camera-first, numbered photo log for gifts and cash received. Create a
list, snap a photo for each entry, tag it as a gift or cash, and Gift
Track reads any visible text in the shot (on-device OCR) to suggest a
caption. Everything — photos, captions, lists — stays on the device;
there's no backend.

## Stack

- React + TypeScript + Vite
- [Dexie](https://dexie.org/) (IndexedDB) for local storage of lists, items, photo blobs, and settings
- [Tesseract.js](https://github.com/naptha/tesseract.js) for on-device OCR (open-source, no cloud calls)
- `vite-plugin-pwa` for the installable, standalone-display PWA shell

## Getting started

```bash
npm install     # also self-hosts Tesseract's worker/wasm files and generates app icons
npm run dev
```

Open the printed local URL on a phone (or a desktop browser with a
webcam) to try the camera flow — `getUserMedia` requires a secure
context, so use `https` or `localhost`.

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

If you ever need to regenerate the icons or re-copy the Tesseract
assets by hand (e.g. after changing the icon source or the
`tesseract.js`/`tesseract.js-core` versions):

```bash
npm run generate-assets
```

## How it works

- **Home** (`src/screens/HomeScreen.tsx`) lists all lists as manila-folder
  cards. The "+" FAB opens the camera immediately and creates a list once
  the first photo is saved.
- **List** (`src/screens/ListScreen.tsx`) shows items in a numbered grid.
  Its "+" FAB also opens the camera directly — there's no gallery picker,
  by design.
- **Capture flow** (`src/components/CaptureFlow.tsx` +
  `src/components/CameraView.tsx`) opens the live camera via
  `getUserMedia`, captures a frame to a JPEG blob, runs OCR on it (if
  enabled), and pre-fills a caption from the best detected line of text.
  Each entry is also tagged as a **gift** or **cash**. If camera access
  is blocked — commonly inside an in-app browser webview — it shows
  guidance and falls back to a native `<input type="file"
  capture="environment">` camera picker.
- **OCR** (`src/ocr.ts`) runs entirely on-device via a Tesseract.js
  worker, using self-hosted worker/wasm assets so it keeps working
  offline once installed. It can be toggled from the pill on the camera
  screen or from Settings (gear icon on Home), and can also be run
  on-demand per photo via the "Scan text" button on the review screen.
- **Storage** (`src/db.ts`) is a small Dexie schema: `lists`, `items`
  (photo stored as a `Blob`, plus an `entryType` of `"gift"` or
  `"cash"`), and `settings`.

## Installing as an app

Gift Track ships a PWA manifest (`display: standalone`, theme color,
icon set including a maskable variant) and a service worker, so it can
be installed from the browser's "Add to Home Screen" / install prompt
on Android, iOS, and desktop.

## Native Android / iOS apps (Play Store / App Store)

The same web app is also wrapped with [Capacitor](https://capacitorjs.com/)
into real native projects under `android/` and `ios/`, ready for whenever
you want to build and publish — nothing here has been built, signed, or
submitted yet.

```bash
npm run native:sync     # builds the web app and copies it into android/ and ios/
npm run android:open    # opens android/ in Android Studio
npm run ios:open        # opens ios/App in Xcode (macOS + Xcode required)
```

What's already set up:

- `capacitor.config.ts` — app id `com.gifttrack.app`, app name "Gift Track",
  matching background color so there's no white flash on launch.
- Android's `AndroidManifest.xml` declares the `CAMERA` permission (without
  it, `getUserMedia()` can't prompt at all inside the native WebView) and
  marks the camera as optional hardware so the app isn't excluded from
  camera-less devices on the Play Store.
- iOS's `Info.plist` declares `NSCameraUsageDescription` — required or the
  app is killed the moment it requests camera access.
- App icons and splash screens (light + dark) for both platforms, generated
  from the same gift-box mark as the web favicon. Regenerate them after
  changing the design in `scripts/icon-svg.mjs` with:

  ```bash
  npm run native:assets
  ```

- The PWA service worker only registers in a real browser
  (`src/main.tsx` checks `Capacitor.isNativePlatform()`) — inside the native
  shell every asset is already bundled on-device, so registering it there
  would be redundant and unreliable across WebView versions.
- The camera-blocked screen shows OS-Settings guidance instead of
  browser-specific instructions when running natively.

What's still manual (needs your own accounts/tools, so intentionally not
automated here):

1. **Android**: install [Android Studio](https://developer.android.com/studio)
   (bundles the JDK + SDK), open `android/` with `npm run android:open`, and
   build/sign a release AAB from there. Publishing needs a one-time $25
   Google Play developer account.
2. **iOS**: needs a Mac with Xcode — open `ios/App/App.xcworkspace` with
   `npm run ios:open` (or use a cloud Mac CI like Codemagic/Ionic Appflow if
   you don't have one). Publishing needs a $99/year Apple Developer account.
3. Store listings (screenshots, description, privacy policy — this app's
   local-only storage model makes that policy simple) are filled in on each
   store's console directly.
