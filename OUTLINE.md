
# Seamless Mod Swiper — Development Outline

---

## Scope and Guardrails
- Use only the **official Nexus Mods API**. No scraping outside API terms.
- Respect Nexus Mods ToS, rate limits, and attribution rules.
- No automation that posts comments, votes, or modifies ratings.
- **Adult content:** ON by default. Users can toggle OFF in Settings.
- **Storage (Browser):** Approved mods and settings stored in IndexedDB. Export/Import available for JSON files.
- **Storage (Desktop, later):** Files stored in the same folder as the executable when Tauri integration is added.

---

## Stage 1 — Core Shell and Deck
**Goal:** minimal, usable app with local mock data.

- **Stack:** React + TypeScript + Three.js (browser-first). Three.js via `@react-three/fiber` and `@react-three/drei` for declarative 3D rendering.
- **App type:** single-page application with a swipe deck UI.
- **Controls:** keyboard and mouse. No touch gestures.
- **Card order:** each session uses a **new random seed** so the deck feels fresh.  
  - On exit, remember only the **front card** position.  
  - On next launch, show that saved front card first, then a newly seeded deck.
- **Visual style:** one **dark theme** as the base. Keep the base clean with the expectation that game-specific themes can be added later and toggled.

---

## Stage 2 — Nexus Mods Integration and Access
**Goal:** live data from the API with a simple access model.

- **API key entry:** user pastes the key **every session** at startup.  
  - The key is **never written to disk**, never exported, and never logged.
- **Network access:** fetch mod lists and details through the official endpoints.
- **Rate limits:**  
  - If the server returns **429 Too Many Requests**, pause requests.  
  - Read **Retry-After** and wait the given number of seconds before resuming.  
  - Identify the app with a clear User-Agent string.  
  - Keep a reasonable request cadence to avoid throttling.
- **Attribution:** follow Nexus Mods attribution requirements in a fixed **About** panel. No per-card attribution overlays.

---

## Stage 3 — Filtering and Locale Handling
**Goal:** control which items appear in the deck.

- **Adult toggle:** ON by default, user can turn OFF.
- **Translation exclusion (simplified):**  
  - Exclude entries that appear to be translations **based on tags, metadata, and basic language detection**.  
  - Prefer content in the selected locale. If tags or metadata indicate a language mismatch, exclude it.  
  - Deep content analysis of description/changelog/comments is deferred to a later phase.
- **Filter timing:** apply filters **before** deck shuffling.
- **Persistence of filters:** store the current filter choices **inside the approved-mods JSON header** (see Stage 5).

---

## Stage 4 — Scoring Heuristic (Game: Cyberpunk 2077, Patch: **2.3.2**)
**Goal:** show a confidence score for compatibility.

- **Base score:** start at **50**.
- **Positive confirmation → max score:**  
  - If the **changelog, description, tags, an author comment, or any clear combination** explicitly confirms compatibility with the selected patch, set score to **max**.  
- **Negative evidence → deductions from max:**  
  - User comments or bug reports indicating it does not work reduce the score **from max**, **unless** those comments are **older** than the mod's latest update.  
- **Other signals and weights (example):**  
  - Recent update date: increase  
  - Multiple reports of breakage: decrease  
  - Dependency on known-broken framework: decrease
- **Display:** a numeric score with a brief one-line reason.  
- **Manual override:** not included for now. May be considered later for a community-shared database.

---

## Stage 5 — Persistence, Files, and Layout
**Goal:** keep the footprint simple and local.

- **Approved mods JSON:** always create this logical artifact, even if empty.  
  - **Structure:**  
    ```json
    {
      "header": {
        "fileName": "approved-mods-{game}.json",
        "createdAt": "ISO8601 timestamp",
        "game": "cyberpunk-2077",
        "patch": "2.3.2",
        "filters": {
          "adult": true,                 // true means adult visible
          "excludeTranslations": true,   // translation exclusion enabled
          "locale": "en-US"
        },
        "notes": ""
      },
      "mods": [
        { "name": "Mod Title", "url": "https://nexusmods.com/..." }
      ]
    }
    ```
  - Only **name** and **url** are stored for each approved mod.
- **Storage (Browser):**  
  - Store approved mods and settings in **IndexedDB**.  
  - Provide **Export** action to download JSON file.  
  - Provide **Import** action to upload and restore from JSON file.  
  - No integrity checks or backups in browser version (deferred to desktop).
- **Storage (Desktop, later):**  
  - Write JSON to `{appFolder}/approved-mods-{game}.json`.  
  - Compute a **SHA-256** fingerprint of the JSON on save and store it alongside the file (for example `{filename}.sha256`). This detects corruption or partial writes.  
  - Keep a **single rotating backup**: before saving a new version, move the existing JSON to `{filename}.bak`. If a save goes wrong, restore from `.bak`.

