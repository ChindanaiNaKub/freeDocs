const { parseUniversal } = require('../src/utils/formatParser');

describe('Adaptive parser adapters', () => {
  test('googleBasic detection & structure', () => {
    const sample = `<!doctype html><html><head><meta content="Google Docs" /></head><body><p style="font-size:28pt;font-weight:bold">Title Here</p><p>First paragraph.</p><p>• Bullet one</p><p>• Bullet two</p></body></html>`;
    const result = parseUniversal(sample, { debug: true });
    expect(result.diagnostics.adapter).toBe('googleBasic');
    const titleSection = result.sections.find(s => s.heading && /Title Here/.test(s.heading.text));
    expect(titleSection).toBeTruthy();
    const listBlock = titleSection.blocks.find(b => b.type === 'list');
    expect(listBlock).toBeTruthy();
    expect(listBlock.items.length).toBe(2);
  });

  test('fallbackPlain for low-confidence HTML', () => {
    const sample = `<html><body>Just plain text line one\n\nSECOND LINE</body></html>`;
    const result = parseUniversal(sample, { debug: true });
    expect(result.sections.length).toBeGreaterThan(0);
  });
});
