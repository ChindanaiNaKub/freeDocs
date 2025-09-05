const fs = require('fs');
const cheerio = require('cheerio');

// Read the test HTML file
const htmlContent = fs.readFileSync('./07. Introduction to Spring boot.docx.html', 'utf8');
const $ = cheerio.load(htmlContent);

// Find ordered lists with lst-kix classes
const orderedLists = $('ol[class*="lst-kix"]');

console.log(`Found ${orderedLists.length} ordered lists with lst-kix classes`);

orderedLists.each((index, el) => {
  const $list = $(el);
  const className = $list.attr('class');
  const startValue = $list.attr('start');
  const itemCount = $list.find('li').length;
  
  console.log(`\nList ${index + 1}:`);
  console.log(`  Class: ${className}`);
  console.log(`  Start: ${startValue}`);
  console.log(`  Items: ${itemCount}`);
  
  $list.find('li').each((itemIndex, li) => {
    const $li = $(li);
    const text = $li.text().trim().substring(0, 80);
    console.log(`    Item ${itemIndex}: ${text}...`);
  });
});
