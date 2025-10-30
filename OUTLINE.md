
# Seamless-Mod-Swiper - Development Outline

**Scope & Guardrails:**
- The app will use only the official Nexus Mods API. Scraping of Nexus Mods pages or CDN content beyond the official API and its terms is prohibited.
- Must respect Nexus Mods Terms of Service, rate limits, and attribution requirements.
- Automated actions that post votes, comments, or manipulate ratings are forbidden.
- Redistribution or serving of cached mod assets (images, archives, binaries) outside the usage allowed by the API is forbidden.
- Clear attribution language per Nexus Mods API/ToS is required whenever mod data or assets are displayed.
- Adult content is opt-in (default off) and can be toggled in Settings.

## Privacy & Legal

- No telemetry or analytics by default; all data is stored locally only.
- Nexus Mods API keys must be stored in a Windows-specific secure store (e.g., Windows Credential Manager/DPAPI). Secrets must never be included in exports or diagnostic bundles and must be redacted from all logs and error messages. Users are advised on safe key rotation/removal and reminded not to commit keys to source control.

## Stage Plan

1) App skeleton
- WinUI 3 desktop app shell
- Core models (Mod, DeckItem, ScoreInfo)
- Mock provider with sample data
- Tinder-style swipe UI (buttons + left/right keys)
- Random order per session; avoid repeats within session. To ensure determinism across runtime versions, a specific, documented seedable PRNG (e.g., xoshiro256**) must be used.
	- Persist an `rngAlgoVersion` identifier alongside the per-session seed.
	- Surface both `seed` and `rngAlgoVersion` in session metadata, logs, and test hooks.
	- Use this specific PRNG implementation (or inject it) for all shuffle/no-repeat logic (e.g., Fisher-Yates) to ensure behavior is reproducible across runtime upgrades.
	- Allow an optional seed and algorithm version parameter for tests to reproduce specific sessions.

2) Persistence
- Persist accepted (right-swiped) mods to JSON using a defined, durable schema:
	- Top-level metadata: { schemaVersion (integer), fileId (opaque unique ID), scoringVersion (string), checksum (sha256) }
	- Each entry: { id, game, targetPatch, title, author, url, acceptedAt (ISO8601), score, rationale }
	- Store per-game files: %LOCALAPPDATA%\Seamless-Mod-Swiper\accepted-mods-{game-slug}.json.
- Before computing the `sha256` checksum, the JSON must be serialized canonically: use UTF-8 encoding, normalize newlines to LF, sort object keys lexicographically, and enforce consistent whitespace and number formatting for deterministic output.
- Implement atomic and durable file writes on Windows:
	- Acquire an exclusive file lock.
	- Write to a temporary file on the same volume as the target.
	- Call `FlushFileBuffers` on the temporary file handle before closing it.
	- Use `ReplaceFile` to atomically swap the temporary file with the target file.
- On read, validate file integrity using the checksum. If validation fails, attempt recovery from `.tmp` or load the last valid backup.
- On reset, keep N rotating backups and require explicit user confirmation before clearing.

3) Filtering
- Filters (adult content, translations) should be applied server-side via API queries where possible to reduce bandwidth.
- Locale/translation handling: Use a preferred tag allow-list for supported languages. Fall back to keyword matching on titles/descriptions if tags are absent. Define a locale fallback order (e.g., `en-US` -> `en`).
- Document server-side gaps (e.g., missing tags/locales) and specify that the client must handle these fallbacks.
- All filter settings must be user-configurable and persisted locally. The UI must display active filters and provide controls to modify them.
- All filters must be applied before any deck shuffling or randomization.

4) Compatibility scoring
- The compatibility score is a heuristic (not a guarantee) for CP2077 v2.3.
- The `scoringVersion` must be written into the top-level file metadata alongside calibration data to ensure historical scores remain comparable across releases. This version string must be incremented and recorded with each algorithm change.
- Signals and weights (example):
	- Description mentions of "2.3" or newer (+30)
	- Recent update date (+20)
	- Comments confirming works on 2.3 (+20)
	- Author notes/changelog stating incompatible with 2.3 (–40)
	- Multiple comments reporting broken on 2.3 (–30)
	- Dependency on known-broken framework for 2.3 (–20)
- Persist the rationale (list of signals and their weights) alongside the score for each mod.
- Data sources: strictly API-only (no scraping); implement caching and handle API rate limits gracefully.
- Document and enforce cache policy and rate-limit handling.
- Manual override UX: allow user to up/down-rank or pin a mod; persist overrides and surface them separately from the heuristic score (e.g., “Score 62 • Pinned”). Do not mask known-incompatible signals when pinned.


5) Nexus Mods adapter
- Define `IModProvider` abstraction.
- Start with a mock provider (no network).
- NexusMods client requirements:
	- Store API key in Windows Credential Manager (do not store in JSON/appsettings).
	- Configure HTTP client with the following resilience defaults:
		- Overall timeout: 15s per request
		- Per-try timeout: 5s
		- Retries: 3 attempts, using jittered exponential backoff (base jitter 200–500ms, cap 5s), only for idempotent requests
		- Circuit breaker: open after 5 consecutive failures, remain open for 30s
		- Cache must honor Retry-After and use the backoff cap for retry delays
	- Set a custom User-Agent and honor 429/Retry-After/backoff headers.
	- Implement client-side caching using ETag/If-None-Match with cache validation.
	- Support an “offline mode” that serves from the cache.
	- Document and surface rate-limit and adult-content config points.
	- Telemetry/logging: log retries, backoff, and circuit-breaker events for diagnostics.
	- **Note:** These numeric defaults provide clear starting values for consumers and should be documented in the implementation.

