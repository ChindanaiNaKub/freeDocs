const { parseContentBlocks, generateSanitizedHtml } = require('./src/utils/contentParser');
const cheerio = require('cheerio');

// Test the HTML generation for custom numbers
const testHtml = `
<html>
<body>
<div class="doc-content">
<p>1. Spring web server which will provide the REST api</p>
<p>1. Open your Intellij Idea (if you use other IDE, go to 1.8)</p>
<p>2. Note: If you have registered for the GitHub Student Pack</p>
<p>3. Create your new spring project</p>
</div>
</body>
</html>
`;

const $ = cheerio.load(testHtml);
const blocks = parseContentBlocks($, { autoDetectCode: true, showDeletions: true });

console.log('=== Generated HTML ===');
const html = generateSanitizedHtml(blocks);
console.log(html);

console.log('\n=== Looking for custom-number spans ===');
const customNumbers = html.match(/<span class="custom-number">[^<]+<\/span>/g);
if (customNumbers) {
  customNumbers.forEach((match, i) => {
    console.log(`Found ${i + 1}: ${match}`);
  });
} else {
  console.log('No custom-number spans found!');
}

console.log('\n=== Looking for data-custom-number attributes ===');
const dataCustomNumbers = html.match(/data-custom-number="[^"]+"/g);
if (dataCustomNumbers) {
  dataCustomNumbers.forEach((match, i) => {
    console.log(`Found ${i + 1}: ${match}`);
  });
} else {
  console.log('No data-custom-number attributes found!');
}
