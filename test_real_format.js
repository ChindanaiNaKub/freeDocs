const { parseArchivedContent } = require('./src/utils/contentParser');
const cheerio = require('cheerio');

// Test with the exact format you're seeing
console.log('=== Testing Real Google Docs Format Issue ===');

// This simulates what Google Docs might actually export
const realGoogleDocsHtml = `
<html>
<body>
<div class="doc-content">
<p>Suggestion you should read the instructions step by step. Please try to answer a question by question without skipping some questions that you think it is extremely difficult.</p>
<p>Hint: The symbol + and – in front of the source code shows that you have to remove the source code and add the source code only. There are not the part of the source code</p>
<p>1. Spring web server which will provide the REST api</p>
<p>1. Open your Intellij Idea (if you use other IDE, go to 1.8)</p>
<p>2. Note: If you have registered for the GitHub Student Pack, then you can register for the student license at https://www.jetbrains.com/community/education/ to use the Ultimate version of the software.</p>
<p>3. Create your new spring project by selecting a new project and selecting the data as shown in the picture</p>
<p>Note that you may have to install Java version 17 to get all the features of the source code.</p>
<p>1. In the component, we now select nothing in this stage</p>
<p>1. Wait for the IDE finish indexing (see on the taskbar of the IDE)</p>
<p>2. Open the pom.xml, See what is inside the Pom file?</p>
<p>3. If you do not use the Intellij, you can go to https://start.spring.io/ create the project using the information provided in 1.6, and download, you will receive the project template, and then we can continue the lab</p>
<p>1. Creating the entity</p>
<p>1. Add the component which will help us to create the entity, update the pom.xml as given</p>
</div>
</body>
</html>
`;

const $ = cheerio.load(realGoogleDocsHtml);

async function testRealFormat() {
  try {
    // Parse the content like the real application would
    const { blocks } = await parseArchivedContent('fake-url', {
      autoDetectCode: true,
      showDeletions: true
    });
    
    console.log('=== Parsed Blocks ===');
    blocks.forEach((block, index) => {
      console.log(`Block ${index + 1}: ${block.type}`);
      if (block.items) {
        block.items.forEach((item, i) => {
          console.log(`  Item ${i + 1}: Number="${item.customNumber}", Text="${item.text.substring(0, 50)}..."`);
        });
      } else if (block.text) {
        console.log(`  Text: "${block.text.substring(0, 80)}..."`);
      }
    });
    
  } catch (error) {
    // Fallback to direct parsing
    console.log('Using fallback parsing...');
    
    const { parseContentBlocks } = require('./src/utils/contentParser');
    const blocks = parseContentBlocks($, {
      autoDetectCode: true,
      showDeletions: true
    });
    
    console.log('=== Parsed Blocks (Fallback) ===');
    blocks.forEach((block, index) => {
      console.log(`Block ${index + 1}: ${block.type}`);
      if (block.items) {
        block.items.forEach((item, i) => {
          console.log(`  Item ${i + 1}: Number="${item.customNumber}", Text="${item.text.substring(0, 50)}..."`);
        });
      } else if (block.text) {
        console.log(`  Text: "${block.text.substring(0, 80)}..."`);
      }
    });
  }
}

testRealFormat();