6) Settings
- Game & Patch: Select game and target patch. Default: Cyberpunk 2077 @ patch 2.3
- Adult Content Filter: Toggle to include/exclude adult-flagged mods. Default: Off (safe mode)
- Content Filters: Configure and persist tag/keyword-based filters (e.g., exclude translations, specific tags). Default: No custom filters
- Cache Controls:
	- Max Cache Size: Set maximum local cache size for mod metadata/assets. Default: 100MB
	- Cache TTL: Set time-to-live for cached data before refresh. Default: 24 hours
- Offline Mode: Toggle to allow browsing only previously cached mods without network requests. Default: Off
- Export/Import Settings: UI to export current settings to a file and import from a file. All exported content must be sanitized by the "Redactor" utility. Default: none.
- Backup Retention: Configure how many automatic backups of settings/mod cache to keep and retention period. Default: keep 7 backups / 30 days.
- Diagnostics: Option to collect and export local diagnostic logs and configuration for support. All diagnostic bundles must be sanitized by the "Redactor" utility. Default: Off.
- **Redactor Utility:** Implement a shared, reusable "Redactor" module with a configurable denylist of sensitive patterns (secrets, keys, tokens, IDs). This utility must be used by the export and diagnostics features to automatically scrub secrets and PII from all outputs. Unit tests must verify redaction of example tokens and secrets.
- Telemetry: Opt-in toggle for anonymous usage analytics. Default: Off
- API Key Management: UI to add, remove, and view Nexus Mods API keys. Keys are stored locally and never transmitted except for API requests.

## Data & Ordering
- Source: Nexus Mods entries
- Randomize deck per session
- Track shown IDs to prevent repeats within session
- Optionally persist a small LRU cache of recently shown mods to reduce repeats across sessions.
    - Cache Key: Use `(modId, fileId)` to uniquely identify a mod version.
    - Configuration: Support a configurable max size (`N`, with a sensible default) and a TTL per entry.
    - Storage: Use a storage mechanism that avoids large-file rewrites (e.g., SQLite or an append-only/segment-based JSON file).
    - Eviction: Evict the least-recently-used entry when size > `N`. When checking/filtering, entries older than their TTL should be skipped.
- Deck loading must support streaming/pagination from the provider. The provider client should expose a paginated/streaming API so the deck builder can request successive pages and filter results against the LRU cache, respecting the `(modId, fileId)` key and TTL.

## Acceptance List
- Only accepted (right-swiped) mods are persisted
- Append-only behavior; no duplicates
- Reset button clears persisted file

## Compatibility Heuristics (v2.3)
- Positive signals: mentions of "2.3" or newer in description/changelog; recent updates; comments confirming works on 2.3
- Negative signals: author notes/changelog stating incompatible with 2.3; multiple comments reporting broken on 2.3; dependency on known-broken framework for 2.3
- Score bands (example): 0–100 with qualitative labels (Low/Medium/High)
- Hover tooltip: 1–2 sentences explaining why; include extra notable info only when helpful
- Bands: Low (0–39), Medium (40–69), High (70–100); subject to calibration
- Add periodic sampling to verify accuracy after game/API updates

## UI Notes
- Large left/right buttons; keyboard shortcuts (← reject, → accept)
- Minimalist card: mod title, author, thumbnail, short excerpt, tags, score badge with hover explanation
- Small settings icon for game/patch
- Subtle reset tucked away in settings
- **Accessibility & Resilience Requirements:**
    - **Focus Management:** Define a logical keyboard focus order with visible focus styles. Ensure focus is moved to meaningful elements after actions and that tab order follows a logical sequence.
    - **Screen Reader Support:** Provide screen-reader labels/roles (e.g., `aria-label`) for all interactive elements. Use `aria-live` regions to announce accept/reject actions, score explanations, and error/backoff states.
    - **Resilience UI States:** For rate-limit/backoff, disable action buttons and show an accessible countdown with a human-readable retry message and a manual retry button. Use clear `aria-live` announcements for state changes.
    - **Automated Testing:** Mandate automated accessibility tests to validate keyboard navigation, screen-reader announcements, and focus management.

## File/Module Sketch
- App: WinUI 3 (Packaged)
- ViewModels: DeckViewModel, SettingsViewModel, AcceptedListViewModel
- Models: Mod, ModTag, ScoreInfo
- Services: IModProvider, PersistenceService, ScoringService, FilteringService, ShuffleService, ICredentialStore, ICacheProvider, ISettingsStore, IHttpClientFactory, IClock, IFileSystem, and a ResiliencePolicy provider (e.g., Polly-based). These interfaces allow for pluggable and configurable implementations (platform-specific or mocks). `IHttpClientFactory` enables per-policy handlers and testable clients, `IClock` provides controllable time for seeds/TTLs/tests, and `IFileSystem` facilitates mocking for atomic writes. The ResiliencePolicy should be configurable for network and IO services.

## Next Actions (Stage 1)
- Scaffold WinUI 3 project
- Implement models and mock provider
- Implement swipe UI (buttons + key handling)
- Shuffle and no-repeat logic for session
- Wire up mock data into the deck
- **Unit Tests & CI:**
    - Create unit tests under `tests/unit`:
        - **Shuffle Determinism:** Seed the shuffle RNG with a fixed value and assert that the same input list produces the same shuffled order every time.
        - **Persistence Round-trip:** Write mock session state (e.g., accepted mods list) using the persistence service, read it back, and assert that the returned data is identical. Use a mocked file/DB for this test.
    - Add a Windows CI workflow (`.github/workflows/ci-windows.yml`) that runs all unit tests and any configured linting on every push and pull request to the main branch.