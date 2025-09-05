const { parseArchivedContent } = require('./src/utils/contentParser');

async function testNumbering() {
  try {
    const result = await parseArchivedContent('https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic');
    
    console.log('Testing numbering fix...\n');
    
    const orderedLists = result.blocks.filter(block => block.type === 'ordered-list');
    
    orderedLists.forEach((list, listIndex) => {
      console.log(`List ${listIndex + 1}:`);
      list.items.forEach((item, itemIndex) => {
        if (item.customNumber) {
          console.log(`  ${item.customNumber}: ${item.text.substring(0, 80)}...`);
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNumbering();
