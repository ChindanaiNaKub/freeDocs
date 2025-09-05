# FreeDocs - Google Docs Copy Tool

A simple web app that helps you copy content from Google Docs that may have copy restrictions.

## What it does

- Takes a Google Docs URL and creates an archive snapshot
- Parses the content to make it copyable
- Provides a web interface to view and copy the text
- Basic code block detection (still buggy)

## Current Status

⚠️ **Work in Progress** - This project is still in development and has several known issues:

- Code block parsing is unreliable
- Diff detection doesn't work properly in all cases
- UI needs improvement
- Error handling is incomplete

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

## Testing

```bash
npm test
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
