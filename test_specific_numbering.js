const contentParser = require('./src/utils/contentParser');

async function testSpecificNumbering() {
  try {
    console.log('Testing specific hierarchical numbering...');
    
    const url = 'https://web.archive.org/web/20250904104644/https://docs.google.com/document/d/e/2PACX-1vR7xH_XOJr-Zqa3RHnUQFOr3ESlhHg1VvjSHu7xEV6x3HEZb_hPZN71yYqO7x_Kng/pub?urp=gmail_link';
    
    const result = await contentParser.parseArchivedContent(url, {
      autoDetectCode: true,
      showDeletions: true,
      extractImages: false
    });
    
    // Find the specific list items that were problematic
    console.log('\n=== Looking for hierarchical numbering ===');
    result.content.forEach((block, index) => {
      if (block.type === 'list') {
        // Look for level 1 lists (lst-kix_list_1-1) that had start="4"
        block.items.forEach((item, itemIndex) => {
          if (item.number && item.number.includes('.')) {
            console.log(`Block ${index}, Item ${itemIndex}: "${item.number}" - ${item.text.substring(0, 100)}...`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSpecificNumbering();
