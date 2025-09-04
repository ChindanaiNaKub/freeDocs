### Product Requirements Document (PRD): Assignment Diff‑Friendly Google Docs Viewer via archive.ph

#### 1. Overview
Build a lightweight web app for assignments that renders copyable snapshots of “protected” Google Docs and provides a code-focused viewer that understands diff markers. Lines starting with `+` (addition) are shown as added code, lines starting with `-` (deletion) are shown as removed code, and the copy actions produce cleaned code without the leading `+`/`-` markers.

We rely on `mobilebasic` and archive.ph to obtain a stable, selectable HTML snapshot, then parse and re-render the content in our site with a customizable, copy-friendly UI.

References to provided example:
- Original (protected) link: [`https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0`](https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0)
- MobileBasic link: [`https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic`](https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic)
- Archived snapshot (copyable): [`https://archive.ph/BnjvV`](https://archive.ph/BnjvV)

#### 2. Goals and Non-Goals
- Goals
  - Accept a Google Docs URL and render a copyable, archive-backed view inside our website.
  - Detect diff-like code lines with leading `+` or `-` and render them as additions/deletions (added = green; deleted = red, strikethrough, optionally hidden).
  - Provide per-block Copy buttons that copy “clean code” (without `+`/`-` markers) to the clipboard.
  - Offer toggles: show/hide deleted lines; copy only additions; copy everything cleaned.
  - Keep the UI focused on assignment readability and quick code copying.
- Non-Goals
  - Bypassing authentication for non-public content. Source must be publicly reachable (e.g., via `mobilebasic`).
  - Perfect layout fidelity for complex elements (tables/images are best-effort). The priority is code/text clarity and copy UX.

#### 3. Primary Users and User Stories
- Students receiving assignments where code is embedded with `+`/`-` markers.
- Instructors/TAs sharing assignment specs with diff-style examples.

User stories:
- As a student, I can paste a Google Docs URL and see a rendered, copyable view on our site.
- As a student, I can copy code without the `+`/`-` markers using a single Copy button.
- As a student, I can optionally view deleted lines (marked red/strikethrough) or hide them for clarity.

#### 4. Key Assumptions and Observations
- The `mobilebasic` endpoint renders simplified, mostly static HTML that is easy to parse and copy.
- archive.ph reliably snapshots the `mobilebasic` page into a static, accessible copy.
- Direct Google export endpoints (e.g., `export?format=docx`) may require permissions; therefore we reconstruct DOCX from HTML.
- The provided sample is visible in `mobilebasic` and archived at `archive.ph`, confirming feasibility for public documents.

#### 5. Functional Requirements
1) URL Intake and Normalization
   - Input: Any Google Docs URL form, including `/edit?...` or `/view`.
   - Normalize to canonical ID: extract `<docId>` and form `https://docs.google.com/document/d/<docId>/mobilebasic`.

2) Snapshot via archive.ph
   - Submit the `mobilebasic` URL to archive.ph for snapshot creation (prefer `?run=1&url=<encoded>`; fallback POST to `/submit/`).
   - Parse redirect/response to obtain the final archive URL (e.g., `https://archive.ph/<token>`).
   - If fresh snapshot fails, discover existing snapshots for the same URL.

3) Archived Content Retrieval and Diff‑Aware Parsing
   - Fetch archived HTML (static).
   - Parse headings, paragraphs, lists, links, and especially code/pre blocks.
   - In code blocks and indented code-like paragraphs, detect line prefixes:
     - `+` → added line (store as op="added").
     - `-` → removed line (op="removed").
     - otherwise → unchanged (op="unchanged").
   - Preserve original ordering and whitespace; store a cleaned version of each line without the leading marker for copy purposes.

4) Rendering and UI
   - Render code with syntax-neutral styling; additions in green; deletions in red with strikethrough.
   - Provide toggles: show/hide deleted lines; show raw with markers vs cleaned view.
   - Provide Copy buttons:
     - Copy Clean (entire block without markers)
     - Copy Additions Only (only lines marked `+` without the `+`)

5) Error Handling
   - If `mobilebasic` is not reachable or archive.ph submission fails, return actionable errors and suggested next steps.
   - If parsing fails, still provide the archive URL if available and surface a clear message.

