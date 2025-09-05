const { parseList, calculateGoogleDocsNumber } = require('./src/utils/contentParser');
const cheerio = require('cheerio');

// Test the specific HTML pattern we found
const testHtml = `
<ol class="lst-kix_list_1-1" start="4">
  <li>In the component, we now select nothing in this stage</li>
</ol>
<ol class="lst-kix_list_1-1" start="5">
  <li>Wait for the IDE finish indexing</li>
  <li>Open the pom.xml</li>
  <li>If you do not use the IntelliJ</li>
</ol>
`;

function testHierarchicalNumbering() {
  console.log('Testing hierarchical numbering fix...\n');
  
  const $ = cheerio.load(testHtml);
  
  $('ol').each((index, element) => {
    const $ol = $(element);
    const result = parseList($, $ol);
    
    console.log(`List ${index + 1}:`);
    console.log(`  Classes: ${$ol.attr('class')}`);
    console.log(`  Start: ${$ol.attr('start')}`);
    console.log(`  Items:`);
    
    result.items.forEach((item, itemIndex) => {
      const number = item.customNumber || (itemIndex + 1);
      console.log(`    ${number}: ${item.text}`);
    });
    console.log('');
  });
}

testHierarchicalNumbering();
