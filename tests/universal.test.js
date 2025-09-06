const request = require('supertest');
jest.mock('../src/utils/archiveClient', () => {
  return {
    getArchiveSnapshot: jest.fn(async (url) => ({ url: 'https://cached.example/doc.html', service: 'mock', cached: false })),
    getArchivedContent: jest.fn(async () => '<html><body><p style="font-size:28pt;font-weight:bold">Title</p><p>Line 1</p><p>• A</p><p>• B</p></body></html>'),
    getCachedContent: jest.fn(() => null)
  };
});
const app = require('../src/server');

describe('Universal Adaptive Parser API', () => {
  const validUrl = 'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit';

  describe('GET /api/universal', () => {
    test('should return 400 for missing URL', async () => {
      const res = await request(app).get('/api/universal').expect(400);
      expect(res.body.error).toBe('URL parameter is required');
    });

    test('should return 422 for invalid URL', async () => {
      const res = await request(app).get('/api/universal?url=https://example.com').expect(422);
      expect(res.body.error).toBe('Invalid Google Docs URL');
    });

    test('should return AST for valid URL', async () => {
      const res = await request(app).get(`/api/universal?url=${encodeURIComponent(validUrl)}`).expect(200);
      const { ast } = res.body;
      expect(ast).toBeDefined();
      expect(Array.isArray(ast.sections)).toBe(true);
      expect(ast.sections.length).toBeGreaterThan(0);
      expect(ast.sections[0].blocks.length).toBeGreaterThan(0);
    });

    test('should include diagnostics when debug flag is true', async () => {
      const res = await request(app).get(`/api/universal?url=${encodeURIComponent(validUrl)}&debug=true`).expect(200);
      expect(res.body.ast.diagnostics).toBeDefined();
      expect(res.body.ast.diagnostics.adapter).toBeDefined();
      expect(res.body.ast.schemaVersion).toBe(1);
    });
  });
});
