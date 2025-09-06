# FreeDocs - Google Docs Copy Tool

A simple web app that helps you copy content from Google Docs that may have copy restrictions.

## What it does

- Takes a Google Docs URL and creates an archive snapshot
- Parses the content to make it copyable
- Provides a web interface to view and copy the text
- Basic code block detection (still buggy)

## Current Status

⚠️ **Work in Progress** – now includes an adaptive parser layer.

### Recent Improvements
- Adaptive multi-adapter parsing (`googleBasic`, `googleCopyPaste`, `docxHtml`, fallback) for more resilient Google Docs ingestion.
- New endpoint: `GET /api/universal?url=...&debug=true` returns a normalized AST with optional diagnostics.
- Server start guard for cleaner tests.

### Still Rough Edges
- Code block grouping occasionally over-merges.
- Diff highlighting: deletion filtering not configurable on universal endpoint yet.
- Some DOCX exports (tables, images) minimally normalized.
- Open handle warnings in Jest due to long-lived timers (non-fatal; pending cleanup).

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000

4. Paste a Google Docs URL and hit enter

## How to use

1. Copy a Google Docs URL (like `https://docs.google.com/document/d/your-doc-id/edit`)
2. Paste it into the input field
3. The app will try to create an archive version you can copy from
4. View the content and use the copy buttons (when they work!)

## Known Issues

- Code blocks don't always parse correctly
- Some Google Docs formats aren't supported
- Copy functionality can be inconsistent
- No proper error messages yet

## Future Features

### Download Options
- **Markdown Export**: Download parsed content as .md files with proper formatting
- **PDF Export**: Generate and download PDF versions of the documents
- **Multiple Format Support**: Support for various export formats (HTML, TXT, etc.)

### Enhanced Functionality
- Better code block detection and syntax highlighting
- Improved formatting preservation from original Google Docs
- Batch processing for multiple documents
- Document comparison and diff visualization
- Custom styling options for exports
- Universal AST to Markdown / PDF exporters
- Adapter-specific diagnostics dashboard (to see which heuristics fired)

## Testing

```bash
npm test
```

Run only universal parser tests:

```bash
npm test -- universal.test.js
```

Add `--detectOpenHandles` while debugging leaks:

```bash
npm test -- --detectOpenHandles
```

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Libraries**: Cheerio for HTML parsing, Axios for HTTP requests

## Contributing

This is a work-in-progress project. Feel free to:
- Report bugs you find
- Suggest improvements
- Submit pull requests

## License

MIT
