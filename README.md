# FreeDocs - Diff-Aware Assignment Viewer

A lightweight web application that renders copyable snapshots of "protected" Google Docs with diff-aware code highlighting.

## Features

- ✅ **URL Normalization & Archive Snapshot (M1)**
  - Accepts Google Docs URLs and normalizes to `mobilebasic` format
  - Creates Internet Archive snapshots for static, copyable content
  - Error handling for invalid URLs and archive failures

- ✅ **Diff-Aware Parsing (M2)**
  - Detects code blocks and code-like paragraphs
  - Classifies lines with `+` (added), `-` (removed), or unchanged
  - Preserves indentation when cleaning diff markers
  - Language detection for syntax highlighting

- ✅ **Code Viewer UI & Copy UX (M3)**
  - Clean, responsive interface with code highlighting
  - Copy buttons for "Clean" (no markers) and "Additions Only"
  - Toggle to show/hide deleted lines
  - Keyboard-friendly copy functionality

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open http://localhost:3000 in your browser

3. Paste a Google Docs URL (e.g., the assignment example)

4. The app will:
   - Create an Internet Archive snapshot
   - Parse the content for diff markers
   - Display with syntax highlighting
   - Provide copy buttons for clean code

## API Endpoints

- `GET /api/render?url=<googleDocsUrl>` - Returns rendered HTML
- `GET /api/parse?url=<googleDocsUrl>` - Returns structured JSON blocks
- `POST /api/copy` - Server-assisted copy functionality

## Example URLs

- Original: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0`
- MobileBasic: `https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic`
- Archive: `https://archive.ph/BnjvV`

## Testing

Run unit tests:
```bash
npm test
```

Run specific test suites:
```bash
npm test -- --testPathIgnorePatterns=api.test.js  # Skip integration tests
```

## Dependencies

- **Express** - Web framework
- **Axios** - HTTP client for Internet Archive
- **Cheerio** - HTML parsing
- **Helmet** - Security middleware
- **Rate-limiter-flexible** - Rate limiting

## Architecture

- **Frontend**: Vanilla JavaScript with responsive CSS
- **Backend**: Node.js/Express API
- **Parsing**: Cheerio-based HTML parsing with diff detection
- **Archive**: Internet Archive integration for static snapshots

## Security

- SSRF protection with domain allowlisting
- Input validation and sanitization
- Rate limiting to prevent abuse
- HTTPS-only URL validation
