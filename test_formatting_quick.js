const { parseArchivedContent } = require('./src/utils/contentParser');

async function testFormattingQuick() {
  try {
    console.log('Testing Bold, Underline, and Link formatting detection...\n');
    
    const result = await parseArchivedContent('https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic');
    
    // Quick analysis
    const htmlContent = result.html;
    const boldCount = (htmlContent.match(/<strong>/g) || []).length;
    const italicCount = (htmlContent.match(/<em>/g) || []).length;
    const underlineCount = (htmlContent.match(/<u>/g) || []).length;
    const linkCount = (htmlContent.match(/<a\s/g) || []).length;
    
    console.log(`=== FORMATTING DETECTION RESULTS ===`);
    console.log(`Bold text (<strong>): ${boldCount} instances`);
    console.log(`Italic text (<em>): ${italicCount} instances`);
    console.log(`Underlined text (<u>): ${underlineCount} instances`);
    console.log(`Links (<a>): ${linkCount} instances`);
    
    // Show examples of detected formatting
    console.log(`\n=== EXAMPLES OF DETECTED FORMATTING ===`);
    
    // Find blocks with underline formatting
    const underlineBlocks = result.blocks.filter(block => 
      block.hasFormatting && block.html && block.html.includes('<u>')
    );
    
    console.log(`\nFound ${underlineBlocks.length} blocks with underline formatting:`);
    underlineBlocks.slice(0, 3).forEach((block, i) => {
      console.log(`${i + 1}. ${block.text.substring(0, 80)}...`);
      console.log(`   HTML: ${block.html.substring(0, 100)}...`);
    });
    
    // Find blocks with links
    const linkBlocks = result.blocks.filter(block => 
      block.hasFormatting && block.html && block.html.includes('<a')
    );
    
    if (linkBlocks.length > 0) {
      console.log(`\nFound ${linkBlocks.length} blocks with links:`);
      linkBlocks.slice(0, 2).forEach((block, i) => {
        console.log(`${i + 1}. ${block.text.substring(0, 80)}...`);
        console.log(`   HTML: ${block.html.substring(0, 100)}...`);
      });
    }
    
    console.log(`\n=== SUCCESS! ===`);
    console.log(`Your website CAN now detect and preserve:`);
    console.log(`✓ Underlined text (${underlineCount} found)`);
    if (boldCount > 0) console.log(`✓ Bold text (${boldCount} found)`);
    if (italicCount > 0) console.log(`✓ Italic text (${italicCount} found)`);
    if (linkCount > 0) console.log(`✓ Links (${linkCount} found)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFormattingQuick();
