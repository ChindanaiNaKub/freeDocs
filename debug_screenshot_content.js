const { parseContentBlocks, generateSanitizedHtml } = require('./src/utils/contentParser');
const cheerio = require('cheerio');

console.log('=== Testing Actual Content from Screenshot ===\n');

// Content that matches what's shown in the screenshot
const actualContent = `
<html>
<body>
<div class="doc-content">
<p>Objective: In this session, You will start using Spring Boot development</p>
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

console.log('Input content represents the screenshot showing wrong numbering');
console.log('Expected: The "1." items should be numbered as 1.1, 1.2, 1.3, etc.\n');

const $ = cheerio.load(actualContent, {
  decodeEntities: false,
  _useHtmlParser2: true,
  normalizeWhitespace: false
});

const blocks = parseContentBlocks($);

console.log('=== Parsed Blocks Analysis ===');
blocks.forEach((block, index) => {
  if (block.type === 'ordered-list') {
    console.log(`Block ${index + 1}: ${block.type} with ${block.items.length} items:`);
    block.items.forEach((item, i) => {
      console.log(`  ${item.customNumber || (i + 1)}. ${item.text.substring(0, 60)}...`);
    });
  } else if (block.type === 'paragraph') {
    const text = block.text.substring(0, 60);
    console.log(`Block ${index + 1}: ${block.type} - "${text}..."`);
  } else {
    console.log(`Block ${index + 1}: ${block.type}`);
  }
});

// Check what the HTML output looks like
const html = generateSanitizedHtml(blocks);
console.log('\n=== Generated HTML (first 500 chars) ===');
console.log(html.substring(0, 500) + '...');

// Let's also test if the issue is in the number detection
console.log('\n=== Number Pattern Testing ===');
const testTexts = [
  "1. Spring web server which will provide the REST api",
  "1. Open your Intellij Idea (if you use other IDE, go to 1.8)",
  "2. Note: If you have registered for the GitHub Student Pack"
];

testTexts.forEach(text => {
  const match = text.match(/^(\d+(?:\.\d+)*)\.\s*(.*)$/);
  console.log(`Text: "${text}"`);
  console.log(`Match: ${match ? `Number="${match[1]}", Content="${match[2].substring(0, 30)}..."` : 'No match'}`);
  console.log('');
});
