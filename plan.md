### TODO Implementation Checklist — Diff‑Aware Assignment Viewer

#### Preparation
- [ ] Validate input URL patterns and extract `docId` safely
- [ ] Enforce SSRF-safe allowlist for Google Docs hosts
- [ ] Pick client stack for viewer (vanilla/React/Svelte)
- [ ] Define parsing heuristics for `+`/`-` lines (code vs prose)

#### M1 — URL Normalization & Archive Snapshot
- [ ] Implement GET `/api/render?url=<...>` returning `{ html, archiveUrl }`
- [ ] Normalize to `mobilebasic` using extracted `docId`
- [ ] Submit to archive.ph and obtain snapshot URL or reuse existing
- [ ] Return 400/422 for invalid/non-Google-Docs URLs; 502 on archive errors
- [ ] Unit tests for normalization

Acceptance checks (M1)
- [ ] Input `/edit?...` normalizes to `/mobilebasic`
- [ ] Archive URL is produced and HTML returns successfully

#### M2 — Diff‑Aware Parsing
- [ ] Fetch archived HTML and extract content blocks
- [ ] Detect code/pre blocks and code-like paragraphs
- [ ] Classify each line as `added` (leading `+`), `removed` (leading `-`), or `unchanged`
- [ ] Produce cleaned text per line (without marker) and keep original
- [ ] API `/api/parse?url=<...>` returns `{ archiveUrl, blocks }`
- [ ] Unit tests for parsing and classification (edge cases: prose with leading `+`/`-`)

Acceptance checks (M2)
- [ ] Parsing returns expected per-line `{ text, op }` for sample inputs
- [ ] False positives can be toggled off (treat as normal text)

#### M3 — Code Viewer UI & Copy UX
- [ ] Render blocks with addition/deletion styling (green/red + strikethrough)
- [ ] Toggle show/hide deleted lines
- [ ] Copy buttons: Copy Clean (no markers), Copy Additions Only
- [ ] Keyboard shortcuts for copy actions
- [ ] Graceful handling on mobile

Acceptance checks (M3)
- [ ] Copy Clean copies lines without leading markers
- [ ] Copy Additions Only copies only `+` lines without the `+`
- [ ] Deleted lines are hidden when toggle is off and shown with red strikethrough when on

#### M4 — Hardening & Observability
- [ ] Structured logging and error messages
- [ ] Rate limiting and retry with backoff for archive.ph
- [ ] Lightweight caching of `{ url → archiveUrl }` and parsed blocks
- [ ] Clear legal disclaimer and privacy notice

Acceptance checks (M4)
- [ ] End-to-end: paste URL → render → copy works and honors toggles
- [ ] Error scenarios return helpful guidance (invalid URL, auth-required, rate limit)

#### Cross-Cutting & Ops
- [ ] Optional background worker for long archive submissions
- [ ] Configuration for rate limits, timeouts, and user agent
- [ ] Caching TTL policy and cleanup

#### Edge Cases
- [ ] Auth-required even on `mobilebasic` → fail with clear message
- [ ] Very large documents → chunked parse or streaming conversion
- [ ] Prose lines with leading `+`/`-` → allow “treat as text” toggle

#### Definition of Done
- [ ] PRD Acceptance Criteria satisfied:
  - [ ] Normalize to `/mobilebasic` and obtain archive URL
  - [ ] Render diff-aware view; Copy Clean and Copy Additions work
  - [ ] Deleted lines handled per toggle and excluded from clean copies
- [ ] Links referenced for validation:
  - [ ] Original: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0`
  - [ ] MobileBasic: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic`
  - [ ] Archive: `https://archive.ph/BnjvV`


