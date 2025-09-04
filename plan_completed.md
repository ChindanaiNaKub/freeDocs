### TODO Implementation Checklist — Diff‑Aware Assignment Viewer

#### Preparation
- [x] Validate input URL patterns and extract `docId` safely
- [x] Enforce SSRF-safe allowlist for Google Docs hosts
- [x] Pick client stack for viewer (vanilla/React/Svelte) - **Chose vanilla JS**
- [x] Define parsing heuristics for `+`/`-` lines (code vs prose)

#### M1 — URL Normalization & Archive Snapshot
- [x] Implement GET `/api/render?url=<...>` returning `{ html, archiveUrl }`
- [x] Normalize to `mobilebasic` using extracted `docId`
- [x] Submit to archive.ph and obtain snapshot URL or reuse existing
- [x] Return 400/422 for invalid/non-Google-Docs URLs; 502 on archive errors
- [x] Unit tests for normalization

Acceptance checks (M1)
- [x] Input `/edit?...` normalizes to `/mobilebasic`
- [x] Archive URL is produced and HTML returns successfully

#### M2 — Diff‑Aware Parsing
- [x] Fetch archived HTML and extract content blocks
- [x] Detect code/pre blocks and code-like paragraphs
- [x] Classify each line as `added` (leading `+`), `removed` (leading `-`), or `unchanged`
- [x] Produce cleaned text per line (without marker) and keep original
- [x] API `/api/parse?url=<...>` returns `{ archiveUrl, blocks }`
- [x] Unit tests for parsing and classification (edge cases: prose with leading `+`/`-`)

Acceptance checks (M2)
- [x] Parsing returns expected per-line `{ text, op }` for sample inputs
- [x] False positives can be toggled off (treat as normal text)

#### M3 — Code Viewer UI & Copy UX
- [x] Render blocks with addition/deletion styling (green/red + strikethrough)
- [x] Toggle show/hide deleted lines
- [x] Copy buttons: Copy Clean (no markers), Copy Additions Only
- [x] Keyboard shortcuts for copy actions
- [x] Graceful handling on mobile

Acceptance checks (M3)
- [x] Copy Clean copies lines without leading markers
- [x] Copy Additions Only copies only `+` lines without the `+`
- [x] Deleted lines are hidden when toggle is off and shown with red strikethrough when on

#### M4 — Hardening & Observability
- [x] Structured logging and error messages
- [x] Rate limiting and retry with backoff for archive.ph
- [x] Lightweight caching of `{ url → archiveUrl }` and parsed blocks
- [x] Clear legal disclaimer and privacy notice

Acceptance checks (M4)
- [x] End-to-end: paste URL → render → copy works and honors toggles
- [x] Error scenarios return helpful guidance (invalid URL, auth-required, rate limit)

#### Cross-Cutting & Ops
- [ ] Optional background worker for long archive submissions
- [x] Configuration for rate limits, timeouts, and user agent
- [ ] Caching TTL policy and cleanup

#### Edge Cases
- [x] Auth-required even on `mobilebasic` → fail with clear message
- [ ] Very large documents → chunked parse or streaming conversion
- [x] Prose lines with leading `+`/`-` → allow "treat as text" toggle

#### Definition of Done
- [x] PRD Acceptance Criteria satisfied:
  - [x] Normalize to `/mobilebasic` and obtain archive URL
  - [x] Render diff-aware view; Copy Clean and Copy Additions work
  - [x] Deleted lines handled per toggle and excluded from clean copies
- [x] Links referenced for validation:
  - [x] Original: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0`
  - [x] MobileBasic: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic`
  - [x] Archive: `https://archive.ph/BnjvV`
