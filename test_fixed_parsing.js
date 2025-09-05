const { parseCodeContent, generateSanitizedHtml, escapeHtml, unescapeHtml } = require('./src/utils/contentParser');

// Test the fixed XML parsing
console.log('=== Testing HTML Escape/Unescape ===');
const xmlText = '<scope>provided</scope>';
console.log('Original:', xmlText);
console.log('Escaped:', escapeHtml(xmlText));
console.log('Double escaped (problem):', escapeHtml(escapeHtml(xmlText)));
console.log('Unescaped from double:', unescapeHtml(escapeHtml(escapeHtml(xmlText))));

console.log('\n=== Testing XML Content Parsing ===');
const xmlContent = `<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
    <scope>provided</scope>
</dependency>`;

const parsed = parseCodeContent(xmlContent, 'code');
console.log('Language detected:', parsed.language);

console.log('\n=== Testing HTML Generation ===');
const blocks = [parsed];
const html = generateSanitizedHtml(blocks);
console.log('Generated HTML preview:');
console.log(html.substring(0, 500) + '...');

console.log('\n=== Testing with Diff Markers ===');
const xmlWithDiff = `+ <dependency>
+     <groupId>org.projectlombok</groupId>
+     <artifactId>lombok</artifactId>
+     <version>1.18.34</version>
+     <scope>provided</scope>
+ </dependency>`;

const parsedDiff = parseCodeContent(xmlWithDiff, 'code');
console.log('Language detected for diff:', parsedDiff.language);
console.log('Has changes:', parsedDiff.hasChanges);

const htmlDiff = generateSanitizedHtml([parsedDiff]);
console.log('\nDiff HTML preview:');
console.log(htmlDiff.substring(0, 800) + '...');
