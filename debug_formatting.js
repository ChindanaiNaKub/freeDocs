const { parseArchivedContent } = require('./src/utils/contentParser');

async function debugFormatting() {
  try {
    console.log('🔍 DEBUG: Checking formatting detection...\n');
    
    const result = await parseArchivedContent('https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic');
    
    // Find the "Objective" block specifically
    const objectiveBlock = result.blocks.find(block => 
      block.text && block.text.includes('Objective:')
    );
    
    if (objectiveBlock) {
      console.log('=== OBJECTIVE BLOCK ANALYSIS ===');
      console.log('Text:', objectiveBlock.text.substring(0, 100) + '...');
      console.log('HTML:', objectiveBlock.html.substring(0, 200) + '...');
      console.log('Has Formatting:', objectiveBlock.hasFormatting);
      console.log('Block Type:', objectiveBlock.type);
      console.log('');
    }
    
    // Check the generated HTML output
    console.log('=== HTML OUTPUT SAMPLE ===');
    const htmlSnippet = result.html.substring(result.html.indexOf('Objective'), result.html.indexOf('Objective') + 200);
    console.log(htmlSnippet);
    console.log('');
    
    // Look for any blocks with actual formatting
    const formattedBlocks = result.blocks.filter(block => block.hasFormatting);
    console.log(`=== FORMATTED BLOCKS FOUND: ${formattedBlocks.length} ===`);
    
    formattedBlocks.slice(0, 3).forEach((block, i) => {
      console.log(`${i + 1}. Type: ${block.type}`);
      console.log(`   Text: ${block.text.substring(0, 80)}...`);
      console.log(`   HTML: ${block.html.substring(0, 120)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFormatting();
