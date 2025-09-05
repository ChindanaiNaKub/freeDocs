const {
  validateGoogleDocsUrl,
  extractDocId,
  normalizeTomobileBasic,
  isSafeUrl
} = require('../src/utils/urlValidator');

describe('URL Validator', () => {
  describe('validateGoogleDocsUrl', () => {
    test('should validate valid Google Docs URLs', () => {
      const validUrls = [
        'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0',
        'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/view',
        'https://docs.google.com/document/d/abc123/mobilebasic',
        'https://drive.google.com/file/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/view'
      ];

      validUrls.forEach(url => {
        expect(validateGoogleDocsUrl(url)).toBe(true);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        null,
        undefined,
        'not-a-url',
        'https://example.com/document',
        'https://docs.google.com/spreadsheets/d/abc123/edit',
        'https://malicious-site.com/docs.google.com/document/d/abc123'
      ];

      invalidUrls.forEach(url => {
        expect(validateGoogleDocsUrl(url)).toBe(false);
      });
    });
  });

  describe('extractDocId', () => {
    test('should extract document ID from valid URLs', () => {
      const testCases = [
        {
          url: 'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0',
          expected: '1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-'
        },
        {
          url: 'https://docs.google.com/document/d/abc123/view',
          expected: 'abc123'
        },
        {
          url: 'https://drive.google.com/file/d/xyz789/view',
          expected: 'xyz789'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractDocId(url)).toBe(expected);
      });
    });

    test('should return null for invalid URLs', () => {
      const invalidUrls = [
        '',
        null,
        'https://example.com',
        'https://docs.google.com/spreadsheets/d/abc123'
      ];

      invalidUrls.forEach(url => {
        expect(extractDocId(url)).toBeNull();
      });
    });
  });

  describe('normalizeTomobileBasic', () => {
    test('should normalize to mobilebasic format', () => {
      const testCases = [
        {
          input: 'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/edit?tab=t.0',
          expected: 'https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic'
        },
        {
          input: 'https://docs.google.com/document/d/abc123/view',
          expected: 'https://docs.google.com/document/d/abc123/mobilebasic'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizeTomobileBasic(input)).toBe(expected);
      });
    });
  });

  describe('isSafeUrl', () => {
    test('should allow safe Google domains', () => {
      const safeUrls = [
        'https://docs.google.com/document/d/abc123/edit',
        'https://drive.google.com/file/d/xyz789/view'
      ];

      safeUrls.forEach(url => {
        expect(isSafeUrl(url)).toBe(true);
      });
    });

    test('should reject unsafe domains', () => {
      const unsafeUrls = [
        'https://malicious-site.com',
        'https://evil.docs.google.com',
        'http://docs.google.com', // non-HTTPS
        'https://subdomain.docs.google.com'
      ];

      unsafeUrls.forEach(url => {
        expect(isSafeUrl(url)).toBe(false);
      });
    });
  });
});
