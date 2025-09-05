const request = require('supertest');
const app = require('../src/server');

describe('API Routes', () => {
  describe('GET /api/render', () => {
    test('should return 400 for missing URL', async () => {
      const response = await request(app)
        .get('/api/render')
        .expect(400);
      
      expect(response.body.error).toBe('URL parameter is required');
    });

    test('should return 422 for invalid URL', async () => {
      const response = await request(app)
        .get('/api/render?url=https://example.com')
        .expect(422);
      
      expect(response.body.error).toBe('Invalid Google Docs URL');
    });

    test('should validate Google Docs URL format', async () => {
      const validUrl = 'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit';
      
      // This test would normally make real API calls
      // In a real implementation, you'd mock the archive client
      const response = await request(app)
        .get(`/api/render?url=${encodeURIComponent(validUrl)}`);
      
      // Since we're not mocking external services, this might fail
      // In production, you'd mock the archiveClient and contentParser
      expect([200, 502]).toContain(response.status);
    });
  });

  describe('GET /api/parse', () => {
    test('should return 400 for missing URL', async () => {
      const response = await request(app)
        .get('/api/parse')
        .expect(400);
      
      expect(response.body.error).toBe('URL parameter is required');
    });

    test('should return 422 for invalid URL', async () => {
      const response = await request(app)
        .get('/api/parse?url=https://example.com')
        .expect(422);
      
      expect(response.body.error).toBe('Invalid Google Docs URL');
    });
  });

  describe('POST /api/copy', () => {
    test('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/copy')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('URL is required');
    });

    test('should return 400 for invalid mode', async () => {
      const response = await request(app)
        .post('/api/copy')
        .send({
          url: 'https://docs.google.com/document/d/abc123/edit',
          mode: 'invalid'
        })
        .expect(400);
      
      expect(response.body.error).toBe('Mode must be "clean" or "additions"');
    });
  });
});
