const { parseArchivedContent } = require('./src/utils/contentParser');
const cheerio = require('cheerio');

// Test the numbered list parsing fix
console.log('=== Testing Numbered List Parsing Fix ===');

// Simulate HTML content that Google Docs might export with numbered lists as paragraphs
const testHtml = `
<html>
<body>
<div class="doc-content">
<h2>Introduction to Spring Boot</h2>
<p>1. Spring web server which will provide the REST api</p>
<p>1.1. Open your Intellij Idea (if you use other IDE, go to 1.8)</p>
<p>1.2. Note: If you have registered for the GitHub Student Pack, then you can register for the student license at https://www.jetbrains.com/community/education/ to use the Ultimate version of the software.</p>
<p>1.3. Create your new spring project by selecting a new project and selecting the data as shown in the picture</p>
<p>1.4. In the component, we now select nothing in this stage</p>
<p>Note that you may have to install Java version 17 to get all the features of the source code.</p>
</div>
</body>
</html>
`;

console.log('Input HTML:');
console.log(testHtml);

// Use the internal parsing functions directly for testing
const cheerio_instance = cheerio.load(testHtml, {
  decodeEntities: false,
  _useHtmlParser2: true,
  normalizeWhitespace: false
});

// Import the parsing functions we need to test
const { parseContentBlocks, generateSanitizedHtml } = require('./src/utils/contentParser');

try {
  const blocks = parseContentBlocks(cheerio_instance);
  
  console.log('\n=== Parsed Blocks ===');
  blocks.forEach((block, index) => {
    console.log(`Block ${index + 1}:`, {
      type: block.type,
      text: block.text ? block.text.substring(0, 50) + '...' : undefined,
      items: block.items ? block.items.map(item => ({
        type: item.type,
        text: item.text ? item.text.substring(0, 30) + '...' : undefined,
        customNumber: item.customNumber
      })) : undefined
    });
  });
  
  const html = generateSanitizedHtml(blocks);
  console.log('\n=== Generated HTML ===');
  console.log(html);
  
  // Check if the numbered list was parsed correctly
  const orderedListBlock = blocks.find(block => block.type === 'ordered-list');
  if (orderedListBlock) {
    console.log('\n=== Numbered List Analysis ===');
    console.log('Found ordered list with', orderedListBlock.items.length, 'items');
    orderedListBlock.items.forEach((item, index) => {
      console.log(`Item ${index + 1}: Number="${item.customNumber}", Text="${item.text.substring(0, 40)}..."`);
    });
  } else {
    console.log('\n❌ No ordered list block found - the fix may not be working');
  }
  
} catch (error) {
  console.error('Error during parsing:', error);
}
