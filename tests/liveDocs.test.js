const fs = require('fs');
const path = require('path');
const { validateGoogleDocsUrl, extractDocId } = require('../src/utils/urlValidator');
const { getArchiveSnapshot, getArchivedContent, getCachedContent } = require('../src/utils/archiveClient');
const { parseArchivedContent } = require('../src/utils/contentParser');
const { parseUniversal } = require('../src/utils/formatParser');

// Run only when explicitly requested to avoid flaky CI/network reliance
if (!process.env.LIVE_DOC_TEST) {
  describe('Live Docs (skipped)', () => {
    test.skip('set LIVE_DOC_TEST=1 to enable live document format coverage test', () => {});
  });
} else {
  describe('Live Docs Format Coverage', () => {
    jest.setTimeout(90000);

    test('parses all docs in sample/list.txt with both parsers', async () => {
      const listPath = path.join(__dirname, '../sample/list.txt');
      const raw = fs.readFileSync(listPath, 'utf8');
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      const entries = []; // { label, url, docId }
      for (const line of lines) {
        const parts = line.split(/\s+-\s+/);
        if (parts.length === 2) {
          const label = parts[0];
            let url = parts[1];
            // Strip any trailing params after /edit
            url = url.replace(/\?[^#]+$/, '');
          if (validateGoogleDocsUrl(url)) {
            const docId = extractDocId(url);
            if (docId && !entries.find(e => e.docId === docId)) {
              entries.push({ label, url, docId });
            }
          }
        }
      }

      const results = [];
      for (const entry of entries) {
        const mobileUrl = `https://docs.google.com/document/d/${entry.docId}/mobilebasic`;
        let archiveUrl, legacyOk = false, universalOk = false, legacyBlocks = 0, universalSections = 0, error;
        try {
          const snapshot = await getArchiveSnapshot(mobileUrl);
          archiveUrl = snapshot.url;
          let html = getCachedContent(archiveUrl);
          if (!html) html = await getArchivedContent(archiveUrl);
          if (html) {
            // Legacy parser
            try {
              const legacy = await parseArchivedContent(archiveUrl, { autoDetectCode: true, showDeletions: true, extractImages: false });
              legacyOk = Array.isArray(legacy.blocks) && legacy.blocks.length > 0;
              legacyBlocks = legacy.blocks ? legacy.blocks.length : 0;
            } catch (e) {
              // swallow per-doc legacy failure
            }
            // Universal parser
            try {
              const ast = parseUniversal(html, { debug: true });
              universalOk = Array.isArray(ast.sections) && ast.sections.length > 0;
              universalSections = ast.sections ? ast.sections.length : 0;
            } catch (e) {
              // swallow per-doc universal failure
            }
          }
        } catch (e) {
          error = e.message;
        }
        results.push({ label: entry.label, docId: entry.docId, archiveUrl, legacyOk, universalOk, legacyBlocks, universalSections, error });
      }

      // Log a concise summary for developer visibility
      console.table(results.map(r => ({
        Lab: r.label,
        Doc: r.docId.slice(0, 8),
        Legacy: r.legacyOk ? `OK (${r.legacyBlocks})` : 'FAIL',
        Universal: r.universalOk ? `OK (${r.universalSections})` : 'FAIL',
        Error: r.error ? r.error.slice(0, 60) : ''
      })));

      // Assert all documents at least pass universal parser; allow legacy fallback failures (we want forward migration)
      const universalFailures = results.filter(r => !r.universalOk);
      expect(universalFailures).toEqual([]);
    });
  });
}
