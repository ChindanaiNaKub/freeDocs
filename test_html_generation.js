const { parseCodeContent } = require('./src/utils/contentParser');

// Generate HTML for the grouped content
function generateCodeBlockHtml(block) {
  const hasChanges = block.hasChanges;
  const copyId = `code-${Math.random().toString(36).substr(2, 9)}`;
  
  let html = `<div class="freedocs-code-block ${hasChanges ? 'has-changes' : ''}" data-language="${block.language}">\n`;
  
  if (hasChanges) {
    html += `<div class="freedocs-code-controls">
      <button class="copy-btn" data-mode="clean" data-target="${copyId}">Copy Clean</button>
      <button class="copy-btn" data-mode="additions" data-target="${copyId}">Copy Additions</button>
      <label class="toggle-deletions">
        <input type="checkbox" checked> Show deletions
      </label>
    </div>\n`;
  } else {
    html += `<div class="freedocs-code-controls">
      <button class="copy-btn" data-mode="all" data-target="${copyId}">Copy</button>
    </div>\n`;
  }
  
  html += `<pre class="freedocs-code" id="${copyId}"><code>`;
  
  block.lines.forEach(line => {
    const classes = [`line-${line.op}`];
    const dataAttrs = `data-op="${line.op}"`;
    
    // Use the original text but ensure proper escaping
    const textToDisplay = line.originalText;
    const safeText = escapeHtml(textToDisplay);
    
    html += `<span class="${classes.join(' ')}" ${dataAttrs}>${safeText}</span>\n`;
  });
  
  html += '</code></pre>\n</div>\n';
  
  return html;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Test with mixed dependencies
const mixedDiffContent = `<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
    <scope>provided</scope>
</dependency>

+ <dependency>
+     <groupId>org.springframework</groupId>
+     <artifactId>spring-core</artifactId>
+     <version>5.3.21</version>
+ </dependency>

- <dependency>
-     <groupId>junit</groupId>
-     <artifactId>junit</artifactId>
-     <version>4.12</version>
- </dependency>`;

console.log('Testing HTML generation with grouped XML...');
const parsed = parseCodeContent(mixedDiffContent, 'code');
const html = generateCodeBlockHtml(parsed);

console.log('Generated HTML:');
console.log(html);

console.log('\nNumber of grouped blocks:', parsed.lines.length);
console.log('Block details:');
parsed.lines.forEach((line, index) => {
  if (line.isGrouped) {
    console.log(`Block ${index + 1}: ${line.op} (grouped ${line.groupSize} lines)`);
  } else {
    console.log(`Block ${index + 1}: ${line.op} (single line)`);
  }
});
