const {
  parseCodeContent,
  isCodeLikeParagraph,
  detectLanguage
} = require('../src/utils/contentParser');

describe('Content Parser', () => {
  describe('parseCodeContent', () => {
    test('should detect diff markers correctly', () => {
      const codeWithDiff = `function example() {
+ const newVariable = 'added';
- const oldVariable = 'removed';
  const unchanged = 'unchanged';
+ return newVariable;
- return oldVariable;
}`;

      const result = parseCodeContent(codeWithDiff, 'code');
      
      expect(result.type).toBe('code');
      expect(result.hasChanges).toBe(true);
      expect(result.lines).toHaveLength(7);
      
      // Check specific lines
      expect(result.lines[0].op).toBe('unchanged');
      expect(result.lines[0].text).toBe('function example() {');
      
      expect(result.lines[1].op).toBe('added');
      expect(result.lines[1].text).toBe('const newVariable = \'added\';');
      
      expect(result.lines[2].op).toBe('removed');
      expect(result.lines[2].text).toBe('const oldVariable = \'removed\';');
      
      expect(result.lines[3].op).toBe('unchanged');
      expect(result.lines[3].text).toBe('  const unchanged = \'unchanged\';');
    });

    test('should handle code without diff markers', () => {
      const normalCode = `function example() {
  console.log('Hello, world!');
  return true;
}`;

      const result = parseCodeContent(normalCode, 'code');
      
      expect(result.type).toBe('code');
      expect(result.hasChanges).toBe(false);
      expect(result.lines.every(line => line.op === 'unchanged')).toBe(true);
    });

    test('should preserve indentation when removing markers', () => {
      const indentedCode = `    if (condition) {
+     console.log('added');
-     console.log('removed');
    }`;

      const result = parseCodeContent(indentedCode, 'code');
      
      expect(result.lines[1].text).toBe('    console.log(\'added\');');
      expect(result.lines[2].text).toBe('    console.log(\'removed\');');
    });
  });

  describe('detectLanguage', () => {
    test('should detect JavaScript', () => {
      const jsCode = `function test() {
  const x = 5;
  return x;
}`;
      expect(detectLanguage(jsCode)).toBe('javascript');
    });

    test('should detect Python', () => {
      const pythonCode = `def test():
    x = 5
    return x`;
      expect(detectLanguage(pythonCode)).toBe('python');
    });

    test('should detect Java', () => {
      const javaCode = `public class Test {
    private int value;
    public int getValue() {
        return value;
    }
}`;
      expect(detectLanguage(javaCode)).toBe('java');
    });

    test('should detect HTML', () => {
      const htmlCode = `<div class="container">
    <p>Hello world</p>
</div>`;
      expect(detectLanguage(htmlCode)).toBe('html');
    });

    test('should detect CSS', () => {
      const cssCode = `.container {
    padding: 1rem;
    margin: 0 auto;
}`;
      expect(detectLanguage(cssCode)).toBe('css');
    });

    test('should default to text for unknown patterns', () => {
      const unknownCode = `This is just plain text
with no specific patterns`;
      expect(detectLanguage(unknownCode)).toBe('text');
    });
  });

  describe('isCodeLikeParagraph', () => {
    test('should detect diff markers as code-like', () => {
      const mockElement = {
        css: () => '',
        hasClass: () => false,
        find: () => ({ length: 0 })
      };

      expect(isCodeLikeParagraph(mockElement, '+ added line')).toBe(true);
      expect(isCodeLikeParagraph(mockElement, '- removed line')).toBe(true);
      expect(isCodeLikeParagraph(mockElement, '+added without space')).toBe(true);
      expect(isCodeLikeParagraph(mockElement, '-removed without space')).toBe(true);
    });

    test('should detect indented text as code-like', () => {
      const mockElement = {
        css: () => '',
        hasClass: () => false,
        find: () => ({ length: 0 })
      };

      expect(isCodeLikeParagraph(mockElement, '    indented with spaces')).toBe(true);
      expect(isCodeLikeParagraph(mockElement, '\tindented with tab')).toBe(true);
    });

    test('should detect programming keywords as code-like', () => {
      const mockElement = {
        css: () => '',
        hasClass: () => false,
        find: () => ({ length: 0 })
      };

      const codePatterns = [
        'function test() {',
        'const x = 5;',
        'import React from "react";',
        'class MyClass {',
        'if (condition) {'
      ];

      codePatterns.forEach(pattern => {
        expect(isCodeLikeParagraph(mockElement, pattern)).toBe(true);
      });
    });

    test('should not detect normal prose as code-like', () => {
      const mockElement = {
        css: () => '',
        hasClass: () => false,
        find: () => ({ length: 0 })
      };

      const prosePatterns = [
        'This is a normal sentence.',
        'Here is some regular text without code patterns.',
        'The assignment requires you to implement the following:'
      ];

      prosePatterns.forEach(pattern => {
        expect(isCodeLikeParagraph(mockElement, pattern)).toBe(false);
      });
    });
  });
});