#### 6. Non-Functional Requirements
- Performance: First-time archive may take 5–60 seconds; conversions should complete within 2 minutes for typical documents (<200 pages).
- Reliability: Retries on transient network failures; idempotent operations by docId.
- Scalability: Queue-based processing; workers horizontally scalable.
- Privacy/Compliance: Only process publicly accessible content. Provide clear notice to users about terms of use and responsibility.
- Observability: Structured logs, job metrics, error rates, and alerting.

#### 7. System Architecture (High-Level)
- Client (Web): URL submission, status polling, artifact download.
- Backend API: Normalizes URL, submits to archive.ph, fetches archived HTML, parses diff-aware code structure, and returns sanitized content/JSON for rendering.
- Worker/Server: Handles archive submission and caching; performs parsing.
- Storage/Cache: Store parsed results and snapshot mappings for speed; DB optional for caching and rate limits.
- Queue (optional): For long archive submissions and retries.

Sequence (happy path):
1) User submits Google Docs URL.
2) API extracts `docId`, builds `mobilebasic` URL.
3) Worker submits to archive.ph and obtains archive URL.
4) Worker fetches archived HTML, parses structure.
5) Worker converts to DOCX and stores artifact.
6) Status updates to `done` with `archiveUrl` and `downloadUrl`.

#### 8. API Specification (Detailed)
- GET `/api/render?url=<googleDocsUrl>`
  - Normalizes to `mobilebasic`, ensures/sources an archive.ph snapshot, fetches and parses HTML, returns sanitized HTML for client rendering with diff-aware annotations.
  - 200: `{ html: string, archiveUrl: string }`
  - 400: invalid URL; 422: non-Google-Docs; 502: archive fetch error.

- GET `/api/parse?url=<googleDocsUrl>`
  - Returns a structured JSON representation of blocks, including code blocks with per-line `{ text, op }` where `op ∈ { added, removed, unchanged }` and `text` is the cleaned line without markers.
  - 200: `{ archiveUrl: string, blocks: Array<Block> }`

- POST `/api/copy` (optional server-assisted copy)
  - Body: `{ url: string, mode: 'clean'|'additions' }`
  - Returns: `{ text: string }` for clipboard use.

#### 9. Data Model
- CacheEntry (optional)
  - `docId`: string
  - `mobileBasicUrl`: string
  - `archiveUrl`: string
  - `parsedAt`: timestamp
  - `blocksHash`: string (for change detection)

#### 10. Edge Cases and Fallbacks
- Document requires authentication even in `mobilebasic`: surface clear error; cannot proceed.
- archive.ph rate limiting or denial: retry with backoff; if an existing snapshot exists, reuse.
- Very large documents: chunked parsing; streaming conversion where feasible.
- Images blocked: keep links/placeholders.
- Lines that start with `+`/`-` but are not code (false positives): allow user toggle to treat as normal text.

#### 11. Security and Legal
- Process only URLs that users supply and are publicly accessible.
- Display a disclaimer about respecting copyrights and site terms.
- Validate inputs, sanitize network requests, and avoid SSRF by whitelisting Google Docs host patterns.

#### 12. Acceptance Criteria
- Given input URL [`/edit?...`](https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0), the system:
  - Produces the `mobilebasic` URL and obtains/uses an archive.ph snapshot (e.g., [`https://archive.ph/BnjvV`](https://archive.ph/BnjvV)).
  - Renders the archived content inside our site with a code viewer that highlights additions (`+`) and deletions (`-`).
  - Provides a Copy button that copies cleaned code without the leading `+`/`-` markers.
  - When deletions exist, they are visible as red strikethrough when shown, and excluded from “Copy Clean”.
  - Clear errors are shown on failure paths.

#### 13. Milestones
- M1: URL normalization + archive submission + basic render of archived HTML in our site.
- M2: Diff‑aware parser (identify `+`/`-` lines) with unit tests.
- M3: Code viewer UI with show/hide deletions and Copy buttons (clean/all/additions).
- M4: Metrics, caching, error hardening, and UI polish.

#### 14. Open Questions
- Heuristics for distinguishing true code diffs from regular prose starting with `+`/`-`?
- Preferred client stack for the viewer (vanilla, React, or Svelte)?
- Caching strategy and TTL for archived pages and parsed blocks?


