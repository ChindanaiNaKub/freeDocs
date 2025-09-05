const { parseArchivedContent } = require('./src/utils/contentParser');

async function testFormatting() {
  try {
    console.log('Testing Bold, Underline, and Link formatting detection...\n');
    
    const result = await parseArchivedContent('https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic');
    
    console.log('=== FORMATTING ANALYSIS ===\n');
    
    let formattedBlocks = 0;
    let totalBlocks = 0;
    
    result.blocks.forEach((block, index) => {
      totalBlocks++;
      
      if (block.hasFormatting) {
        formattedBlocks++;
        console.log(`Block ${index + 1} (${block.type}): HAS FORMATTING`);
        console.log(`  Text: ${block.text.substring(0, 100)}...`);
        console.log(`  HTML: ${block.html.substring(0, 150)}...`);
        console.log('');
      }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total blocks: ${totalBlocks}`);
    console.log(`Blocks with formatting: ${formattedBlocks}`);
    console.log(`Formatting detection rate: ${((formattedBlocks/totalBlocks) * 100).toFixed(1)}%`);
    
    // Check for specific formatting patterns
    console.log(`\n=== FORMATTING PATTERNS DETECTED ===`);
    
    const htmlContent = result.html;
    const boldCount = (htmlContent.match(/<strong>/g) || []).length;
    const italicCount = (htmlContent.match(/<em>/g) || []).length;
    const underlineCount = (htmlContent.match(/<u>/g) || []).length;
    const linkCount = (htmlContent.match(/<a\s/g) || []).length;
    
    console.log(`Bold text (<strong>): ${boldCount} instances`);
    console.log(`Italic text (<em>): ${italicCount} instances`);
    console.log(`Underlined text (<u>): ${underlineCount} instances`);
    console.log(`Links (<a>): ${linkCount} instances`);
    
    // Show a sample of the generated HTML
    console.log(`\n=== SAMPLE FORMATTED HTML ===`);
    console.log(htmlContent.substring(0, 500) + '...\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFormatting();