---

## Stage 6 — Caching and Offline Mode
**Goal:** reduce network use and support basic viewing when offline.

- **What is cached:**  
  - Mod list responses and detail pages.  
  - Small thumbnails or preview images if allowed by API terms.  
  - Lightweight computed data (for example a precomputed compatibility note).
- **Storage (Browser):**  
  - Cache API responses and computed data in **IndexedDB**.  
  - Use **Cache Storage API** for thumbnail images if needed.  
  - A **Clear Cache** action in Settings deletes cached content.  
  - Basic response caching only; full offline mode with service worker is deferred.
- **Storage (Desktop, later):**  
  - Files saved under an internal `cache/` folder next to the executable.  
  - When offline mode is enabled, the app does **not** make network requests. It shows only what is already cached. Anything not cached will be unavailable until you go online.
- **Image loading:** preload all thumbnail images for the current session deck. Show loading placeholders during fetch.

---

## Stage 7 — UX and Accessibility
**Goal:** make the app comfortable and inclusive.

- **Focus management:**  
  - Tabbing moves through controls in a logical sequence.  
  - The focused element is visibly highlighted.  
  - After actions like Accept or Reject, focus moves to the next actionable element so keyboard users do not lose context.
- **Screen reader labels:**  
  - Provide clear accessible names for interactive elements such as "Accept mod," "Reject mod," "Open details," and "Open Settings."  
  - Announce important state changes, for example "Rate limited. Try again in N seconds."
- **Themes:** one **dark base theme** only.  
  - Game-specific themes may be added later and must be toggleable.

---

## Stage 8 — Optional Memory to Reduce Repeats Across Sessions
**Goal:** see fresh items across sessions without storing a large history.

- **LRU memory (deferred):** This feature is deferred to a later phase. The app will rely on random seeding per session for now.
- **Future implementation:**  
  - Keep a small list of the **most recently shown** `(modId, fileId)` pairs.  
  - When building a new session's deck, skip items found in this list.  
  - When the list is full, drop the oldest entry.  
  - **Storage (Browser):** store in IndexedDB.  
  - **Storage (Desktop, later):** store as a small file next to the executable.

---

## Stage 9 — Diagnostics and Exports
**Goal:** make troubleshooting explicit and user-driven.

- **Diagnostics (deferred):** This feature is deferred to a later phase. No error logs or diagnostics export needed for MVP.
- **No telemetry:** none collected, optional or otherwise.
- **Future implementation (desktop):**  
  - Error logs kept next to the executable.  
  - Export logs only when the user explicitly triggers an **Export Diagnostics** action from Settings.  
  - Show an info box stating that personal information was not included to the best of the app's ability, but users should review the file before sharing.

---

## Stage 10 — Packaging and Platforms (Browser)
**Goal:** ship a browser-deployable build.

- **Build tool:** Vite with React + TypeScript.
- **Package:** static build (`dist/`) deployable to any static host (GitHub Pages, Cloudflare Pages, Netlify, Vercel, S3, etc.).
- **Targets:** modern browsers (Chromium, Firefox, Safari - recent versions).
- **Environment:** API base URL and game/patch defaults via environment variables at build time.

## Stage 11 — Desktop Packaging (Tauri, Deferred)
**Goal:** ship a portable desktop build.

- **Package:** Tauri build distributed as a **zip**. The app runs from any writable folder.  
- **Platforms:** Windows primary. Linux support is later and low priority. macOS is not planned.  
- **Code signing:** not planned. This is a distribution trust feature, not related to secret storage.
- **Note:** Desktop integration will reuse the same React codebase, adding Tauri-specific storage and filesystem APIs where needed.

---

## Stage 12 — Future Extensions (kept in mind during base design)
**Goal:** acknowledge room for growth without defining it now.

- **Visual and UI enhancements:** there is scope for richer 3D effects, animations, and game-themed skins. Build the base with this in mind so themes can be added without rewriting core UI. Advanced/custom shaders to be part of late stage development.  
- **Plugin API (deferred):** potential for sandboxed add-ons that supply extra filters or scoring signals. This could later tie into a community-maintained dataset, but it is not part of the current scope.  
- **Cross-game expansion:** core functionality should assume that **selected additional games** will be added over time to the roster.

---

## Legal and Compliance Summary
- Use official Nexus Mods endpoints only.  
- Respect rate limits and terms.  
- Provide attribution in a single **About** panel, not per-mod overlays.  
- No telemetry.  
- No key storage. The API key is pasted each session and never persisted.
