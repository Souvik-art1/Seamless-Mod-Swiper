# Seamless Mod Swiper

Tinder-style Electron + React desktop app for browsing Cyberpunk 2077 mods from Nexus Mods with an intelligent patch 2.3 compatibility score.

## Features
- Electron desktop app (Windows, macOS, Linux)
- React swipe UI (react-tinder-card)
- Nexus Mods API integration (latest mods, details, changelogs)
- Optional comments scraping for compatibility signals
- Compatibility scoring with reasons tooltip
- Filters: include adult mods, exclude translation mods
- Session persistence (seen mods, accepted mods)
- Export accepted mods (TXT, CSV, JSON)
- Settings panel for API key and preferences

## Setup
1. Install dependencies
```bash
bun install # or npm install / yarn install / pnpm install
```

2. Run in development
```bash
bun run dev # or npm run dev
```
This starts Vite (renderer) and Electron (main). The app loads the Vite dev server.

3. Build package
```bash
bun run build && bun run package
```
This builds the renderer to `dist/` and packages the Electron app (using electron-builder).

## Nexus Mods API Key
- You must have a Nexus Mods API key (Premium).
- Open Settings in the app and paste your API key.
- Key is stored locally via `electron-store`.

## Compatibility Scoring (Patch 2.3)
Base score is 70%. Signals:
- +18 Updated after patch 2.3 release date
- +18 Explicit 2.3 mention in description/changelog
- +12 Multiple comments confirming 2.3 works (optional scraping)
- +4/+8/+12 Endorsement ratio boost
- -22 No updates since before 2.3
- -28 Incompatibility statement / reports
- Auto-exclude if final score < 20%

Patch 2.3 release date can be configured in Settings (default `2025-01-01`).

## Filters
- Include adult-flagged mods (on by default)
- Exclude translation mods (on by default)
- Enable comments scraping (off by default)

## Exports
Use the Export button in the header. Three files are saved through native save dialogs:
- `accepted-mods.txt`
- `accepted-mods.csv`
- `accepted-mods.json`

## Notes
- Comments scraping parses the Nexus Mods posts tab HTML and may be rate-limited or change; toggle it in Settings.
- Translation filtering uses category/tags/title heuristics.
- The app does not download/install mods.

## Project Structure
```
├── electron/
│   ├── main.js
│   ├── preload.js
│   └── api/
│       └── nexusMods.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── AcceptedModsList.jsx
│   │   ├── CompatibilityScore.jsx
│   │   ├── ModCard.jsx
│   │   └── SwipeContainer.jsx
│   ├── services/
│   │   ├── compatibilityAnalyzer.js
│   │   ├── modsFetcher.js
│   │   └── storage.js
│   └── styles/
│       └── global.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## License
MIT
