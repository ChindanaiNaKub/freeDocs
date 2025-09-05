const { parseCodeContent, generateSanitizedHtml } = require('./src/utils/contentParser');

// Test with content that has already been escaped (like from Google Docs)
console.log('=== Testing Google Docs-like Pre-escaped Content ===');

const preEscapedXml = `&lt;dependency&gt;
    &lt;groupId&gt;org.projectlombok&lt;/groupId&gt;
    &lt;artifactId&gt;lombok&lt;/artifactId&gt;
    &lt;version&gt;1.18.34&lt;/version&gt;
    &lt;scope&gt;provided&lt;/scope&gt;
&lt;/dependency&gt;`;

console.log('Pre-escaped content (what Google Docs might give us):');
console.log(preEscapedXml);

const parsed = parseCodeContent(preEscapedXml, 'code');
console.log('\nLanguage detected:', parsed.language);
console.log('First line text:', parsed.lines[0].text);

const html = generateSanitizedHtml([parsed]);
console.log('\nGenerated HTML snippet:');
// Extract just the code part for clarity
const codeMatch = html.match(/<code>(.*?)<\/code>/s);
if (codeMatch) {
  console.log(codeMatch[1].substring(0, 300) + '...');
}

console.log('\n=== Testing with Diff Markers in Pre-escaped Content ===');

const preEscapedWithDiff = `+ &lt;dependency&gt;
+     &lt;groupId&gt;org.projectlombok&lt;/groupId&gt;
+     &lt;artifactId&gt;lombok&lt;/artifactId&gt;
+     &lt;version&gt;1.18.34&lt;/version&gt;
+     &lt;scope&gt;provided&lt;/scope&gt;
+ &lt;/dependency&gt;`;

const parsedDiff = parseCodeContent(preEscapedWithDiff, 'code');
console.log('Diff - Language detected:', parsedDiff.language);
console.log('Diff - Has changes:', parsedDiff.hasChanges);
console.log('Diff - First line text:', parsedDiff.lines[0].text);
console.log('Diff - First line original:', parsedDiff.lines[0].originalText);

const htmlDiff = generateSanitizedHtml([parsedDiff]);
const codeMatchDiff = htmlDiff.match(/<code>(.*?)<\/code>/s);
if (codeMatchDiff) {
  console.log('\nDiff HTML snippet:');
  console.log(codeMatchDiff[1].substring(0, 300) + '...');
}
