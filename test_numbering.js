const fs = require('fs');
const { parseArchivedContent } = require('./src/utils/contentParser');

// Read the test HTML file
const htmlContent = fs.readFileSync('./07. Introduction to Spring boot.docx.html', 'utf8');

// Parse the content
parseArchivedContent(htmlContent, {
  autoDetectCode: true,
  showDeletions: true,
  extractImages: false
}).then(result => {
  // Find ordered lists and examine their numbering
  const orderedLists = result.blocks.filter(block => block.type === 'ordered-list');
  
  console.log('Found', orderedLists.length, 'ordered lists');
  
  orderedLists.forEach((list, listIndex) => {
    console.log(`\nList ${listIndex + 1}:`);
    console.log(`  Start value: ${list.startValue}`);
    console.log(`  Items: ${list.items.length}`);
    
    list.items.forEach((item, itemIndex) => {
      const number = item.customNumber !== undefined ? item.customNumber : (list.startValue + itemIndex);
      console.log(`    ${number}: ${item.text.substring(0, 50)}...`);
    });
  });
}).catch(error => {
  console.error('Error parsing content:', error);
});
